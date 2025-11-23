/**
 * Test detection with a static image for tuning positioning parameters
 */

import { detectHeroes, type DetectionResult } from "./imageRecognition";

/**
 * Load an image from a URL or file and convert to ImageData
 */
async function loadImageAsImageData(imageUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

/**
 * Test detection on a static screenshot
 * 
 * Usage in browser console:
 * ```
 * import { testStaticScreenshot } from './lib/testDetection';
 * 
 * // Paste your screenshot as data URL or upload to /public and use path
 * await testStaticScreenshot('/path/to/screenshot.png');
 * ```
 */
export async function testStaticScreenshot(imageUrl: string): Promise<DetectionResult> {
  console.log("Loading test image:", imageUrl);
  
  const imageData = await loadImageAsImageData(imageUrl);
  console.log("Image loaded:", imageData.width, "x", imageData.height);
  
  const result = await detectHeroes(imageData);
  
  console.log("Detection result:", result);
  
  return result;
}

/**
 * Make this available globally for console testing
 */
if (typeof window !== "undefined") {
  (window as any).testStaticScreenshot = testStaticScreenshot;
}

