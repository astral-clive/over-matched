# Training Accuracy Improvements

## Problem Analysis

**Original Performance:**

- Validation Accuracy: 0.00%
- Training samples: 220 (44 heroes × 5 augmentations)
- **Root cause:** Only ~5 samples per class is insufficient for 44-class classification

## Improvements Applied

### 1. ✅ Dramatically Increased Data Augmentation (5 → 15 per image)

**New augmentations include:**

- Original image
- Horizontal flip
- 3 brightness levels (dark, medium, bright)
- 3 contrast levels (low, high, very high)
- 4 rotations (0°, 90°, 180°, 270°)
- Flipped + bright/dark combinations
- Center crop (simulates zoom)
- Random noise injection

**Result:** 44 heroes × 15 augmentations = **660 training samples** (3x increase)

### 2. ✅ Improved Model Architecture

**Before:**

```javascript
Dense(128) → Dropout(0.5) → Dense(44)
```

**Problems:** Too simple, high dropout causes underfitting on small data

**After:**

```javascript
Dense(256, L2=0.001) → Dropout(0.3) →
Dense(128, L2=0.001) → Dropout(0.2) →
Dense(44)
```

**Benefits:**

- More capacity to learn 44 classes
- L2 regularization prevents overfitting
- Reduced dropout (0.3/0.2 instead of 0.5)
- Two hidden layers capture more complex patterns

### 3. ✅ Optimized Training Parameters

| Parameter        | Before | After  | Reasoning                           |
| ---------------- | ------ | ------ | ----------------------------------- |
| Epochs           | 10     | 100    | Allow longer training               |
| Learning Rate    | 0.001  | 0.0005 | Slower, more stable convergence     |
| Validation Split | 0.2    | 0.15   | More data for training              |
| Batch Size       | 32     | 32     | Keep same (good for small datasets) |

### 4. ✅ Advanced Training Features

**Early Stopping:**

- Stops training if no improvement for 20 epochs
- Prevents wasted computation on plateaued models

**Learning Rate Scheduling:**

- Reduces LR by 50% if no improvement for 10 epochs
- Helps escape local minima
- Allows fine-tuning near convergence

**Better Monitoring:**

- Tracks best validation accuracy
- Logs learning rate changes
- Shows progress at each epoch

## Expected Results

### Overnight Training Expectations

**Training Time:**

- Feature extraction: ~3-5 minutes (parallelized)
- Training 100 epochs on 660 samples: ~10-20 minutes
- **Total: ~15-25 minutes** (not overnight needed!)

**Expected Accuracy:**

- **Realistic target:** 40-70% validation accuracy
- **Good target:** 70-85% validation accuracy
- **Optimistic target:** 85-95% validation accuracy

### Why Accuracy Should Improve Now

1. **15x more data per class** (1 → 15 samples)
2. **More complex model** can learn subtle differences
3. **Regularization** prevents memorization
4. **Adaptive learning rate** finds better solutions
5. **Early stopping** prevents overfitting

## Running the Improved Training

```bash
npm run train
```

The script will:

1. Load 44 hero icons
2. Generate 15 augmentations per icon (660 total)
3. Extract MobileNet features (parallelized, ~3-5 min)
4. Train for up to 100 epochs with early stopping
5. Save the best model automatically

## Monitoring Training Progress

Watch for these signs of successful training:

✅ **Good signs:**

```
Epoch 1/100 - val_acc: 0.0455
Epoch 5/100 - val_acc: 0.1212
Epoch 10/100 - val_acc: 0.2424
Epoch 20/100 - val_acc: 0.4545
```

Loss decreasing, accuracy increasing = **Learning is happening!**

❌ **Bad signs:**

```
Epoch 1/100 - val_acc: 0.0000
Epoch 10/100 - val_acc: 0.0000
Epoch 20/100 - val_acc: 0.0000
```

Stuck at zero = **Model not learning** (see troubleshooting below)

## If Accuracy Still Doesn't Improve

### Diagnostic: Check Feature Quality

Add this test before training (in the script):

```javascript
// After extracting features
console.log("Feature statistics:");
const allFeatures = tf.stack(features);
console.log("  Mean:", allFeatures.mean().arraySync());
console.log("  Std:", tf.moments(allFeatures).variance.sqrt().arraySync());
console.log("  Min:", allFeatures.min().arraySync());
console.log("  Max:", allFeatures.max().arraySync());
```

**Good features:** Mean ~0.5, Std >0.1, Min/Max span reasonable range
**Bad features:** All near zero, very small std dev = features not discriminative

### Fallback Option 1: Simpler Classifier

If neural network doesn't work, try k-Nearest Neighbors:

```javascript
// Instead of training NN, use k-NN on features
// For prediction: find k=5 nearest training samples and vote
```

### Fallback Option 2: Collect Real Screenshots

The icon-based training might not transfer well to in-game screenshots.

**Better approach:**

1. Capture 10-20 screenshots per hero from actual gameplay
2. Label them manually
3. Train on real data instead of icon files

### Fallback Option 3: Template Matching

For very distinct hero icons, simple template matching might work better:

```javascript
// Compare test image to each hero icon using correlation
// Return hero with highest similarity score
```

## Next Steps After Training

1. **Check metadata.json** for `bestValAccuracy`
2. **If >60%:** Model is usable, test on real screenshots
3. **If 30-60%:** Marginal, may need more data
4. **If <30%:** Try fallback approaches above

## Configuration Tweaks for Experimentation

In `train-hero-classifier.js`:

```javascript
// Try these if needed:
const AUGMENTATIONS_PER_IMAGE = 20; // Even more augmentation
const LEARNING_RATE = 0.0001; // Even slower learning
const EPOCHS = 200; // More epochs
const PARALLEL_BATCH_SIZE = 10; // Reduce if OOM errors
```

## Understanding the Output Files

After training:

```
public/models/hero-classifier/
├── model.json          # Model architecture
├── weights.bin         # Trained weights (~600KB)
└── metadata.json       # Class mappings + training stats
```

Check `metadata.json`:

```json
{
  "bestValAccuracy": 0.7272, // 72.72% - good!
  "totalTrainingSamples": 660,
  "augmentationsPerImage": 15
}
```

## Summary

The training should now:

- ✅ Have 3x more training data (660 samples)
- ✅ Use a more powerful model architecture
- ✅ Train longer with adaptive learning
- ✅ Stop automatically when done learning
- ✅ Complete in 15-25 minutes (not overnight)

**Run `npm run train` and watch the validation accuracy climb!**
