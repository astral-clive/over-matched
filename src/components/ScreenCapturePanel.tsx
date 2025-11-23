"use client";

import { useState, useEffect, useRef } from "react";
import { requestScreenCapture, captureFrame, captureFrameAsDataURL, type CaptureStream } from "@/lib/screenCapture";
import { detectHeroes, type DetectionResult } from "@/lib/imageRecognition";

interface ScreenCapturePanelProps {
  onHeroesDetected: (enemyHeroes: string[], allyHeroes: string[]) => void;
}

type CaptureStatus = 
  | { type: "idle" }
  | { type: "requesting" }
  | { type: "ready" }
  | { type: "capturing" }
  | { type: "processing" }
  | { type: "success"; data: DetectionResult }
  | { type: "error"; message: string }
  | { type: "no-scoreboard" };

export default function ScreenCapturePanel({ onHeroesDetected }: ScreenCapturePanelProps) {
  const [status, setStatus] = useState<CaptureStatus>({ type: "idle" });
  const [autoCapture, setAutoCapture] = useState(false);
  const [captureInterval, setCaptureInterval] = useState(7); // seconds
  const [countdown, setCountdown] = useState(0);
  const [lastPreview, setLastPreview] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(true); // Show debug info by default

  const captureStreamRef = useRef<CaptureStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef(false); // Prevent concurrent captures

  // Initialize screen capture
  const handleInitCapture = async () => {
    setStatus({ type: "requesting" });
    
    try {
      const captureStream = await requestScreenCapture();
      captureStreamRef.current = captureStream;
      setStatus({ type: "ready" });
    } catch (error) {
      setStatus({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Failed to initialize capture" 
      });
    }
  };

  // Perform single capture
  const performCapture = async () => {
    if (!captureStreamRef.current) {
      setStatus({ type: "error", message: "Screen capture not initialized" });
      return;
    }

    // Prevent concurrent captures
    if (isCapturingRef.current) {
      console.log("Capture already in progress, skipping...");
      return;
    }

    isCapturingRef.current = true;
    setStatus({ type: "capturing" });

    try {
      // Add a small delay to ensure video is rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check video status
      const video = captureStreamRef.current.videoElement;
      if (video.readyState < 2) {
        throw new Error("Video stream not ready. Please try again.");
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Video has no dimensions. Screen may be black or not rendering.");
      }

      // Capture frame for detection
      const frameData = captureFrame(video);

      setStatus({ type: "processing" });

      // Detect heroes
      const result = await detectHeroes(frameData);

      if (!result.isScoreboardVisible) {
        // Don't update preview if scoreboard isn't visible - keep the last good one
        setStatus({ type: "no-scoreboard" });
        return;
      }

      // Only update preview when scoreboard is detected
      const previewUrl = captureFrameAsDataURL(video);
      setLastPreview(previewUrl);

      if (result.enemyHeroes.length > 0 || result.allyHeroes.length > 0) {
        // Notify parent component
        onHeroesDetected(result.enemyHeroes, result.allyHeroes);
        setStatus({ type: "success", data: result });
      } else {
        setStatus({ type: "success", data: result });
      }
    } catch (error) {
      console.error("Capture error:", error);
      setStatus({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Capture failed" 
      });
    } finally {
      isCapturingRef.current = false;
    }
  };

  // Handle auto-capture toggle
  const handleToggleAutoCapture = () => {
    setAutoCapture(!autoCapture);
  };

  // Stop capture and cleanup
  const handleStopCapture = () => {
    if (captureStreamRef.current) {
      captureStreamRef.current.stop();
      captureStreamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setAutoCapture(false);
    setCountdown(0);
    setStatus({ type: "idle" });
  };

  // Auto-capture effect
  useEffect(() => {
    if (autoCapture && captureStreamRef.current) {
      // Start countdown
      setCountdown(captureInterval);

      // Countdown timer
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return captureInterval;
          }
          return prev - 1;
        });
      }, 1000);

      // Capture timer - runs every N seconds
      intervalRef.current = setInterval(() => {
        performCapture();
      }, captureInterval * 1000);

      // Perform initial capture after a short delay
      const initialCaptureTimeout = setTimeout(() => {
        performCapture();
      }, 500);

      return () => {
        clearTimeout(initialCaptureTimeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(0);
    }
    // Only re-run when autoCapture or captureInterval changes, NOT on status changes
  }, [autoCapture, captureInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (captureStreamRef.current) {
        captureStreamRef.current.stop();
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Auto Hero Detection</h3>
          <p className="text-xs text-slate-400 mt-1">
            Automatically detect heroes from your Overwatch scoreboard
          </p>
        </div>
        {status.type !== "idle" && (
          <button
            onClick={handleStopCapture}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg text-xs font-medium transition-all"
          >
            Stop
          </button>
        )}
      </div>

      {/* Status Display */}
      <div className="mb-4">
        {status.type === "idle" && (
          <button
            onClick={handleInitCapture}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg font-semibold text-white text-sm transition-all shadow-lg hover:shadow-xl"
          >
            Enable Screen Capture
          </button>
        )}

        {status.type === "requesting" && (
          <div className="flex items-center justify-center py-3 text-slate-300 text-sm">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Requesting permission...
          </div>
        )}

        {(status.type === "ready" || status.type === "success" || status.type === "no-scoreboard") && (
          <div className="space-y-3">
            {/* Auto-capture toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <label className="text-sm font-medium text-slate-200">Auto-Capture</label>
                <p className="text-xs text-slate-400">Automatically scan every {captureInterval} seconds</p>
              </div>
              <button
                onClick={handleToggleAutoCapture}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoCapture ? "bg-purple-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoCapture ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Manual capture button */}
            {!autoCapture && (
              <button
                onClick={performCapture}
                disabled={status.type === "capturing" || status.type === "processing"}
                className="w-full py-2 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Capture Now
              </button>
            )}

            {/* Countdown */}
            {autoCapture && countdown > 0 && (
              <div className="flex items-center justify-center py-2 text-slate-300 text-sm">
                <svg className="animate-spin h-4 w-4 mr-2 text-purple-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Next capture in {countdown}s...
              </div>
            )}
          </div>
        )}

        {status.type === "capturing" && (
          <div className="flex items-center justify-center py-3 text-slate-300 text-sm">
            <svg className="animate-spin h-5 w-5 mr-2 text-cyan-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Capturing frame...
          </div>
        )}

        {status.type === "processing" && (
          <div className="flex items-center justify-center py-3 text-slate-300 text-sm">
            <svg className="animate-spin h-5 w-5 mr-2 text-purple-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Detecting heroes...
          </div>
        )}

        {status.type === "error" && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-300">Error</p>
                <p className="text-xs text-red-400 mt-1">{status.message}</p>
              </div>
            </div>
          </div>
        )}

        {status.type === "no-scoreboard" && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-300">Scoreboard not detected</p>
                <p className="text-xs text-yellow-400 mt-1">Press TAB in-game to show the scoreboard</p>
              </div>
            </div>
          </div>
        )}

        {status.type === "success" && status.data && status.data.debug && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-300">Scoreboard detected</p>
                <p className="text-xs text-green-400 mt-1">
                  {status.data.enemyHeroes.length > 0 || status.data.allyHeroes.length > 0
                    ? `Detected ${status.data.enemyHeroes.length} enemy and ${status.data.allyHeroes.length} ally heroes`
                    : "No heroes detected yet - make sure heroes are visible"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Confidence: {Math.round(status.data.confidence * 100)}%
                </p>
                
                {/* Debug visualization */}
                {status.data.debug.debugFrameImage && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Sampling Locations (Red=Ally, Yellow=Enemy)</label>
                    <img src={status.data.debug.debugFrameImage} alt="Debug frame" className="w-full rounded border border-slate-700" />
                  </div>
                )}
                
                {/* Extracted icons */}
                {status.data.debug.allyIconImages && status.data.debug.allyIconImages.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Extracted Ally Icons</label>
                    <div className="flex gap-2 flex-wrap">
                      {status.data.debug.allyIconImages.map((img, i) => (
                        <div key={i} className="border border-green-500/50 rounded p-1">
                          <img src={img} alt={`Ally ${i}`} className="w-12 h-12" />
                          <p className="text-xs text-center text-slate-400 mt-1">{i}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {status.data.debug.enemyIconImages && status.data.debug.enemyIconImages.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Extracted Enemy Icons</label>
                    <div className="flex gap-2 flex-wrap">
                      {status.data.debug.enemyIconImages.map((img, i) => (
                        <div key={i} className="border border-red-500/50 rounded p-1">
                          <img src={img} alt={`Enemy ${i}`} className="w-12 h-12" />
                          <p className="text-xs text-center text-slate-400 mt-1">{i}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview thumbnail */}
      {lastPreview && (
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 mb-2">Last Capture Preview</label>
          <img
            src={lastPreview}
            alt="Last capture preview"
            className="w-full rounded-lg border border-slate-700"
          />
        </div>
      )}

      {/* Debug info */}
      {debugMode && captureStreamRef.current && (
        <div className="mt-4 p-3 bg-slate-700/20 rounded-lg">
          <label className="block text-xs font-semibold text-slate-300 mb-2">Debug Info</label>
          <div className="text-xs text-slate-400 space-y-1 font-mono">
            <div>Video Ready: {captureStreamRef.current.videoElement.readyState >= 2 ? "✓" : "✗"}</div>
            <div>Video Size: {captureStreamRef.current.videoElement.videoWidth}x{captureStreamRef.current.videoElement.videoHeight}</div>
            <div>Video Playing: {!captureStreamRef.current.videoElement.paused ? "✓" : "✗"}</div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-slate-700/20 rounded-lg">
        <p className="text-xs text-slate-400">
          <strong className="text-slate-300">Tip:</strong> Select your entire screen or the Overwatch window when prompted. 
          Then press TAB in-game to show the scoreboard. If you see a black preview, try selecting "Entire Screen" 
          instead of a specific window.
        </p>
      </div>
    </div>
  );
}

