/**
 * Screen Capture Module
 * 
 * Handles browser Screen Capture API to capture frames from the Overwatch window
 */

export interface CaptureStream {
  stream: MediaStream;
  videoElement: HTMLVideoElement;
  stop: () => void;
}

/**
 * Request screen/window capture permission and return a stream
 */
export async function requestScreenCapture(): Promise<CaptureStream> {
  try {
    // Request screen capture permission
    // Note: cursor is a valid property in the Screen Capture API but not in TypeScript types
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "monitor", // Use monitor instead of window for better compatibility
        cursor: "never",
      } as any,
      audio: false,
    });

    // Create video element to render stream
    const videoElement = document.createElement("video");
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;

    // Wait for video to load AND start playing
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Video load timeout"));
      }, 5000);

      videoElement.onloadedmetadata = async () => {
        try {
          await videoElement.play();
          clearTimeout(timeout);
          // Wait a bit for the first frame to render
          setTimeout(resolve, 500);
        } catch (e) {
          clearTimeout(timeout);
          reject(e);
        }
      };
    });

    const stop = () => {
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    };

    return { stream, videoElement, stop };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        throw new Error("Screen capture permission denied");
      } else if (error.name === "NotSupportedError") {
        throw new Error("Screen capture not supported in this browser");
      }
    }
    throw new Error("Failed to initialize screen capture");
  }
}

/**
 * Capture a single frame from the video stream as ImageData
 */
export function captureFrame(videoElement: HTMLVideoElement): ImageData {
  // Check if video is ready
  if (videoElement.readyState < 2) {
    throw new Error("Video not ready for capture");
  }

  if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    throw new Error("Video dimensions are zero");
  }

  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Draw current video frame to canvas
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Extract image data
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Capture frame and return as data URL for preview
 */
export function captureFrameAsDataURL(videoElement: HTMLVideoElement): string {
  // Check if video is ready
  if (videoElement.readyState < 2) {
    throw new Error("Video not ready for capture");
  }

  if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    throw new Error("Video dimensions are zero");
  }

  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

