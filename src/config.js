/**
 * Watermark Removal Tool - Configuration
 * Central configuration for detection thresholds, processing parameters, and limits
 */

const CONFIG = {
  // File upload settings
  upload: {
    maxFileSizeMB: 10,
    maxFileSizeBytes: 10 * 1024 * 1024,
    acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
  },

  // Detection settings
  detection: {
    // Search region in bottom-right corner (as percentage of image dimensions)
    searchRegionPercent: 0.25, // 25% of width and height - bottom-right quadrant

    // Canny edge detection parameters
    cannyThreshold1: 30,      // Lowered from 50 for better edge detection
    cannyThreshold2: 100,     // Lowered from 150 for better edge detection
    cannyApertureSize: 3,

    // Contour filtering - NO shape restrictions, area only
    minContourArea: 10,       // Very small minimum to catch small watermarks
    maxContourArea: 10000,    // Larger maximum for various watermarks
    minCircularity: 0.001,    // Accept ANY shape including 4-pointed stars (was 0.05)
    maxCircularity: 0.99,     // Accept ANY shape

    // Mask dilation for safety margin (important for multi-part watermarks)
    dilationSize: 8,          // Larger dilation to cover gaps between star points
    dilationIterations: 3,    // More iterations for better coverage

    // Confidence thresholds
    minConfidence: 0.1,       // Very low threshold (was 0.4)

    // Image downscaling for performance
    maxDetectionWidth: 1920,  // Downscale larger images for detection
    maxDetectionHeight: 1080
  },

  // Inpainting settings
  inpainting: {
    defaultRadius: 15,        // Larger default for multi-part watermarks (was 10)
    minRadius: 8,             // Higher minimum (was 5)
    maxRadius: 40,            // Much larger maximum for merged areas (was 30)
    method: 'INPAINT_NS',     // Navier-Stokes inpainting (fast and good quality)

    // Adaptive radius based on watermark size
    adaptiveRadius: true,
    radiusMultiplier: 0.25,   // Higher multiplier for merged boxes (was 0.20)

    // Post-processing blur for edge blending
    enablePostProcessing: false,  // Disabled for debugging
    gaussianKernelSize: 5,
    gaussianSigma: 1.5
  },

  // Performance settings
  performance: {
    enableProgressTracking: true,
    processingTimeout: 30000, // 30 seconds max processing time
    memoryWarningThreshold: 8 * 1024 * 1024, // 8MP image warning
  },

  // UI settings
  ui: {
    showDetectionBox: true,      // Show red box around selected watermark
    showAllCandidates: true,     // Show all detected candidates (blue boxes)
    enableBeforeAfter: true,     // Show before/after comparison
    animationDuration: 300,      // UI animation duration in ms
    toastDuration: 3000          // Notification duration in ms
  },

  // OpenCV.js loading
  opencv: {
    cdnUrl: 'https://docs.opencv.org/4.8.0/opencv.js',
    localFallbackPath: '/lib/opencv.js',
    loadTimeout: 30000        // 30 seconds to load OpenCV.js
  },

  // Output settings
  output: {
    format: 'png',            // Output format (png for lossless)
    quality: 0.95,            // JPEG quality if format is jpeg
    filenameSuffix: '_watermark_removed'
  }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
