/**
 * Utility Functions
 * Helper functions for file validation, canvas manipulation, and image processing
 */

const Utils = {
  /**
   * Validate uploaded file
   * @param {File} file - The file to validate
   * @returns {Object} {valid: boolean, error: string|null}
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file type
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    const isValidType = CONFIG.upload.acceptedFormats.includes(fileType);
    const isValidExtension = CONFIG.upload.acceptedExtensions.some(ext =>
      fileName.endsWith(ext)
    );

    if (!isValidType && !isValidExtension) {
      return {
        valid: false,
        error: `Invalid file type. Please upload ${CONFIG.upload.acceptedExtensions.join(', ')} files`
      };
    }

    // Check file size
    if (file.size > CONFIG.upload.maxFileSizeBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${CONFIG.upload.maxFileSizeMB}MB`
      };
    }

    return { valid: true, error: null };
  },

  /**
   * Load image from file
   * @param {File} file - The image file
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  },

  /**
   * Convert HTMLImageElement to OpenCV Mat
   * @param {HTMLImageElement} img - The image element
   * @returns {cv.Mat}
   */
  imageToMat(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return cv.imread(canvas);
  },

  /**
   * Convert OpenCV Mat to canvas
   * @param {cv.Mat} mat - The OpenCV matrix
   * @param {HTMLCanvasElement} canvas - Target canvas
   */
  matToCanvas(mat, canvas) {
    cv.imshow(canvas, mat);
  },

  /**
   * Create canvas from image
   * @param {HTMLImageElement} img - The image element
   * @returns {HTMLCanvasElement}
   */
  imageToCanvas(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
  },

  /**
   * Download canvas as image file
   * @param {HTMLCanvasElement} canvas - The canvas to download
   * @param {string} originalFilename - Original file name
   */
  downloadCanvas(canvas, originalFilename) {
    const filename = this.generateOutputFilename(originalFilename);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }, `image/${CONFIG.output.format}`, CONFIG.output.quality);
  },

  /**
   * Generate output filename
   * @param {string} originalFilename - Original file name
   * @returns {string}
   */
  generateOutputFilename(originalFilename) {
    const nameParts = originalFilename.split('.');
    const extension = nameParts.pop();
    const baseName = nameParts.join('.');
    return `${baseName}${CONFIG.output.filenameSuffix}.${CONFIG.output.format}`;
  },

  /**
   * Calculate downscaled dimensions for detection
   * @param {number} width - Original width
   * @param {number} height - Original height
   * @returns {Object} {width: number, height: number, scale: number}
   */
  calculateDetectionDimensions(width, height) {
    const maxW = CONFIG.detection.maxDetectionWidth;
    const maxH = CONFIG.detection.maxDetectionHeight;

    if (width <= maxW && height <= maxH) {
      return { width, height, scale: 1.0 };
    }

    const scaleW = maxW / width;
    const scaleH = maxH / height;
    const scale = Math.min(scaleW, scaleH);

    return {
      width: Math.floor(width * scale),
      height: Math.floor(height * scale),
      scale
    };
  },

  /**
   * Downscale image for detection
   * @param {cv.Mat} mat - Original image matrix
   * @returns {Object} {mat: cv.Mat, scale: number}
   */
  downscaleForDetection(mat) {
    const dims = this.calculateDetectionDimensions(mat.cols, mat.rows);

    if (dims.scale === 1.0) {
      return { mat: mat.clone(), scale: 1.0 };
    }

    const downscaled = new cv.Mat();
    const dsize = new cv.Size(dims.width, dims.height);
    cv.resize(mat, downscaled, dsize, 0, 0, cv.INTER_AREA);

    return { mat: downscaled, scale: dims.scale };
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  /**
   * Draw bounding box on canvas
   * @param {HTMLCanvasElement} canvas - Target canvas
   * @param {Object} box - Bounding box {x, y, w, h}
   * @param {string} color - Box color (default: red)
   * @param {number} lineWidth - Line width (default: 3)
   */
  drawBoundingBox(canvas, box, color = 'red', lineWidth = 3) {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    // If it's a semi-transparent color, also add a label
    if (color.includes('rgba')) {
      ctx.fillStyle = color;
      ctx.fillRect(box.x, box.y - 20, 60, 18);
      ctx.fillStyle = 'white';
      ctx.font = '12px monospace';
      ctx.fillText(`${box.w}×${box.h}`, box.x + 2, box.y - 6);
    }
  },

  /**
   * Performance timer
   */
  timer: {
    start() {
      this.startTime = performance.now();
    },

    stop() {
      const elapsed = performance.now() - this.startTime;
      return elapsed;
    },

    format(ms) {
      if (ms < 1000) return ms.toFixed(0) + 'ms';
      return (ms / 1000).toFixed(2) + 's';
    }
  }
};
