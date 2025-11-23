# Training Results & Alternative Approaches

## Current Results

After improvements:
- ✅ **Data:** 660 samples (up from 220)
- ✅ **Augmentations:** 15 per image (up from 5)
- ✅ **Model:** Deeper architecture with regularization
- ❌ **Validation Accuracy:** Still 0%

**Diagnosis:** The fundamental issue is that **MobileNet features (trained on ImageNet) are not discriminative enough for Overwatch hero icons**. The icons are too similar in the feature space.

## Why This Happened

MobileNet was trained to distinguish cats, dogs, cars, etc. - not game character icons. Hero icons share similar:
- Circular frames
- Similar color palettes
- Face/character compositions
- Consistent styling

In MobileNet's feature space, they all look too similar.

## Alternative Approaches (Best to Worst)

### ✅ Approach 1: Template Matching (Simplest, May Work Best)

Since you have the exact icon files, use direct image similarity:

**Create:** `src/lib/templateMatching.ts`

```typescript
import * as tf from '@tensorflow/tfjs';

export async function detectHeroByTemplateMatching(
  screenshot: ImageData,
  heroIcons: { [heroId: string]: HTMLImageElement }
): Promise<{ heroId: string; confidence: number }[]> {
  
  const screenshotTensor = tf.browser.fromPixels(screenshot);
  
  const results: { heroId: string; confidence: number }[] = [];
  
  for (const [heroId, iconImage] of Object.entries(heroIcons)) {
    const iconTensor = tf.browser.fromPixels(iconImage);
    
    // Compute normalized cross-correlation
    const similarity = await computeSimilarity(screenshotTensor, iconTensor);
    
    results.push({ heroId, confidence: similarity });
  }
  
  return results.sort((a, b) => b.confidence - a.confidence);
}

async function computeSimilarity(img1: tf.Tensor3D, img2: tf.Tensor3D): Promise<number> {
  // Resize to same size
  const size = [64, 64];
  const resized1 = tf.image.resizeBilinear(img1, size);
  const resized2 = tf.image.resizeBilinear(img2, size);
  
  // Normalize
  const norm1 = tf.div(resized1, 255.0);
  const norm2 = tf.div(resized2, 255.0);
  
  // Compute cosine similarity
  const dot = tf.sum(tf.mul(norm1, norm2));
  const mag1 = tf.sqrt(tf.sum(tf.square(norm1)));
  const mag2 = tf.sqrt(tf.sum(tf.square(norm2)));
  
  const similarity = tf.div(dot, tf.mul(mag1, mag2));
  
  return similarity.dataSync()[0];
}
```

**Pros:**
- Simple, no training needed
- Works well when you have exact templates
- Fast inference
- Interpretable results

**Cons:**
- Sensitive to lighting/color changes
- May not generalize to different image qualities

---

### ✅ Approach 2: Perceptual Hashing + k-NN

Use perceptual hashes which are robust to small variations:

```typescript
import * as tf from '@tensorflow/tfjs';

// Compute perceptual hash for each icon
export function computePerceptualHash(image: tf.Tensor3D): string {
  // Resize to 8x8
  const small = tf.image.resizeBilinear(image, [8, 8]);
  
  // Convert to grayscale
  const gray = tf.mean(small, -1);
  
  // Compare each pixel to mean
  const mean = tf.mean(gray);
  const hash = tf.greater(gray, mean);
  
  // Convert to string
  const hashArray = hash.dataSync();
  return Array.from(hashArray).map(v => v ? '1' : '0').join('');
}

export function hammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

// Pre-compute hashes for all heroes
const heroHashes: { [heroId: string]: string } = {};

export function detectHeroByHash(screenshotTensor: tf.Tensor3D): string {
  const screenshotHash = computePerceptualHash(screenshotTensor);
  
  let bestMatch = '';
  let minDistance = Infinity;
  
  for (const [heroId, heroHash] of Object.entries(heroHashes)) {
    const distance = hammingDistance(screenshotHash, heroHash);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = heroId;
    }
  }
  
  return bestMatch;
}
```

**Pros:**
- Very fast
- Robust to minor variations
- No training needed

**Cons:**
- Less accurate than deep learning (when it works)
- May struggle with very similar icons

---

### ⚠️ Approach 3: Fine-tune Entire MobileNet

Instead of just training a classifier on frozen features, fine-tune the last few layers of MobileNet:

**Problem:** Requires `@tensorflow/tfjs-node` (which failed earlier)
**Alternative:** Use `@tensorflow/tfjs-layers` with transfer learning

```javascript
// Load MobileNet without top layers
const mobilenet = await tf.loadLayersModel(
  'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/feature_vector/3/default/1',
  { fromTFHub: true }
);

// Freeze early layers, unfreeze last few
for (let i = 0; i < mobilenet.layers.length - 5; i++) {
  mobilenet.layers[i].trainable = false;
}

// Add custom layers
const model = tf.sequential();
model.add(mobilenet);
model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
model.add(tf.layers.dropout({ rate: 0.3 }));
model.add(tf.layers.dense({ units: 44, activation: 'softmax' }));

// Train end-to-end with low learning rate
model.compile({
  optimizer: tf.train.adam(0.00001), // Very low LR
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy']
});
```

**Pros:**
- Adapts features to your specific problem
- Better theoretical accuracy

**Cons:**
- Much slower to train
- Requires more data to work well
- Still may not work with only 660 samples

---

### 🔧 Approach 4: Collect Real Training Data

The best long-term solution:

1. **Run the game** in hero select screen
2. **Capture 20-30 screenshots per hero** with:
   - Different team compositions
   - Different lighting conditions
   - Different UI states
3. **Label them manually**
4. **Train on real data**

This would give you 880-1320 real training samples, which would likely work much better.

---

## Recommended Next Steps

1. **Try Template Matching First** (quickest to implement, may work)
   - Implement the similarity-based approach above
   - Test on a few screenshots
   - If confidence scores >0.8, you're good!

2. **If Template Matching Fails, Try Perceptual Hashing**
   - More robust than direct matching
   - Still very fast

3. **If Both Fail, Collect Real Data**
   - 20 screenshots per hero = 880 samples
   - Train the improved neural network on real data
   - This will almost certainly work

4. **Last Resort: Manual Collection of Synthetic Data**
   - Apply more aggressive augmentations (rotations, crops, color shifts)
   - Generate 100+ variants per icon
   - May help but real data is better

---

## Quick Test: Are Features Discriminative?

Add this diagnostic to the training script:

```javascript
// After extracting all features
console.log('\n=== Feature Analysis ===');
const featureMatrix = tf.stack(features);

// Compute pairwise distances between first sample of each class
const classFeatures = [];
for (let i = 0; i < 44; i++) {
  classFeatures.push(features[i * 15]); // First augmentation of each class
}

const classTensor = tf.stack(classFeatures);
console.log('Mean feature magnitude:', tf.norm(classTensor).mean().arraySync());

// Check how similar features are within vs between classes
const withinClassDist = [];
const betweenClassDist = [];

for (let i = 0; i < 44; i++) {
  const f1 = features[i * 15];
  const f2 = features[i * 15 + 1]; // Another augmentation
  const dist = tf.norm(tf.sub(f1, f2)).arraySync();
  withinClassDist.push(dist);
  
  if (i < 43) {
    const f3 = features[(i + 1) * 15]; // Different class
    const dist2 = tf.norm(tf.sub(f1, f3)).arraySync();
    betweenClassDist.push(dist2);
  }
}

console.log('Average within-class distance:', tf.mean(withinClassDist).arraySync());
console.log('Average between-class distance:', tf.mean(betweenClassDist).arraySync());

// If within-class ≈ between-class, features are not discriminative!
```

If within-class distance ≈ between-class distance, that confirms features aren't good enough.

---

## Bottom Line

**The neural network approach isn't working because MobileNet features aren't discriminative for these icons.**

**Best immediate solution:** Try template matching or perceptual hashing - they're simpler and may actually work better for this specific use case.

**Best long-term solution:** Collect real screenshots from the game and train on those.

