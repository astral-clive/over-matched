/**
 * Training Script for Hero Icon Classifier
 * 
 * This script trains a TensorFlow.js model to classify hero icons using
 * MobileNet transfer learning. It loads all hero icons from public/heroes,
 * generates augmented training data, and exports a trained model.
 * 
 * Run with: node scripts/train-hero-classifier.js
 */

// Try to use tfjs-node, fall back to regular tfjs if it fails
let tf;
try {
  tf = require('@tensorflow/tfjs-node');
  console.log('Using @tensorflow/tfjs-node (GPU-accelerated)');
} catch (error) {
  tf = require('@tensorflow/tfjs');
  console.log('Using @tensorflow/tfjs (CPU fallback)');
}

const mobilenet = require('@tensorflow-models/mobilenet');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Configuration
const INPUT_SIZE = 224; // MobileNet input size
const BATCH_SIZE = 32;
const EPOCHS = 100; // Increased for overnight training
const LEARNING_RATE = 0.0005; // Reduced learning rate for better convergence
const PARALLEL_BATCH_SIZE = 20; // Feature extraction parallelization
const AUGMENTATIONS_PER_IMAGE = 15; // Increased from 5 to 15

// Hero icon mapping - maps hero IDs to their image filenames
// This should match the files in public/heroes/
const HERO_ICON_MAP = {
  "ana": "Icon-Ana.webp",
  "ashe": "Icon-Ashe.webp",
  "baptiste": "Icon-Baptiste.png",
  "bastion": "Icon-Bastion.webp",
  "brigitte": "Icon-Brigitte.webp",
  "cassidy": "Icon-Cassidy.webp",
  "doomfist": "Icon-Doomfist.webp",
  "dva": "Icon-DVa.webp",
  "echo": "Icon-Echo.webp",
  "freja": "Icon-Freja.webp",
  "genji": "Icon-Genji.webp",
  "hanzo": "Icon-Hanzo.webp",
  "hazard": "Icon-Hazard.webp",
  "illari": "Icon-Illari.webp",
  "junkrat": "Icon-Junkrat.webp",
  "juno": "Icon-Juno.webp",
  "kiriko": "Icon-kiriko.webp",
  "lifeweaver": "Icon-Lifeweaver.webp",
  "lucio": "Icon-Lúcio.png",
  "mei": "Icon-Mei.webp",
  "mercy": "Icon-Mercy.png",
  "moira": "Icon-Moira.webp",
  "orisa": "Icon-Orisa.webp",
  "pharah": "Icon-Pharah.webp",
  "ramattra": "Icon-Ramattra.webp",
  "reaper": "Icon-Reaper.webp",
  "reinhardt": "Icon-Reinhardt.webp",
  "roadhog": "Icon-Roadhog.webp",
  "sigma": "Icon-Sigma.webp",
  "sojourn": "Icon-Sojourn.webp",
  "soldier-76": "Icon-Soldier_76.webp",
  "sombra": "Icon-Sombra.webp",
  "symmetra": "Icon-Symmetra.webp",
  "torbjorn": "Icon-Torbj%3Frn.webp",
  "tracer": "Icon-Tracer.webp",
  "venture": "Icon-Venture.webp",
  "widowmaker": "Icon-Widowmaker.webp",
  "winston": "Icon-Winston.webp",
  "wrecking-ball": "Icon-Wrecking_Ball.webp",
  "wuyang": "Icon-Wuyang.webp",
  "zarya": "Icon-Zarya.webp",
  "zenyatta": "Icon-Zenyatta.webp",
  "junker-queen": "junker_queen.webp",
  "mauga": "mauga.webp"
};

/**
 * Load and preprocess an image
 */
async function loadImage(imagePath) {
  try {
    const buffer = await fs.readFile(imagePath);
    
    // Convert to raw RGB pixels using sharp, ensuring 3 channels (no alpha)
    const { data, info } = await sharp(buffer)
      .resize(INPUT_SIZE, INPUT_SIZE)
      .removeAlpha()  // Remove alpha channel if present
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Verify we have the correct number of values
    const expectedValues = INPUT_SIZE * INPUT_SIZE * 3;
    if (data.length !== expectedValues) {
      throw new Error(`Expected ${expectedValues} values but got ${data.length}`);
    }
    
    // Create tensor from raw RGB data
    const tensor = tf.tensor3d(
      new Uint8Array(data), 
      [INPUT_SIZE, INPUT_SIZE, 3]
    );
    
    // Normalize to [0, 1] range (MobileNet expects this)
    const normalized = tensor.div(255.0);
    tensor.dispose();
    return normalized;
  } catch (error) {
    console.error(`Error loading image ${imagePath}:`, error);
    return null;
  }
}

/**
 * Augment an image tensor with diverse transformations
 */
function augmentImage(tensor) {
  const augmented = [];
  
  // 1. Original
  augmented.push(tensor);
  
  // 2. Horizontal flip
  const flipped = tf.reverse(tensor, 1);
  augmented.push(flipped);
  
  // 3-5. Brightness variations (more levels)
  augmented.push(tf.clipByValue(tensor.add(0.3), 0, 1));  // Bright
  augmented.push(tf.clipByValue(tensor.add(0.15), 0, 1)); // Medium bright
  augmented.push(tf.clipByValue(tensor.sub(0.3), 0, 1));  // Dark
  
  // 6-8. Contrast variations
  const mean = tensor.mean();
  augmented.push(tf.clipByValue(tensor.sub(mean).mul(1.3).add(mean), 0, 1)); // High contrast
  augmented.push(tf.clipByValue(tensor.sub(mean).mul(0.7).add(mean), 0, 1)); // Low contrast
  augmented.push(tf.clipByValue(tensor.sub(mean).mul(1.5).add(mean), 0, 1)); // Very high contrast
  
  // 9. Rotation 90°
  const rotated90 = tf.reverse(tf.transpose(tensor, [1, 0, 2]), 0);
  augmented.push(rotated90);
  
  // 10. Rotation 180°
  const rotated180 = tf.reverse(tf.reverse(tensor, 0), 1);
  augmented.push(rotated180);
  
  // 11. Rotation 270°
  const rotated270 = tf.reverse(tf.transpose(tensor, [1, 0, 2]), 1);
  augmented.push(rotated270);
  
  // 12. Flipped + bright
  augmented.push(tf.clipByValue(flipped.add(0.2), 0, 1));
  
  // 13. Flipped + dark
  augmented.push(tf.clipByValue(flipped.sub(0.2), 0, 1));
  
  // 14. Slight zoom (center crop and resize)
  const cropped = tf.image.cropAndResize(
    tensor.expandDims(0),
    [[0.1, 0.1, 0.9, 0.9]], // Crop 10% from each edge
    [0],
    [INPUT_SIZE, INPUT_SIZE]
  ).squeeze();
  augmented.push(cropped);
  
  // 15. Noise injection
  const noise = tf.randomUniform(tensor.shape, -0.05, 0.05);
  const noisy = tf.clipByValue(tensor.add(noise), 0, 1);
  augmented.push(noisy);
  
  return augmented;
}

/**
 * Load all hero icons and create training dataset
 */
async function loadTrainingData() {
  console.log('Loading hero icons...');
  const heroesDir = path.join(__dirname, '../public/heroes');
  console.log('Heroes directory:', heroesDir);
  console.log('Resolved path:', path.resolve(heroesDir));
  
  const trainingData = [];
  const heroIdToIndex = {};
  let classIndex = 0;
  
  // Create mapping from hero ID to class index
  for (const [heroId, imageFile] of Object.entries(HERO_ICON_MAP)) {
    const imagePath = path.join(heroesDir, imageFile);
    
    try {
      await fs.access(imagePath);
      heroIdToIndex[heroId] = classIndex;
      
      console.log(`Loading ${heroId} (${imageFile})...`);
      const tensor = await loadImage(imagePath);
      
      if (tensor) {
        // Augment the image
        const augmented = augmentImage(tensor);
        for (const augTensor of augmented) {
          trainingData.push({
            image: augTensor,
            label: classIndex,
            heroId: heroId
          });
        }
        classIndex++;
      } else {
        console.warn(`Skipping ${heroId} - loadImage returned null`);
      }
    } catch (error) {
      console.warn(`Skipping ${heroId} - error: ${error.message}`);
      console.warn(`  Path: ${imagePath}`);
    }
  }
  
  console.log(`Loaded ${trainingData.length} training samples for ${classIndex} heroes`);
  return { trainingData, heroIdToIndex, numClasses: classIndex };
}

/**
 * Extract features using MobileNet
 */
async function extractFeatures(mobilenetModel, imageTensor) {
  // MobileNet infer with embedding=true returns feature vector
  return mobilenetModel.infer(imageTensor, true);
}

/**
 * Train the model
 */
async function trainModel() {
  console.log('Initializing MobileNet...');
  const mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
  
  console.log('Loading training data...');
  const { trainingData, heroIdToIndex, numClasses } = await loadTrainingData();
  
  if (trainingData.length === 0) {
    throw new Error('No training data loaded!');
  }
  
  console.log(`Creating model for ${numClasses} classes...`);
  
  // Extract features from all images (parallelized in batches)
  console.log('Extracting features with MobileNet...');
  const features = [];
  const labels = [];
  
  const PARALLEL_BATCH_SIZE = 20; // Process 20 images at a time
  
  for (let batchStart = 0; batchStart < trainingData.length; batchStart += PARALLEL_BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + PARALLEL_BATCH_SIZE, trainingData.length);
    console.log(`Processing batch ${batchStart}-${batchEnd}/${trainingData.length}...`);
    
    // Process this batch in parallel
    const batchPromises = [];
    for (let i = batchStart; i < batchEnd; i++) {
      batchPromises.push(
        (async () => {
          const feature = await extractFeatures(mobilenetModel, trainingData[i].image);
          const flattened = feature.flatten();
          feature.dispose();
          
          const label = tf.oneHot(tf.tensor1d([trainingData[i].label], 'int32'), numClasses);
          const labelFlattened = label.squeeze();
          label.dispose();
          
          return { feature: flattened, label: labelFlattened, index: i };
        })()
      );
    }
    
    // Wait for all images in this batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Add results in order
    for (const result of batchResults) {
      features[result.index] = result.feature;
      labels[result.index] = result.label;
    }
  }
  
  // Get feature dimension from first feature
  const featureDim = features[0].shape[0]; // Should be 1280 for MobileNetV2
  console.log(`Feature dimension: ${featureDim}`);
  
  // Stack features and labels
  const featureTensor = tf.stack(features);
  const labelTensor = tf.stack(labels);
  
  // Create a simple model for classification
  // Simplified architecture to prevent overfitting on small dataset
  const model = tf.sequential();
  model.add(tf.layers.dense({
    units: 256,
    activation: 'relu',
    inputShape: [featureDim],
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }) // L2 regularization
  }));
  model.add(tf.layers.dropout({ rate: 0.3 })); // Reduced dropout
  model.add(tf.layers.dense({
    units: 128,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({
    units: numClasses,
    activation: 'softmax'
  }));
  
  model.compile({
    optimizer: tf.train.adam(LEARNING_RATE),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  console.log('Training model...');
  
  // Track best validation accuracy for early stopping
  let bestValAcc = 0;
  let patienceCounter = 0;
  const patience = 20; // Stop if no improvement for 20 epochs
  
  // Learning rate scheduler
  let currentLR = LEARNING_RATE;
  
  await model.fit(featureTensor, labelTensor, {
    epochs: EPOCHS,
    batchSize: BATCH_SIZE,
    validationSplit: 0.15, // Reduced from 0.2 to have more training data
    shuffle: true,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}/${EPOCHS} - loss: ${logs.loss.toFixed(4)}, acc: ${logs.acc.toFixed(4)}, val_loss: ${logs.val_loss.toFixed(4)}, val_acc: ${logs.val_acc.toFixed(4)}, lr: ${currentLR.toFixed(6)}`);
        
        // Early stopping logic
        if (logs.val_acc > bestValAcc) {
          bestValAcc = logs.val_acc;
          patienceCounter = 0;
        } else {
          patienceCounter++;
        }
        
        // Reduce learning rate on plateau
        if (patienceCounter >= 10) {
          currentLR *= 0.5;
          model.optimizer.learningRate = currentLR;
          console.log(`  → Learning rate reduced to ${currentLR.toFixed(6)}`);
          patienceCounter = 0; // Reset patience after LR reduction
        }
        
        // Stop training if no improvement
        if (patienceCounter >= patience) {
          console.log(`  → Early stopping: no improvement for ${patience} epochs`);
          model.stopTraining = true;
        }
      }
    }
  });
  
  // Save model
  const modelDir = path.join(__dirname, '../public/models/hero-classifier');
  await fs.mkdir(modelDir, { recursive: true });
  
  console.log('Saving model...');
  
  // Use a custom save handler to save to filesystem
  class NodeFileSystem {
    async save(modelArtifacts) {
      const weightsManifest = [{
        paths: ['weights.bin'],
        weights: modelArtifacts.weightSpecs,
      }];
      
      const modelJSON = {
        modelTopology: modelArtifacts.modelTopology,
        weightsManifest,
        format: modelArtifacts.format,
        generatedBy: modelArtifacts.generatedBy,
        convertedBy: modelArtifacts.convertedBy,
      };
      
      const modelJSONPath = path.join(modelDir, 'model.json');
      const weightsPath = path.join(modelDir, 'weights.bin');
      
      await fs.writeFile(modelJSONPath, JSON.stringify(modelJSON));
      await fs.writeFile(weightsPath, Buffer.from(modelArtifacts.weightData));
      
      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
    }
  }
  
  await model.save(new NodeFileSystem());
  
  // Save metadata
  const metadata = {
    numClasses,
    heroIdToIndex,
    indexToHeroId: Object.fromEntries(
      Object.entries(heroIdToIndex).map(([id, idx]) => [idx, id])
    ),
    inputSize: INPUT_SIZE,
    augmentationsPerImage: AUGMENTATIONS_PER_IMAGE,
    totalTrainingSamples: trainingData.length,
    bestValAccuracy: bestValAcc,
    trainedAt: new Date().toISOString(),
    trainingConfig: {
      epochs: EPOCHS,
      batchSize: BATCH_SIZE,
      learningRate: LEARNING_RATE,
      architecture: 'MobileNetV2 + 2-layer MLP',
    }
  };
  
  await fs.writeFile(
    path.join(modelDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('Training complete!');
  console.log(`Model saved to: ${modelDir}`);
  
  // Cleanup
  featureTensor.dispose();
  labelTensor.dispose();
  features.forEach(f => f.dispose());
  labels.forEach(l => l.dispose());
  trainingData.forEach(d => d.image.dispose());
}

// Run training
trainModel().catch(console.error);

