# Hero Icon Classifier Training Guide

This document explains how to train the TensorFlow.js hero icon classifier model.

## Overview

The training script (`train-hero-classifier.js`) uses transfer learning with MobileNetV2 to create a classifier that can identify hero icons from screenshots. It trains on the 41 hero icons located in `public/heroes/`.

## Prerequisites

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Ensure hero icons are present:**
   - All hero icon files should be in `public/heroes/`
   - Supported formats: `.webp`, `.png`, `.jpg`
   - The script expects icons matching the names in `HERO_ICON_MAP` within the training script

## Running Training

Simply run:

```bash
npm run train
```

Or directly:

```bash
node scripts/train-hero-classifier.js
```

## Training Process

1. **Data Loading:**

   - Loads all hero icons from `public/heroes/`
   - Each icon is resized to 224x224 (MobileNet input size)

2. **Data Augmentation:**

   - Generates 5 variations per icon:
     - Original image
     - Horizontal flip
     - Brightness +20%
     - Brightness -20%
     - 90° rotation
   - This increases training data from ~41 to ~205 samples

3. **Feature Extraction:**

   - Uses MobileNetV2 (pre-trained on ImageNet) as a feature extractor
   - Extracts features from all augmented images
   - MobileNet layers are frozen (not trained)

4. **Model Training:**

   - Trains a classification head (2 dense layers) on top of MobileNet features
   - Architecture:
     - Dense layer: 128 units, ReLU activation
     - Dropout: 50% to prevent overfitting
     - Output layer: 41 units (one per hero), softmax activation
   - Training parameters:
     - Epochs: 50
     - Batch size: 32
     - Learning rate: 0.001
     - Optimizer: Adam
     - Validation split: 20%

5. **Model Export:**
   - Saves model to `public/models/hero-classifier/`
   - Creates `metadata.json` with class mappings and training info

## Expected Results

- **Training Time:** 5-15 minutes (depending on hardware)
- **Expected Accuracy:** 95%+ on clean icon images
- **Model Size:** ~5-10MB
- **Inference Time:** 10-30ms per icon (in browser)

## Output Files

After training, you'll find:

```
public/models/hero-classifier/
├── model.json          # Model architecture
├── weights.bin         # Model weights
└── metadata.json      # Class mappings and metadata
```

## Model Metadata

The `metadata.json` file contains:

- `numClasses`: Number of hero classes (41)
- `heroIdToIndex`: Maps hero IDs to class indices
- `indexToHeroId`: Maps class indices to hero IDs
- `inputSize`: Input image size (224)
- `trainedAt`: Training timestamp

## Retraining

Retrain the model when:

- New heroes are added to the game
- Hero icons are updated/changed
- You want to improve accuracy with more training data

To retrain, simply run `npm run train` again. The script will overwrite the existing model.

## Troubleshooting

### "Model not available" error in browser

- Ensure training completed successfully
- Check that `public/models/hero-classifier/model.json` exists
- Verify `metadata.json` is present and valid

### Low accuracy

- Increase `EPOCHS` in training script
- Add more data augmentation
- Check that all hero icons are loading correctly
- Verify icon quality and consistency

### Training fails with memory error

- Reduce `BATCH_SIZE` in training script
- Process images in smaller batches
- Close other applications to free memory

### Missing hero icons

- Check `HERO_ICON_MAP` in training script matches actual filenames
- Ensure all icons are in `public/heroes/`
- Verify file extensions match (.webp, .png, .jpg)

## Advanced Configuration

You can modify training parameters in `scripts/train-hero-classifier.js`:

- `EPOCHS`: Number of training epochs (default: 50)
- `BATCH_SIZE`: Batch size for training (default: 32)
- `LEARNING_RATE`: Learning rate (default: 0.001)
- `INPUT_SIZE`: Image input size (default: 224)

Adjust these based on your needs:

- More epochs = better accuracy but longer training
- Larger batch size = faster training but more memory
- Lower learning rate = more stable but slower convergence

## Integration

Once trained, the model is automatically used when you select `ML_MOBILENET` as the detection method in the test panel. The model loads on first use and is cached for subsequent detections.
