/**
 * Image Recognition Module
 * 
 * Implements template matching logic for detecting scoreboard and hero icons
 */

import { HEROES } from "@/data/heroes";
import { classifyHeroIcon, classifyHeroIconWithAllMatches } from "./mlDetection";
import { detectHeroByHash, initializeHeroHashes } from "./perceptualHash";

export type TemplateMatchMethod = 
  | "TM_CCOEFF_NORMED"
  | "TM_CCORR_NORMED"
  | "TM_SQDIFF_NORMED"
  | "TM_CCOEFF"
  | "TM_CCORR"
  | "TM_SQDIFF"
  | "EDGE_CCOEFF_NORMED"
  | "EDGE_CCORR_NORMED"
  | "EDGE_SQDIFF_NORMED"
  | "ML_MOBILENET"
  | "HASH_PERCEPTUAL"
  | "HASH_AVERAGE"
  | "HASH_DIFFERENCE"
  | "DIFF_AVERAGE";

export interface PositioningParams {
  scoreboardStartXPercent: number;
  iconOffsetXPercent: number;
  iconSizePercent: number;
  rowHeightPercent: number;
  allyStartYPercent: number;
  enemyStartYPercent: number;
  matchMethod?: TemplateMatchMethod;
}

export interface DetectionResult {
  isScoreboardVisible: boolean;
  enemyHeroes: string[]; // hero IDs
  allyHeroes: string[]; // hero IDs
  confidence: number; // 0-1
  debug?: {
    scoreboardRegion?: { x: number; y: number; width: number; height: number };
    detectedIcons?: Array<{ 
      heroId: string; 
      confidence: number; 
      position: { x: number; y: number }; 
      topMatches?: Array<{ heroId: string; confidence: number }>;
      matchedIconImage?: string; // data URL of the matched template icon
      overlayImage?: string; // data URL of overlay between extracted and matched
      diffImage?: string; // data URL of difference between extracted and matched
    }>;
    allyIconImages?: string[]; // data URLs for visual debugging
    enemyIconImages?: string[]; // data URLs for visual debugging
    debugFrameImage?: string; // full frame with boxes
  };
}

interface ColorSignature {
  r: number;
  g: number;
  b: number;
}

/**
 * Load a hero icon image and convert to ImageData
 */
async function loadHeroIcon(imagePath: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
    img.src = imagePath;
  });
}

/**
 * Resize ImageData to target dimensions
 */
function resizeImageData(imageData: ImageData, targetWidth: number, targetHeight: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  
  ctx.putImageData(imageData, 0, 0);
  
  // Create output canvas at target size
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) throw new Error("Failed to get output canvas context");
  
  // Draw scaled image
  outputCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  
  return outputCtx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Extract a region from ImageData
 */
function extractRegion(imageData: ImageData, x: number, y: number, width: number, height: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Failed to get canvas context");
  
  // Create temporary canvas with full image
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) throw new Error("Failed to get temp canvas context");
  
  tempCtx.putImageData(imageData, 0, 0);
  
  // Draw the region
  ctx.drawImage(tempCanvas, x, y, width, height, 0, 0, width, height);
  
  return ctx.getImageData(0, 0, width, height);
}

// Global cache for hero icons
let heroIconCache: Map<string, ImageData> | null = null;

/**
 * Load all hero icons and cache them
 */
async function loadAllHeroIcons(targetSize: number): Promise<Map<string, ImageData>> {
  // Return cached icons if available
  if (heroIconCache) {
    return heroIconCache;
  }

  const iconMap = new Map<string, ImageData>();
  
  // Load all hero icons
  const loadPromises = HEROES.map(async (hero) => {
    try {
      const iconData = await loadHeroIcon(hero.image);
      // Resize to match the scoreboard icon size
      const resizedIcon = resizeImageData(iconData, targetSize, targetSize);
      iconMap.set(hero.id, resizedIcon);
    } catch (error) {
      console.warn(`Failed to load icon for ${hero.name}:`, error);
    }
  });

  await Promise.all(loadPromises);
  
  // Cache for future use
  heroIconCache = iconMap;
  
  console.log(`Loaded ${iconMap.size} hero icons`);
  
  return iconMap;
}

/**
 * Calculate average color in a region of ImageData
 */
function getAverageColor(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): ColorSignature {
  let totalR = 0, totalG = 0, totalB = 0, count = 0;

  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const px = Math.floor(x + dx);
      const py = Math.floor(y + dy);
      
      if (px < 0 || px >= imageData.width || py < 0 || py >= imageData.height) continue;

      const idx = (py * imageData.width + px) * 4;
      totalR += imageData.data[idx];
      totalG += imageData.data[idx + 1];
      totalB += imageData.data[idx + 2];
      count++;
    }
  }

  return {
    r: totalR / count,
    g: totalG / count,
    b: totalB / count,
  };
}

/**
 * Check if scoreboard is visible by looking for distinctive UI color patterns
 * Overwatch scoreboard has blue/teal team on top and red/maroon team on bottom
 */
function detectScoreboard(imageData: ImageData): boolean {
  const width = imageData.width;
  const height = imageData.height;

  // Sample multiple regions across the screen
  // Scoreboard typically appears in center-left to center-right area
  const centerY = height / 2;
  const leftX = width * 0.15;
  const rightX = width * 0.85;

  let blueRegions = 0;
  let redRegions = 0;

  // Sample regions in upper-middle area (ally team - blue/teal)
  const allyRegions = [
    { x: leftX, y: centerY - height * 0.2, width: 100, height: 50 },
    { x: width / 2 - 50, y: centerY - height * 0.15, width: 100, height: 50 },
    { x: rightX - 100, y: centerY - height * 0.2, width: 100, height: 50 },
  ];

  // Sample regions in lower-middle area (enemy team - red/maroon)
  const enemyRegions = [
    { x: leftX, y: centerY + height * 0.05, width: 100, height: 50 },
    { x: width / 2 - 50, y: centerY + height * 0.1, width: 100, height: 50 },
    { x: rightX - 100, y: centerY + height * 0.05, width: 100, height: 50 },
  ];

  // Check ally regions for blue/teal/cyan colors
  for (const region of allyRegions) {
    const color = getAverageColor(imageData, region.x, region.y, region.width, region.height);
    
    // The scoreboard uses DARK teal - focus on relative color relationships
    // Teal should have blue >= green and blue > red, or green and blue both higher than red
    const isTealish = (color.b >= color.r && color.g >= color.r * 0.8) || 
                     (color.b > color.r && color.g > color.r);
    
    // Also accept colors where blue+green combined are significantly higher than red
    const isCoolColor = (color.b + color.g) > (color.r * 1.5);
    
    if (isTealish || isCoolColor) {
      blueRegions++;
    }
  }

  // Check enemy regions for red/maroon colors
  for (const region of enemyRegions) {
    const color = getAverageColor(imageData, region.x, region.y, region.width, region.height);
    
    // The scoreboard uses DARK red/maroon/orange-brown
    // Red/orange should have red > blue and red >= green
    const isWarmColor = color.r > color.b && color.r >= color.g * 0.8;
    
    // Also accept brownish/orange colors (red + green > blue)
    const isOrangeBrown = (color.r + color.g) > (color.b * 2) && color.r > color.b;
    
    if (isWarmColor || isOrangeBrown) {
      redRegions++;
    }
  }

  // Scoreboard detected if we found at least 2 blue regions AND 2 red regions
  // This confirms both teams are visible
  return blueRegions >= 2 && redRegions >= 2;
}

/**
 * Apply Canny edge detection to a grayscale Mat
 */
function applyEdgeDetection(grayMat: any, cv: any): any {
  const edges = new cv.Mat();
  // Canny parameters: threshold1=50, threshold2=150
  // These are good defaults for most edge detection
  cv.Canny(grayMat, edges, 50, 150);
  return edges;
}

/**
 * Compare two ImageData objects using OpenCV template matching
 * Returns similarity score (0-1, where 1 is a perfect match)
 * Note: ML_MOBILENET is handled separately in matchIconToHero
 */
/**
 * Calculate average pixel difference between two images
 * Returns average RGB difference per pixel (lower is better)
 */
function calculateAverageDiff(img1: ImageData, img2: ImageData): number {
  if (img1.width !== img2.width || img1.height !== img2.height) {
    return Infinity; // Can't compare different sizes
  }

  const pixelCount = img1.width * img1.height;
  let sumDiff = 0;

  // Compare RGB values (skip alpha channel)
  for (let i = 0; i < pixelCount * 4; i += 4) {
    const dr = Math.abs(img1.data[i] - img2.data[i]);
    const dg = Math.abs(img1.data[i + 1] - img2.data[i + 1]);
    const db = Math.abs(img1.data[i + 2] - img2.data[i + 2]);
    
    // Average of absolute differences per pixel
    sumDiff += (dr + dg + db) / 3;
  }

  // Return average difference per pixel (0-255 range)
  return sumDiff / pixelCount;
}

function compareImages(img1: ImageData, img2: ImageData, method: TemplateMatchMethod = "TM_CCOEFF_NORMED"): number {
  if (method === "ML_MOBILENET") {
    // ML method doesn't compare two images, it classifies one
    // This should not be called for ML_MOBILENET
    console.warn("compareImages called with ML_MOBILENET - this should be handled in matchIconToHero");
    return 0;
  }

  if (method === "DIFF_AVERAGE") {
    // For DIFF_AVERAGE, we want to return similarity (0-1) based on average diff
    // Lower diff = higher similarity
    const avgDiff = calculateAverageDiff(img1, img2);
    if (avgDiff === Infinity) {
      return 0;
    }
    // Convert average diff (0-255) to similarity (1-0)
    // Perfect match (diff=0) = similarity 1.0
    // Max difference (diff=255) = similarity 0.0
    return Math.max(0, 1 - (avgDiff / 255));
  }

  if (img1.width !== img2.width || img1.height !== img2.height) {
    return 0;
  }

  // Try to use OpenCV if available
  if (typeof window !== "undefined" && (window as any).cv) {
    try {
      const cv = (window as any).cv;
      
      // Convert ImageData to cv.Mat
      const mat1 = cv.matFromImageData(img1);
      const mat2 = cv.matFromImageData(img2);
      
      // Convert to grayscale for better matching
      const gray1 = new cv.Mat();
      const gray2 = new cv.Mat();
      cv.cvtColor(mat1, gray1, cv.COLOR_RGBA2GRAY);
      cv.cvtColor(mat2, gray2, cv.COLOR_RGBA2GRAY);
      
      // Determine if we should use edge detection
      const useEdges = method.startsWith("EDGE_");
      let processedImg1 = gray1;
      let processedImg2 = gray2;
      
      if (useEdges) {
        // Apply edge detection to both images
        processedImg1 = applyEdgeDetection(gray1, cv);
        processedImg2 = applyEdgeDetection(gray2, cv);
      }
      
      // Extract the actual OpenCV method name
      const actualMethod = useEdges ? method.replace("EDGE_", "") : method;
      const cvMethod = cv[actualMethod];
      
      // Use matchTemplate with the specified method
      const result = new cv.Mat();
      cv.matchTemplate(processedImg1, processedImg2, result, cvMethod);
      
      // Get the match score
      const minMax = cv.minMaxLoc(result);
      
      // For SQDIFF methods, lower is better, so we use minVal
      // For other methods, higher is better, so we use maxVal
      let score: number;
      if (method.includes("SQDIFF")) {
        score = minMax.minVal;
        // SQDIFF returns 0 for perfect match, higher for worse
        // Normalize: invert so that 0 becomes 1 (perfect) and scale appropriately
        // For normalized methods, max is typically 1
        score = 1 - score;
      } else {
        score = minMax.maxVal;
      }
      
      // Cleanup
      mat1.delete();
      mat2.delete();
      gray1.delete();
      gray2.delete();
      if (useEdges) {
        processedImg1.delete();
        processedImg2.delete();
      }
      result.delete();
      
      // Normalize to 0-1 range for non-normalized methods
      if (!method.includes("NORMED")) {
        // Non-normalized methods can have wider ranges
        // CCOEFF and CCORR can be negative, so normalize from -1 to 1
        score = (score + 1) / 2;
      }
      
      // Ensure score is in 0-1 range
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      console.warn("OpenCV matching failed, falling back to simple comparison:", error);
    }
  }

  // Fallback: Simple pixel-by-pixel comparison
  const pixelCount = img1.width * img1.height;
  let sumDiff = 0;

  // Compare RGB values (skip alpha channel)
  for (let i = 0; i < pixelCount * 4; i += 4) {
    const dr = img1.data[i] - img2.data[i];
    const dg = img1.data[i + 1] - img2.data[i + 1];
    const db = img1.data[i + 2] - img2.data[i + 2];
    
    // Euclidean distance
    sumDiff += Math.sqrt(dr * dr + dg * dg + db * db);
  }

  // Normalize to 0-1 range (max difference per pixel is ~441 for RGB)
  const avgDiff = sumDiff / pixelCount;
  const similarity = 1 - Math.min(avgDiff / 441, 1);

  return similarity;
}

/**
 * Create an overlay image showing both the extracted and matched icons
 */
function createOverlayImage(extracted: ImageData, matched: ImageData): string {
  if (extracted.width !== matched.width || extracted.height !== matched.height) {
    throw new Error("Images must be same size");
  }
  
  const canvas = document.createElement("canvas");
  canvas.width = extracted.width;
  canvas.height = extracted.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  
  // Create a new ImageData for the overlay
  const overlayData = ctx.createImageData(extracted.width, extracted.height);
  
  // Blend the two images: 50% extracted, 50% matched
  for (let i = 0; i < extracted.data.length; i += 4) {
    overlayData.data[i] = (extracted.data[i] * 0.5 + matched.data[i] * 0.5);     // R
    overlayData.data[i + 1] = (extracted.data[i + 1] * 0.5 + matched.data[i + 1] * 0.5); // G
    overlayData.data[i + 2] = (extracted.data[i + 2] * 0.5 + matched.data[i + 2] * 0.5); // B
    overlayData.data[i + 3] = 255; // A
  }
  
  ctx.putImageData(overlayData, 0, 0);
  return canvas.toDataURL();
}

/**
 * Create a difference image highlighting pixels that differ between extracted and matched
 */
function createDiffImage(extracted: ImageData, matched: ImageData): string {
  if (extracted.width !== matched.width || extracted.height !== matched.height) {
    throw new Error("Images must be same size");
  }
  
  const canvas = document.createElement("canvas");
  canvas.width = extracted.width;
  canvas.height = extracted.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  
  // Create a new ImageData for the diff
  const diffData = ctx.createImageData(extracted.width, extracted.height);
  
  // Calculate absolute difference for each pixel
  for (let i = 0; i < extracted.data.length; i += 4) {
    const diffR = Math.abs(extracted.data[i] - matched.data[i]);
    const diffG = Math.abs(extracted.data[i + 1] - matched.data[i + 1]);
    const diffB = Math.abs(extracted.data[i + 2] - matched.data[i + 2]);
    
    // Amplify differences for visibility (multiply by 3, but cap at 255)
    const avgDiff = (diffR + diffG + diffB) / 3;
    const amplified = Math.min(avgDiff * 3, 255);
    
    // Show in grayscale (red channel shows difference intensity)
    diffData.data[i] = amplified;     // R - show difference in red
    diffData.data[i + 1] = amplified * 0.3; // G - slight green for warmth
    diffData.data[i + 2] = amplified * 0.3; // B - slight blue for warmth
    diffData.data[i + 3] = 255; // A
  }
  
  ctx.putImageData(diffData, 0, 0);
  return canvas.toDataURL();
}

/**
 * Convert ImageData to a data URL
 */
function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/**
 * Match a captured icon region to the best matching hero
 */
async function matchIconToHero(
  iconRegion: ImageData,
  heroIcons: Map<string, ImageData>,
  matchMethod: TemplateMatchMethod = "TM_CCOEFF_NORMED",
  debug: boolean = false
): Promise<{ heroId: string; confidence: number; matchedIcon?: ImageData; allMatches?: Array<{ heroId: string; confidence: number }> } | null> {
  // Handle hash-based detection
  if (matchMethod === "HASH_PERCEPTUAL" || matchMethod === "HASH_AVERAGE" || matchMethod === "HASH_DIFFERENCE") {
    try {
      // Initialize hashes if needed
      await initializeHeroHashes();
      
      const hashMethod = matchMethod === "HASH_PERCEPTUAL" ? "perceptual" :
                        matchMethod === "HASH_AVERAGE" ? "average" : "difference";
      
      const result = await detectHeroByHash(iconRegion, hashMethod);
      
      if (debug) {
        console.log(`Hash detection (${hashMethod}) results:`, result.allMatches);
      }
      
      // Use threshold of 0.4 confidence (equivalent to ~10 Hamming distance)
      if (result.confidence > 0.4) {
        // Find the matched icon from heroIcons for visualization
        const matchedIcon = heroIcons.get(result.heroId);
        
        // Convert allMatches format to match expected interface
        const formattedMatches = result.allMatches.map(m => ({
          heroId: m.heroId,
          confidence: m.confidence
        }));
        
        return {
          heroId: result.heroId,
          confidence: result.confidence,
          matchedIcon,
          allMatches: debug ? formattedMatches : undefined
        };
      }
      
      return null;
    } catch (error) {
      console.warn("Hash-based detection failed:", error);
      return null;
    }
  }
  
  // Handle ML classification separately (doesn't need template comparison)
  if (matchMethod === "ML_MOBILENET") {
    try {
      const allMatches = await classifyHeroIconWithAllMatches(iconRegion);
      
      if (debug) {
        console.log("ML classification results:", allMatches.slice(0, 10));
      }
      
      if (allMatches.length > 0 && allMatches[0].confidence > 0.4) {
        const bestMatch = allMatches[0];
        // Find the matched icon from heroIcons for visualization
        const matchedIcon = heroIcons.get(bestMatch.heroId);
        
        return {
          heroId: bestMatch.heroId,
          confidence: bestMatch.confidence,
          matchedIcon,
          allMatches: debug ? allMatches : undefined
        };
      }
      
      return null;
    } catch (error) {
      console.warn("ML classification failed:", error);
      return null;
    }
  }

  // Template matching approach (original code)
  const allMatches: Array<{ heroId: string; confidence: number }> = [];
  let bestMatch: { heroId: string; confidence: number; matchedIcon?: ImageData } | null = null;

  // For DIFF_AVERAGE, we need to find the LOWEST diff (best match)
  if (matchMethod === "DIFF_AVERAGE") {
    let bestDiff = Infinity;
    
    for (const [heroId, heroIcon] of heroIcons.entries()) {
      const avgDiff = calculateAverageDiff(iconRegion, heroIcon);
      
      // Convert diff to confidence (lower diff = higher confidence)
      const confidence = avgDiff === Infinity ? 0 : Math.max(0, 1 - (avgDiff / 255));
      
      allMatches.push({ heroId, confidence });
      
      // Track best match by lowest diff
      if (avgDiff < bestDiff) {
        bestDiff = avgDiff;
        bestMatch = { heroId, confidence, matchedIcon: heroIcon };
      }
    }
  } else {
    // Standard template matching (higher similarity = better)
    for (const [heroId, heroIcon] of heroIcons.entries()) {
      const similarity = compareImages(iconRegion, heroIcon, matchMethod);
      allMatches.push({ heroId, confidence: similarity });
      
      if (!bestMatch || similarity > bestMatch.confidence) {
        bestMatch = { heroId, confidence: similarity, matchedIcon: heroIcon };
      }
    }
  }

  // Sort matches by confidence
  allMatches.sort((a, b) => b.confidence - a.confidence);

  if (debug) {
    console.log("All matches sorted by confidence:", allMatches.slice(0, 10));
  }

  // Only return matches above confidence threshold
  if (bestMatch && bestMatch.confidence > 0.4) {
    return { ...bestMatch, allMatches: debug ? allMatches : undefined };
  }

  return null;
}

/**
 * Deduplicate detected heroes, keeping the one with highest confidence for each unique hero ID
 */
function deduplicateHeroes(
  detections: Array<{ heroId: string; confidence: number }>
): Array<{ heroId: string; confidence: number }> {
  const heroMap = new Map<string, { heroId: string; confidence: number }>();
  
  for (const detection of detections) {
    const existing = heroMap.get(detection.heroId);
    if (!existing || detection.confidence > existing.confidence) {
      heroMap.set(detection.heroId, detection);
    }
  }
  
  return Array.from(heroMap.values());
}

/**
 * Detect heroes from screenshot by template matching
 */
export async function detectHeroes(frameData: ImageData, customPositioning?: PositioningParams): Promise<DetectionResult> {
  try {
    // First check if scoreboard is visible
    const isScoreboardVisible = detectScoreboard(frameData);

    // Debug: Log sample colors and detailed analysis
    if (typeof window !== "undefined") {
      const width = frameData.width;
      const height = frameData.height;
      const centerY = height / 2;
      
      const topColor = getAverageColor(frameData, width * 0.3, centerY - height * 0.15, 100, 50);
      const bottomColor = getAverageColor(frameData, width * 0.3, centerY + height * 0.1, 100, 50);
      
      // Analyze if colors would pass detection
      const topIsCool = (topColor.b + topColor.g) > (topColor.r * 1.5);
      const bottomIsWarm = bottomColor.r > bottomColor.b && (bottomColor.r + bottomColor.g) > (bottomColor.b * 2);
      
      console.log("Scoreboard detection:", {
        isVisible: isScoreboardVisible,
        imageSize: `${width}x${height}`,
        topSample: `rgb(${Math.round(topColor.r)}, ${Math.round(topColor.g)}, ${Math.round(topColor.b)})`,
        topIsCool: topIsCool,
        bottomSample: `rgb(${Math.round(bottomColor.r)}, ${Math.round(bottomColor.g)}, ${Math.round(bottomColor.b)})`,
        bottomIsWarm: bottomIsWarm,
      });
    }

    if (!isScoreboardVisible) {
      return {
        isScoreboardVisible: false,
        enemyHeroes: [],
        allyHeroes: [],
        confidence: 0,
      };
    }

    // Define regions where hero icons appear on the scoreboard
    const width = frameData.width;
    const height = frameData.height;
    
    // Use custom positioning if provided, otherwise use defaults
    const positioning = customPositioning || {
      scoreboardStartXPercent: 0.12,
      iconOffsetXPercent: 0.021,
      iconSizePercent: 0.056,
      rowHeightPercent: 0.058,
      allyStartYPercent: 0.193,
      enemyStartYPercent: 0.5555,
      matchMethod: "TM_CCOEFF_NORMED" as TemplateMatchMethod,
    };
    
    const matchMethod = positioning.matchMethod || "TM_CCOEFF_NORMED";
    
    const scoreboardStartX = Math.floor(width * positioning.scoreboardStartXPercent);
    const iconOffsetX = Math.floor(width * positioning.iconOffsetXPercent);
    const iconStartX = scoreboardStartX + iconOffsetX;
    const iconSize = Math.floor(height * positioning.iconSizePercent);
    const rowHeight = Math.floor(height * positioning.rowHeightPercent);
    const allyStartY = Math.floor(height * positioning.allyStartYPercent);
    const enemyStartY = Math.floor(height * positioning.enemyStartYPercent);

    // Pre-load all hero icons if not cached
    const heroIcons = await loadAllHeroIcons(iconSize);

    const detectedAlly: Array<{ 
      heroId: string; 
      confidence: number; 
      position: number; 
      allMatches?: Array<{ heroId: string; confidence: number }>;
      matchedIcon?: ImageData;
      extractedIcon?: ImageData;
    }> = [];
    const detectedEnemy: Array<{ 
      heroId: string; 
      confidence: number; 
      position: number; 
      allMatches?: Array<{ heroId: string; confidence: number }>;
      matchedIcon?: ImageData;
      extractedIcon?: ImageData;
    }> = [];

    // Match ally heroes
    const allyDebugImages: string[] = [];
    for (let i = 0; i < 5; i++) {
      const y = allyStartY + (i * rowHeight);
      const iconRegion = extractRegion(frameData, iconStartX, y, iconSize, iconSize);
      
      // Debug: convert to data URL to see what we extracted
      if (typeof window !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = iconSize;
        canvas.height = iconSize;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.putImageData(iconRegion, 0, 0);
          allyDebugImages.push(canvas.toDataURL());
        }
      }
      
      console.log(`\n=== Ally Position ${i} ===`);
      const match = await matchIconToHero(iconRegion, heroIcons, matchMethod, true);
      if (match) {
        console.log(`Best match: ${match.heroId} (${(match.confidence * 100).toFixed(1)}%)`);
        if (match.allMatches) {
          console.log("Top 5 matches:", match.allMatches.slice(0, 5).map(m => `${m.heroId}: ${(m.confidence * 100).toFixed(1)}%`));
        }
        detectedAlly.push({ ...match, position: i, extractedIcon: iconRegion });
      } else {
        console.log("No match found (confidence too low)");
      }
    }

    // Match enemy heroes
    const enemyDebugImages: string[] = [];
    for (let i = 0; i < 5; i++) {
      const y = enemyStartY + (i * rowHeight);
      const iconRegion = extractRegion(frameData, iconStartX, y, iconSize, iconSize);
      
      // Debug: convert to data URL to see what we extracted
      if (typeof window !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = iconSize;
        canvas.height = iconSize;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.putImageData(iconRegion, 0, 0);
          enemyDebugImages.push(canvas.toDataURL());
        }
      }
      
      console.log(`\n=== Enemy Position ${i} ===`);
      const match = await matchIconToHero(iconRegion, heroIcons, matchMethod, true);
      if (match) {
        console.log(`Best match: ${match.heroId} (${(match.confidence * 100).toFixed(1)}%)`);
        if (match.allMatches) {
          console.log("Top 5 matches:", match.allMatches.slice(0, 5).map(m => `${m.heroId}: ${(m.confidence * 100).toFixed(1)}%`));
        }
        detectedEnemy.push({ ...match, position: i, extractedIcon: iconRegion });
      } else {
        console.log("No match found (confidence too low)");
      }
    }

    if (typeof window !== "undefined") {
      console.log("Hero detection:", {
        iconStartX,
        iconSize,
        rowHeight,
        allyStartY,
        enemyStartY,
        allyPositions: detectedAlly.map(m => `Position ${m.position}: ${m.heroId} (${Math.round(m.confidence * 100)}%)`),
        enemyPositions: detectedEnemy.map(m => `Position ${m.position}: ${m.heroId} (${Math.round(m.confidence * 100)}%)`),
      });
      
      // Create a debug canvas showing where we're sampling
      const debugCanvas = document.createElement("canvas");
      debugCanvas.width = width;
      debugCanvas.height = height;
      const debugCtx = debugCanvas.getContext("2d");
      if (debugCtx) {
        // Draw the full frame
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.putImageData(frameData, 0, 0);
          debugCtx.drawImage(tempCanvas, 0, 0);
          
          // Draw red boxes where we're sampling icons
          debugCtx.strokeStyle = "red";
          debugCtx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            const y = allyStartY + (i * rowHeight);
            debugCtx.strokeRect(iconStartX, y, iconSize, iconSize);
          }
          debugCtx.strokeStyle = "yellow";
          for (let i = 0; i < 5; i++) {
            const y = enemyStartY + (i * rowHeight);
            debugCtx.strokeRect(iconStartX, y, iconSize, iconSize);
          }
          
          console.log("Debug frame with sampling boxes (red=ally, yellow=enemy):", debugCanvas.toDataURL());
        }
      }
      
      // Log extracted images for visual debugging
      console.log("Extracted ally icons:");
      allyDebugImages.forEach((img, i) => {
        console.log(`Ally ${i}:`, img);
      });
      console.log("Extracted enemy icons:");
      enemyDebugImages.forEach((img, i) => {
        console.log(`Enemy ${i}:`, img);
      });
    }
    
    const avgConfidence = [...detectedAlly, ...detectedEnemy].reduce((sum, m) => sum + m.confidence, 0) / 
                          Math.max([...detectedAlly, ...detectedEnemy].length, 1);

    // Deduplicate heroes - only keep unique hero IDs
    // If the same hero appears multiple times, keep the one with highest confidence
    const uniqueAlly = deduplicateHeroes(detectedAlly);
    const uniqueEnemy = deduplicateHeroes(detectedEnemy);

    // Create debug canvas for return
    let debugFrameImageUrl: string | undefined;
    if (typeof window !== "undefined") {
      const debugCanvas = document.createElement("canvas");
      debugCanvas.width = width;
      debugCanvas.height = height;
      const debugCtx = debugCanvas.getContext("2d");
      if (debugCtx) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.putImageData(frameData, 0, 0);
          debugCtx.drawImage(tempCanvas, 0, 0);
          
          debugCtx.strokeStyle = "red";
          debugCtx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            const y = allyStartY + (i * rowHeight);
            debugCtx.strokeRect(iconStartX, y, iconSize, iconSize);
          }
          debugCtx.strokeStyle = "yellow";
          for (let i = 0; i < 5; i++) {
            const y = enemyStartY + (i * rowHeight);
            debugCtx.strokeRect(iconStartX, y, iconSize, iconSize);
          }
          
          debugFrameImageUrl = debugCanvas.toDataURL();
        }
      }
    }

    return {
      isScoreboardVisible: true,
      enemyHeroes: uniqueEnemy.map(m => m.heroId),
      allyHeroes: uniqueAlly.map(m => m.heroId),
      confidence: avgConfidence,
      debug: {
        scoreboardRegion: { x: iconStartX, y: allyStartY, width: width * 0.8, height: enemyStartY + (5 * rowHeight) - allyStartY },
        detectedIcons: [...detectedAlly, ...detectedEnemy].map((m, i) => {
          const isAlly = i < 5;
          const baseInfo = {
            heroId: m.heroId,
            confidence: m.confidence,
            position: { x: iconStartX, y: isAlly ? allyStartY + (i * rowHeight) : enemyStartY + ((i - 5) * rowHeight) },
            topMatches: m.allMatches?.slice(0, 5),
          };
          
          // Generate overlay and diff images if both extracted and matched icons are available
          if (m.extractedIcon && m.matchedIcon) {
            try {
              return {
                ...baseInfo,
                matchedIconImage: imageDataToDataURL(m.matchedIcon),
                overlayImage: createOverlayImage(m.extractedIcon, m.matchedIcon),
                diffImage: createDiffImage(m.extractedIcon, m.matchedIcon),
              };
            } catch (error) {
              console.warn("Failed to create overlay/diff images:", error);
              return baseInfo;
            }
          }
          
          return baseInfo;
        }),
        allyIconImages: allyDebugImages,
        enemyIconImages: enemyDebugImages,
        debugFrameImage: debugFrameImageUrl,
      },
    };
  } catch (error) {
    console.error("Error detecting heroes:", error);
    return {
      isScoreboardVisible: false,
      enemyHeroes: [],
      allyHeroes: [],
      confidence: 0,
    };
  }
}

/**
 * Advanced template matching with icon pre-loading
 * This would be the production-ready version
 */
export class HeroDetector {
  private iconCache = new Map<string, ImageData>();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Pre-load all hero icons
    const loadPromises = HEROES.map(async (hero) => {
      try {
        const iconData = await loadHeroIcon(hero.image);
        this.iconCache.set(hero.id, iconData);
      } catch (error) {
        console.warn(`Failed to load icon for ${hero.name}:`, error);
      }
    });

    await Promise.all(loadPromises);
    this.isInitialized = true;
  }

  async detect(frameData: ImageData): Promise<DetectionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return detectHeroes(frameData);
  }
}

