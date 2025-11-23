/**
 * Precompute Hero Hashes Script
 * 
 * Generates perceptual, average, and difference hashes for all hero icons
 * and saves them to a JSON database for fast lookup.
 * 
 * Run with: node scripts/precompute-hashes.js
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Hero icon mapping - matches train-hero-classifier.js
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
 * Convert RGB buffer to grayscale array
 */
function toGrayscale(buffer, width, height) {
  const grayscale = [];
  for (let i = 0; i < buffer.length; i += 3) {
    // Use luminance formula: 0.299*R + 0.587*G + 0.114*B
    const gray = 0.299 * buffer[i] + 0.587 * buffer[i + 1] + 0.114 * buffer[i + 2];
    grayscale.push(gray);
  }
  return grayscale;
}

/**
 * Compute 2D Discrete Cosine Transform (simplified)
 */
function dct2D(matrix, width, height) {
  const result = [];
  const N = Math.min(width, height, 8);
  
  // Ensure matrix is an array
  if (!Array.isArray(matrix)) {
    throw new Error(`Matrix must be an array, got ${typeof matrix}`);
  }
  
  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0;
      
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          const idx = y * width + x;
          const value = (idx < matrix.length) ? matrix[idx] : 0;
          
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
 */
async function computePerceptualHash(imagePath) {
  // Resize to 32x32 and convert to grayscale
  const buffer = await sharp(imagePath)
    .resize(32, 32)
    .greyscale()
    .raw()
    .toBuffer();
  
  const grayscale = Array.from(buffer);
  
  if (!Array.isArray(grayscale) || grayscale.length === 0) {
    throw new Error(`Failed to convert image to grayscale array. Got length: ${grayscale.length}`);
  }
  
  // Compute DCT
  const dctCoeffs = dct2D(grayscale, 32, 32);
  
  // Keep top-left 8x8 coefficients
  const topCoeffs = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const idx = i * 32 + j;
      topCoeffs.push(dctCoeffs[idx] || 0);
    }
  }
  
  // Skip DC coefficient and compute median
  const acCoeffs = topCoeffs.slice(1);
  const sorted = [...acCoeffs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // Create hash
  let hash = '';
  for (let i = 1; i < topCoeffs.length; i++) {
    hash += topCoeffs[i] > median ? '1' : '0';
  }
  
  return hash;
}

/**
 * Compute average hash
 */
async function computeAverageHash(imagePath) {
  // Resize to 8x8 and convert to grayscale
  const buffer = await sharp(imagePath)
    .resize(8, 8)
    .greyscale()
    .raw()
    .toBuffer();
  
  const grayscale = Array.from(buffer);
  
  // Compute mean
  const sum = grayscale.reduce((a, b) => a + b, 0);
  const mean = sum / grayscale.length;
  
  // Create hash
  let hash = '';
  for (const gray of grayscale) {
    hash += gray > mean ? '1' : '0';
  }
  
  return hash;
}

/**
 * Compute difference hash
 */
async function computeDifferenceHash(imagePath) {
  // Resize to 9x8 and convert to grayscale
  const buffer = await sharp(imagePath)
    .resize(9, 8)
    .greyscale()
    .raw()
    .toBuffer();
  
  const grayscale = Array.from(buffer);
  const width = 9; // We know this from resize
  
  // Create hash by comparing each pixel to its right neighbor
  let hash = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const idx1 = y * width + x;
      const idx2 = y * width + x + 1;
      hash += grayscale[idx1] > grayscale[idx2] ? '1' : '0';
    }
  }
  
  return hash;
}

/**
 * Main function to precompute all hashes
 */
async function precomputeHashes() {
  console.log('Precomputing hero hashes...\n');
  
  const heroesDir = path.join(__dirname, '../public/heroes');
  const outputPath = path.join(__dirname, '../public/models/hero-hashes.json');
  
  // Ensure models directory exists
  const modelsDir = path.join(__dirname, '../public/models');
  await fs.mkdir(modelsDir, { recursive: true });
  
  const hashes = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const [heroId, imageFile] of Object.entries(HERO_ICON_MAP)) {
    const imagePath = path.join(heroesDir, imageFile);
    
    try {
      // Check if file exists
      await fs.access(imagePath);
      
      console.log(`Processing ${heroId} (${imageFile})...`);
      
      // Compute all three hash types
      const perceptualHash = await computePerceptualHash(imagePath);
      const averageHash = await computeAverageHash(imagePath);
      const differenceHash = await computeDifferenceHash(imagePath);
      
      hashes.push({
        heroId,
        perceptualHash,
        averageHash,
        differenceHash
      });
      
      successCount++;
      console.log(`  ✓ Perceptual: ${perceptualHash.substring(0, 16)}...`);
      console.log(`  ✓ Average: ${averageHash.substring(0, 16)}...`);
      console.log(`  ✓ Difference: ${differenceHash.substring(0, 16)}...\n`);
      
    } catch (error) {
      console.error(`  ✗ Error processing ${heroId}: ${error.message}\n`);
      errorCount++;
    }
  }
  
  // Create database object
  const database = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    hashes
  };
  
  // Save to file
  await fs.writeFile(outputPath, JSON.stringify(database, null, 2));
  
  console.log(`\n✓ Successfully processed ${successCount} heroes`);
  if (errorCount > 0) {
    console.log(`✗ Failed to process ${errorCount} heroes`);
  }
  console.log(`✓ Hash database saved to: ${outputPath}`);
  console.log(`\nTotal hashes: ${hashes.length}`);
  console.log(`Database size: ${JSON.stringify(database).length} bytes`);
}

// Run the script
precomputeHashes().catch(console.error);

