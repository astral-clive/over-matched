"use client";

import { useState } from "react";
import { detectHeroes, type DetectionResult, type PositioningParams, type TemplateMatchMethod } from "@/lib/imageRecognition";

export default function TestDetectionPanel() {
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  
  // Positioning parameters
  const [params, setParams] = useState<PositioningParams>({
    scoreboardStartXPercent: 0.12,
    iconOffsetXPercent: 0.021,
    iconSizePercent: 0.056,
    rowHeightPercent: 0.058,
    allyStartYPercent: 0.193,
    enemyStartYPercent: 0.5555,
    matchMethod: "TM_CCOEFF_NORMED",
  });

  const loadImage = async (url: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const runDetection = async (imgData: ImageData) => {
    setLoading(true);
    setError(null);

    try {
      const detectionResult = await detectHeroes(imgData, params);
      setResult(detectionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!imageUrl) {
      setError("Please enter an image URL or upload a file");
      return;
    }

    try {
      const imgData = await loadImage(imageUrl);
      setImageData(imgData);
      await runDetection(imgData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
      setLoading(false);
    }
  };

  // Re-run detection when params change (if image is loaded)
  const handleParamChange = async (newParams: Partial<PositioningParams>) => {
    const updatedParams = { ...params, ...newParams };
    setParams(updatedParams);
    
    if (imageData) {
      await runDetection(imageData);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-slate-100 mb-4">Test Static Screenshot</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">
            Upload Screenshot
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"
          />
        </div>

        <button
          onClick={handleTest}
          disabled={loading || !imageUrl}
          className="w-full py-2 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Testing..." : imageData ? "Reload Image" : "Load Image"}
        </button>

        {imageData && (
          <div className="p-4 bg-slate-700/30 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Positioning Parameters (Live Tuning)</h4>
            
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                OpenCV Matching Method
              </label>
              <select
                value={params.matchMethod || "TM_CCOEFF_NORMED"}
                onChange={(e) => handleParamChange({ matchMethod: e.target.value as TemplateMatchMethod })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded text-slate-200 text-sm"
              >
                <optgroup label="Standard Template Matching">
                  <option value="TM_CCOEFF_NORMED">TM_CCOEFF_NORMED (Correlation Coefficient - Normalized)</option>
                  <option value="TM_CCORR_NORMED">TM_CCORR_NORMED (Cross-Correlation - Normalized)</option>
                  <option value="TM_SQDIFF_NORMED">TM_SQDIFF_NORMED (Squared Difference - Normalized)</option>
                  <option value="TM_CCOEFF">TM_CCOEFF (Correlation Coefficient)</option>
                  <option value="TM_CCORR">TM_CCORR (Cross-Correlation)</option>
                  <option value="TM_SQDIFF">TM_SQDIFF (Squared Difference)</option>
                </optgroup>
                <optgroup label="Edge Detection Based (Canny Edges)">
                  <option value="EDGE_CCOEFF_NORMED">EDGE + TM_CCOEFF_NORMED (Edge-based Correlation)</option>
                  <option value="EDGE_CCORR_NORMED">EDGE + TM_CCORR_NORMED (Edge-based Cross-Correlation)</option>
                  <option value="EDGE_SQDIFF_NORMED">EDGE + TM_SQDIFF_NORMED (Edge-based Squared Diff)</option>
                </optgroup>
                <optgroup label="Machine Learning">
                  <option value="ML_MOBILENET">ML_MOBILENET (TensorFlow.js MobileNet Classifier)</option>
                </optgroup>
                <optgroup label="Hash-Based Methods">
                  <option value="HASH_PERCEPTUAL">HASH_PERCEPTUAL (DCT-based Perceptual Hash)</option>
                  <option value="HASH_AVERAGE">HASH_AVERAGE (Average Hash - Fast)</option>
                  <option value="HASH_DIFFERENCE">HASH_DIFFERENCE (Difference Hash - Gradient-based)</option>
                </optgroup>
                <optgroup label="Pixel Difference Methods">
                  <option value="DIFF_AVERAGE">DIFF_AVERAGE (Average Pixel Difference - Simple & Fast)</option>
                </optgroup>
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {params.matchMethod === "TM_CCOEFF_NORMED" && "Best for matching despite lighting changes. Recommended."}
                {params.matchMethod === "TM_CCORR_NORMED" && "Simple correlation. Good for similar brightness."}
                {params.matchMethod === "TM_SQDIFF_NORMED" && "Measures difference (inverted). Good for exact matches."}
                {params.matchMethod === "TM_CCOEFF" && "Like CCOEFF_NORMED but non-normalized."}
                {params.matchMethod === "TM_CCORR" && "Like CCORR_NORMED but non-normalized."}
                {params.matchMethod === "TM_SQDIFF" && "Like SQDIFF_NORMED but non-normalized."}
                {params.matchMethod === "EDGE_CCOEFF_NORMED" && "Uses Canny edge detection before matching. Robust to color/lighting variations."}
                {params.matchMethod === "EDGE_CCORR_NORMED" && "Edge-based correlation. Good for structural matching."}
                {params.matchMethod === "EDGE_SQDIFF_NORMED" && "Edge-based difference. Focuses on shape similarity."}
                {params.matchMethod === "ML_MOBILENET" && "Neural network trained on hero icons. Most accurate but requires model loading. Train model first using: npm run train"}
                {params.matchMethod === "HASH_PERCEPTUAL" && "DCT-based perceptual hash. Very fast (~5ms), robust to minor variations. Requires precomputed hashes: npm run precompute-hashes"}
                {params.matchMethod === "HASH_AVERAGE" && "Average hash method. Fastest option, good for exact matches. Requires precomputed hashes: npm run precompute-hashes"}
                {params.matchMethod === "HASH_DIFFERENCE" && "Difference hash based on gradients. Good for detecting similar images. Requires precomputed hashes: npm run precompute-hashes"}
                {params.matchMethod === "DIFF_AVERAGE" && "Simple pixel-by-pixel comparison. Calculates average RGB difference per pixel and returns hero with lowest diff. Very fast, good baseline method."}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Scoreboard Start X: {(params.scoreboardStartXPercent * 100).toFixed(3)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.001"
                  value={params.scoreboardStartXPercent}
                  onChange={(e) => handleParamChange({ scoreboardStartXPercent: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Icon Offset X: {(params.iconOffsetXPercent * 100).toFixed(3)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.1"
                  step="0.001"
                  value={params.iconOffsetXPercent}
                  onChange={(e) => handleParamChange({ iconOffsetXPercent: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Icon Size: {(params.iconSizePercent * 100).toFixed(3)}%
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="0.1"
                  step="0.001"
                  value={params.iconSizePercent}
                  onChange={(e) => handleParamChange({ iconSizePercent: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Row Height: {(params.rowHeightPercent * 100).toFixed(3)}%
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="0.1"
                  step="0.001"
                  value={params.rowHeightPercent}
                  onChange={(e) => handleParamChange({ rowHeightPercent: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Ally Start Y: {(params.allyStartYPercent * 100).toFixed(3)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.4"
                  step="0.001"
                  value={params.allyStartYPercent}
                  onChange={(e) => handleParamChange({ allyStartYPercent: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Enemy Start Y: {(params.enemyStartYPercent * 100).toFixed(3)}%
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="0.7"
                  step="0.001"
                  value={params.enemyStartYPercent}
                  onChange={(e) => handleParamChange({ enemyStartYPercent: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm font-medium text-green-300">
                Scoreboard: {result.isScoreboardVisible ? "✓ Detected" : "✗ Not Detected"}
              </p>
              <p className="text-xs text-green-400 mt-1">
                Ally: {result.allyHeroes.join(", ") || "None"}
              </p>
              <p className="text-xs text-green-400">
                Enemy: {result.enemyHeroes.join(", ") || "None"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Confidence: {Math.round(result.confidence * 100)}%
              </p>
            </div>

            {result.debug?.debugFrameImage && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Sampling Locations (Red=Ally, Yellow=Enemy)
                </label>
                <img
                  src={result.debug.debugFrameImage}
                  alt="Debug frame"
                  className="w-full rounded border border-slate-700"
                />
              </div>
            )}

            {result.debug?.allyIconImages && result.debug.allyIconImages.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Extracted Ally Icons (Extracted → Matched → Overlay → Diff)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {result.debug.allyIconImages.map((img, i) => {
                    // Find the detection for this specific position (i)
                    const detection = result.debug?.detectedIcons?.[i];
                    const matchInfo = detection?.topMatches?.[0];
                    const matchedIcon = detection?.matchedIconImage;
                    const overlayImage = detection?.overlayImage;
                    const diffImage = detection?.diffImage;
                    return (
                      <div key={i} className="border border-green-500/50 rounded p-2">
                        <div className="flex gap-1">
                          <div className="text-center">
                            <img src={img} alt={`Ally ${i}`} className="w-16 h-16" />
                            <p className="text-xs text-slate-500 mt-0.5">Extracted</p>
                          </div>
                          {matchedIcon && (
                            <div className="text-center">
                              <img src={matchedIcon} alt={`Match ${i}`} className="w-16 h-16" />
                              <p className="text-xs text-slate-500 mt-0.5">Matched</p>
                            </div>
                          )}
                          {overlayImage && (
                            <div className="text-center">
                              <img src={overlayImage} alt={`Overlay ${i}`} className="w-16 h-16" />
                              <p className="text-xs text-slate-500 mt-0.5">Overlay</p>
                            </div>
                          )}
                          {diffImage && (
                            <div className="text-center">
                              <img src={diffImage} alt={`Diff ${i}`} className="w-16 h-16" />
                              <p className="text-xs text-slate-500 mt-0.5">Diff</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-center text-slate-400 mt-1">Pos {i}</p>
                        {matchInfo && (
                          <div className="text-xs text-center mt-1">
                            <p className="text-green-400 font-semibold">{matchInfo.heroId}</p>
                            <p className="text-slate-500">{(matchInfo.confidence * 100).toFixed(1)}%</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.debug?.enemyIconImages && result.debug.enemyIconImages.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Extracted Enemy Icons (Extracted → Matched → Overlay → Diff)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {result.debug.enemyIconImages.map((img, i) => {
                    // Find the detection for this specific position (5 + i, since allies are 0-4)
                    const detection = result.debug?.detectedIcons?.[5 + i];
                    const matchInfo = detection?.topMatches?.[0];
                    const matchedIcon = detection?.matchedIconImage;
                    const overlayImage = detection?.overlayImage;
                    const diffImage = detection?.diffImage;
                    return (
                      <div key={i} className="border border-red-500/50 rounded p-2">
                        <div className="flex gap-1">
                          <div className="text-center">
                            <img src={img} alt={`Enemy ${i}`} className="w-16 h-16" />
                            <p className="text-xs text-slate-500 mt-0.5">Extracted</p>
                          </div>
                          {matchedIcon && (
                            <div className="text-center">
                              <img src={matchedIcon} alt={`Match ${i}`} className="w-16 h-16" />
                              <p className="text-xs text-slate-500 mt-0.5">Matched</p>
                            </div>
                          )}
                          {overlayImage && (
                            <div className="text-center">
                              <img src={overlayImage} alt={`Overlay ${i}`} className="w-16 h-16" />
                              <p className="text-xs text-slate-500 mt-0.5">Overlay</p>
                            </div>
                          )}
                          {diffImage && (
                            <div className="text-center">
                              <img src={diffImage} alt={`Diff ${i}`} className="w-16 h-16" />
                              <p className="text-xs text-slate-500 mt-0.5">Diff</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-center text-slate-400 mt-1">Pos {i}</p>
                        {matchInfo && (
                          <div className="text-xs text-center mt-1">
                            <p className="text-red-400 font-semibold">{matchInfo.heroId}</p>
                            <p className="text-slate-500">{(matchInfo.confidence * 100).toFixed(1)}%</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

