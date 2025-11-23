/**
 * Machine Learning Detection Module
 * 
 * Uses TensorFlow.js to classify hero icons using a trained MobileNet-based model
 */

import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { HEROES } from '@/data/heroes';

const MODEL_URL = '/models/hero-classifier/model.json';
const INPUT_SIZE = 224; // MobileNet input size

interface ModelMetadata {
  numClasses: number;
  heroIdToIndex: Record<string, number>;
  indexToHeroId: Record<number, string>;
  inputSize: number;
  trainedAt: string;
}

let classifierModel: tf.LayersModel | null = null;
let mobilenetModel: mobilenet.MobileNet | null = null;
let metadata: ModelMetadata | null = null;
let loadingPromise: Promise<void> | null = null;

/**
 * Load the trained model, MobileNet, and metadata
 */
async function loadModel(): Promise<void> {
  if (classifierModel && mobilenetModel && metadata) {
    return; // Already loaded
  }

  if (loadingPromise) {
    return loadingPromise; // Already loading
  }

  loadingPromise = (async () => {
    try {
      console.log('Loading MobileNet...');
      mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
      console.log('MobileNet loaded successfully');

      console.log('Loading classifier model...');
      classifierModel = await tf.loadLayersModel(MODEL_URL);
      console.log('Classifier model loaded successfully');

      // Load metadata
      const metadataResponse = await fetch('/models/hero-classifier/metadata.json');
      const loadedMetadata = await metadataResponse.json() as ModelMetadata;
      metadata = loadedMetadata;
      console.log(`Model metadata loaded: ${loadedMetadata.numClasses} classes`);
    } catch (error) {
      console.error('Failed to load ML model:', error);
      throw new Error('ML model not available. Please train the model first using: npm run train');
    }
  })();

  return loadingPromise;
}

/**
 * Preprocess ImageData to tensor for model input
 */
function preprocessImage(imageData: ImageData): tf.Tensor4D {
  // Resize to model input size
  const canvas = document.createElement('canvas');
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw and resize the image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('Failed to get temp canvas context');
  }
  tempCtx.putImageData(imageData, 0, 0);
  
  ctx.drawImage(tempCanvas, 0, 0, INPUT_SIZE, INPUT_SIZE);
  
  // Convert to tensor and normalize to [0, 1]
  const tensor = tf.browser.fromPixels(canvas);
  const normalized = tensor.div(255.0);
  const batched = normalized.expandDims(0); // Add batch dimension
  
  tensor.dispose();
  normalized.dispose();
  
  return batched as tf.Tensor4D;
}

/**
 * Extract features using MobileNet
 */
async function extractMobileNetFeatures(imageTensor: tf.Tensor4D): Promise<tf.Tensor> {
  if (!mobilenetModel) {
    throw new Error('MobileNet not loaded');
  }
  
  // MobileNet infer with embedding=true returns feature vector
  const features = mobilenetModel.infer(imageTensor, true) as tf.Tensor;
  return features;
}

/**
 * Classify a hero icon using the ML model
 */
export async function classifyHeroIcon(
  imageData: ImageData
): Promise<{ heroId: string; confidence: number } | null> {
  try {
    // Ensure models are loaded
    await loadModel();
    
    if (!classifierModel || !mobilenetModel || !metadata) {
      throw new Error('Models not loaded');
    }

    // Preprocess image
    const inputTensor = preprocessImage(imageData);
    
    // Extract features using MobileNet
    const features = await extractMobileNetFeatures(inputTensor);
    
    // Run through classifier
    const predictions = classifierModel.predict(features) as tf.Tensor;
    const predictionData = await predictions.data();
    
    // Find the class with highest probability
    let maxIndex = 0;
    let maxConfidence = predictionData[0];
    
    for (let i = 1; i < predictionData.length; i++) {
      if (predictionData[i] > maxConfidence) {
        maxConfidence = predictionData[i];
        maxIndex = i;
      }
    }
    
    // Get hero ID from index
    const heroId = metadata.indexToHeroId[maxIndex];
    const confidence = maxConfidence;
    
    // Cleanup
    inputTensor.dispose();
    features.dispose();
    predictions.dispose();
    
    // Only return if confidence is above threshold
    if (confidence > 0.4 && heroId) {
      return { heroId, confidence };
    }
    
    return null;
  } catch (error) {
    console.error('ML classification error:', error);
    return null;
  }
}

/**
 * Get all predictions sorted by confidence
 */
export async function classifyHeroIconWithAllMatches(
  imageData: ImageData
): Promise<Array<{ heroId: string; confidence: number }>> {
  try {
    await loadModel();
    
    if (!classifierModel || !mobilenetModel || !metadata) {
      throw new Error('Models not loaded');
    }

    const inputTensor = preprocessImage(imageData);
    
    // Extract features using MobileNet
    const features = await extractMobileNetFeatures(inputTensor);
    
    // Run through classifier
    const predictions = classifierModel.predict(features) as tf.Tensor;
    const predictionData = await predictions.data();
    
    // Create array of all predictions
    const allMatches: Array<{ heroId: string; confidence: number }> = [];
    
    for (let i = 0; i < predictionData.length; i++) {
      const heroId = metadata.indexToHeroId[i];
      if (heroId) {
        allMatches.push({
          heroId,
          confidence: predictionData[i]
        });
      }
    }
    
    // Sort by confidence descending
    allMatches.sort((a, b) => b.confidence - a.confidence);
    
    // Cleanup
    inputTensor.dispose();
    features.dispose();
    predictions.dispose();
    
    return allMatches;
  } catch (error) {
    console.error('ML classification error:', error);
    return [];
  }
}

/**
 * Check if ML model is available
 */
export async function isMLModelAvailable(): Promise<boolean> {
  try {
    await loadModel();
    return classifierModel !== null && mobilenetModel !== null && metadata !== null;
  } catch {
    return false;
  }
}

