/**
 * Perceptual Hashing Module
 * 
 * Implements perceptual hashing algorithms for fast hero icon detection.
 * Uses DCT-based, average, and difference hashing methods.
 */

import { HEROES } from '@/data/heroes';

export interface HeroHashData {
  heroId: string;
  perceptualHash: string;
  averageHash: string;
  differenceHash: string;
}

interface HashDatabase {
  version: string;
  generatedAt: string;
  hashes: HeroHashData[];
}

let heroHashCache: HeroHashData[] | null = null;
let initializationPromise: Promise<void> | null = null;

/**
 * Convert ImageData to grayscale
 */
function toGrayscale(imageData: ImageData): number[] {
  const data = imageData.data;
  const grayscale: number[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    // Use luminance formula: 0.299*R + 0.587*G + 0.114*B
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale.push(gray);
  }
  
  return grayscale;
}

/**
 * Resize ImageData to target dimensions
 */
function resizeImageData(imageData: ImageData, targetWidth: number, targetHeight: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  ctx.putImageData(imageData, 0, 0);
  
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('Failed to get output canvas context');
  
  outputCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  
  return outputCtx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Compute 2D Discrete Cosine Transform (simplified version)
 * This is a basic DCT implementation - for production, consider using a library
 */
function dct2D(matrix: number[], width: number, height: number): number[] {
  const result: number[] = [];
  
  // Simplified DCT - compute for 8x8 block
  const N = Math.min(width, height, 8);
  
  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0;
      
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          const idx = y * width + x;
          const value = matrix[idx] || 0;
          
          const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
          const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
          
          sum += value * 
            Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) *
            Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
        }
      }
      
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      result.push((2 / N) * cu * cv * sum);
    }
  }
  
  return result;
}

/**
 * Compute perceptual hash (DCT-based)
 * Algorithm: Resize to 32x32, compute DCT, keep top-left 8x8, compare to median
 */
export async function computePerceptualHash(imageData: ImageData): Promise<string> {
  // Resize to 32x32 for DCT computation
  const resized = resizeImageData(imageData, 32, 32);
  const grayscale = toGrayscale(resized);
  
  // Compute DCT
  const dctCoeffs = dct2D(grayscale, 32, 32);
  
  // Keep top-left 8x8 coefficients (low frequencies)
  const topCoeffs: number[] = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const idx = i * 32 + j;
      topCoeffs.push(dctCoeffs[idx] || 0);
    }
  }
  
  // Skip DC coefficient (first element) and compute median of remaining
  const acCoeffs = topCoeffs.slice(1);
  const sorted = [...acCoeffs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // Create hash by comparing each coefficient to median
  let hash = '';
  for (let i = 1; i < topCoeffs.length; i++) {
    hash += topCoeffs[i] > median ? '1' : '0';
  }
  
  return hash;
}

/**
 * Compute average hash (simpler method)
 * Algorithm: Resize to 8x8, compute mean, compare each pixel to mean
 */
export async function computeAverageHash(imageData: ImageData): Promise<string> {
  // Resize to 8x8
  const resized = resizeImageData(imageData, 8, 8);
  const grayscale = toGrayscale(resized);
  
  // Compute mean
  const sum = grayscale.reduce((a, b) => a + b, 0);
  const mean = sum / grayscale.length;
  
  // Create hash by comparing each pixel to mean
  let hash = '';
  for (const gray of grayscale) {
    hash += gray > mean ? '1' : '0';
  }
  
  return hash;
}

/**
 * Compute difference hash (gradient-based)
 * Algorithm: Resize to 9x8, compare each pixel to its right neighbor
 */
export async function computeDifferenceHash(imageData: ImageData): Promise<string> {
  // Resize to 9x8 (9 wide so we can compare 8 pairs)
  const resized = resizeImageData(imageData, 9, 8);
  const grayscale = toGrayscale(resized);
  
  let hash = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const idx1 = y * 9 + x;
      const idx2 = y * 9 + x + 1;
      hash += grayscale[idx1] > grayscale[idx2] ? '1' : '0';
    }
  }
  
  return hash;
}

/**
 * Compute Hamming distance between two hash strings
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error(`Hash length mismatch: ${hash1.length} vs ${hash2.length}`);
  }
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  
  return distance;
}

/**
 * Convert Hamming distance to confidence score (0-1)
 * Formula: confidence = exp(-distance / 10)
 */
export function normalizedDistance(hash1: string, hash2: string): number {
  const distance = hammingDistance(hash1, hash2);
  // Exponential decay: distance 0 = 1.0, distance 10 = 0.37, distance 20 = 0.14
  return Math.exp(-distance / 10);
}

/**
 * Initialize hero hashes by loading from precomputed database
 */
export async function initializeHeroHashes(): Promise<void> {
  if (heroHashCache) {
    return; // Already initialized
  }
  
  if (initializationPromise) {
    return initializationPromise; // Already initializing
  }
  
  initializationPromise = (async () => {
    try {
      const response = await fetch('/models/hero-hashes.json');
      if (!response.ok) {
        throw new Error(`Failed to load hero hashes: ${response.statusText}`);
      }
      
      const database: HashDatabase = await response.json();
      heroHashCache = database.hashes;
      
      console.log(`Loaded ${heroHashCache.length} hero hashes from database`);
    } catch (error) {
      console.error('Failed to initialize hero hashes:', error);
      throw error;
    }
  })();
  
  return initializationPromise;
}

/**
 * Get hero hashes (lazy load if needed)
 */
export async function getHeroHashes(): Promise<HeroHashData[]> {
  await initializeHeroHashes();
  
  if (!heroHashCache) {
    throw new Error('Hero hashes not initialized');
  }
  
  return heroHashCache;
}

/**
 * Detect hero by comparing hash against all hero hashes
 */
export async function detectHeroByHash(
  imageData: ImageData,
  method: 'perceptual' | 'average' | 'difference' = 'perceptual'
): Promise<{
  heroId: string;
  confidence: number;
  allMatches: Array<{ heroId: string; distance: number; confidence: number }>;
}> {
  // Compute hash for input image
  let inputHash: string;
  
  switch (method) {
    case 'perceptual':
      inputHash = await computePerceptualHash(imageData);
      break;
    case 'average':
      inputHash = await computeAverageHash(imageData);
      break;
    case 'difference':
      inputHash = await computeDifferenceHash(imageData);
      break;
    default:
      throw new Error(`Unknown hash method: ${method}`);
  }
  
  // Get all hero hashes
  const heroHashes = await getHeroHashes();
  
  // Compare against all heroes
  const matches: Array<{ heroId: string; distance: number; confidence: number }> = [];
  
  for (const heroHash of heroHashes) {
    let hashToCompare: string;
    switch (method) {
      case 'perceptual':
        hashToCompare = heroHash.perceptualHash;
        break;
      case 'average':
        hashToCompare = heroHash.averageHash;
        break;
      case 'difference':
        hashToCompare = heroHash.differenceHash;
        break;
    }
    
    const distance = hammingDistance(inputHash, hashToCompare);
    const confidence = normalizedDistance(inputHash, hashToCompare);
    
    matches.push({ heroId: heroHash.heroId, distance, confidence });
  }
  
  // Sort by distance (lower is better)
  matches.sort((a, b) => a.distance - b.distance);
  
  // Get best match
  const bestMatch = matches[0];
  
  return {
    heroId: bestMatch.heroId,
    confidence: bestMatch.confidence,
    allMatches: matches.slice(0, 5), // Top 5 matches for debugging
  };
}

