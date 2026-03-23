/**
 * Main Application Controller
 * Orchestrates the watermark removal workflow
 */

class WatermarkRemovalApp {
  constructor() {
    this.currentFile = null;
    this.originalImage = null;
    this.processedImage = null;
    this.detectionResult = null;
    this.isProcessing = false;

    // DOM elements (will be initialized after DOM loads)
    this.elements = {};
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize DOM elements
      this._initElements();

      // Set up event listeners
      this._setupEventListeners();

      // Show loading state
      this._showStatus('Initializing OpenCV.js...', 'info');

      // Load OpenCV.js
      await opencvLoader.load();

      // Ready to use
      this._showStatus('Ready! Drop an image to remove watermark', 'success');
      this._updateUI('ready');

    } catch (error) {
      console.error('Initialization error:', error);
      this._showStatus('Failed to initialize. Please refresh the page.', 'error');
      this._updateUI('error');
    }
  }

  /**
   * Initialize DOM element references
   * @private
   */
  _initElements() {
    this.elements = {
      dropZone: document.getElementById('drop-zone'),
      fileInput: document.getElementById('file-input'),
      uploadButton: document.getElementById('upload-button'),
      progressContainer: document.getElementById('progress-container'),
      progressBar: document.getElementById('progress-bar'),
      progressText: document.getElementById('progress-text'),
      statusMessage: document.getElementById('status-message'),
      previewContainer: document.getElementById('preview-container'),
      beforeCanvas: document.getElementById('before-canvas'),
      afterCanvas: document.getElementById('after-canvas'),
      downloadButton: document.getElementById('download-button'),
      resetButton: document.getElementById('reset-button'),
      fileInfo: document.getElementById('file-info')
    };
  }

  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Upload button click
    this.elements.uploadButton?.addEventListener('click', () => {
      this.elements.fileInput?.click();
    });

    // File input change
    this.elements.fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.processFile(file);
    });

    // Drag and drop
    this.elements.dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.dropZone.classList.add('drag-over');
    });

    this.elements.dropZone?.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.dropZone.classList.remove('drag-over');
    });

    this.elements.dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.dropZone.classList.remove('drag-over');

      const file = e.dataTransfer.files[0];
      if (file) this.processFile(file);
    });

    // Download button
    this.elements.downloadButton?.addEventListener('click', () => {
      this.downloadProcessedImage();
    });

    // Reset button
    this.elements.resetButton?.addEventListener('click', () => {
      this.reset();
    });
  }

  /**
   * Process uploaded file
   * @param {File} file - The image file to process
   */
  async processFile(file) {
    if (this.isProcessing) {
      this._showStatus('Already processing an image...', 'warning');
      return;
    }

    // Validate file
    const validation = Utils.validateFile(file);
    if (!validation.valid) {
      this._showStatus(validation.error, 'error');
      return;
    }

    this.isProcessing = true;
    this.currentFile = file;
    this._updateUI('processing');

    try {
      Utils.timer.start();

      // Step 1: Load image (0-25%)
      this._updateProgress(0, 'Loading image...');
      const img = await Utils.loadImage(file);
      this.originalImage = img;

      // Show file info
      this._showFileInfo(file, img);

      this._updateProgress(25, 'Detecting watermark...');

      // Step 2: Convert to OpenCV Mat
      const imageMat = Utils.imageToMat(img);

      // Step 3: Detect watermark (25-50%)
      const detection = watermarkDetector.detect(imageMat);
      this.detectionResult = detection;

      if (!detection.found) {
        this._updateProgress(100, 'No watermark detected');
        this._showStatus('No watermark detected in the image', 'warning');

        // Show original image in both canvases
        this._displayOriginalImage(img);

        imageMat.delete();
        this.isProcessing = false;
        this._updateUI('no-detection');
        return;
      }

      this._updateProgress(50, `Removing watermark (confidence: ${(detection.confidence * 100).toFixed(0)}%)...`);

      // Step 4: Remove watermark (50-75%)
      console.log('Starting watermark removal...');
      const processedMat = watermarkRemover.remove(
        imageMat,
        detection.mask,
        detection.boundingBox
      );
      console.log('Watermark removal returned mat:', {
        size: `${processedMat.cols}x${processedMat.rows}`,
        channels: processedMat.channels(),
        type: processedMat.type()
      });

      this._updateProgress(75, 'Finalizing...');

      // Step 5: Display results (75-100%)
      console.log('Displaying results...');
      this._displayResults(img, processedMat, detection.boundingBox, detection.allCandidates);

      // Clean up OpenCV matrices
      imageMat.delete();
      processedMat.delete();
      detection.mask.delete();

      const elapsed = Utils.timer.stop();
      this._updateProgress(100, 'Complete!');
      this._showStatus(
        `Watermark removed successfully in ${Utils.timer.format(elapsed)}`,
        'success'
      );

      this.isProcessing = false;
      this._updateUI('complete');

    } catch (error) {
      console.error('Processing error:', error);
      this._showStatus(`Error: ${error.message}`, 'error');
      this.isProcessing = false;
      this._updateUI('error');
    }
  }

  /**
   * Display original image in both canvases
   * @private
   */
  _displayOriginalImage(img) {
    const beforeCanvas = this.elements.beforeCanvas;
    const afterCanvas = this.elements.afterCanvas;

    if (beforeCanvas && afterCanvas) {
      beforeCanvas.width = img.width;
      beforeCanvas.height = img.height;
      afterCanvas.width = img.width;
      afterCanvas.height = img.height;

      const beforeCtx = beforeCanvas.getContext('2d');
      const afterCtx = afterCanvas.getContext('2d');

      beforeCtx.drawImage(img, 0, 0);
      afterCtx.drawImage(img, 0, 0);
    }
  }

  /**
   * Display processing results
   * @private
   */
  _displayResults(originalImg, processedMat, boundingBox, allCandidates) {
    const beforeCanvas = this.elements.beforeCanvas;
    const afterCanvas = this.elements.afterCanvas;

    if (!beforeCanvas || !afterCanvas) return;

    console.log('_displayResults called with:', {
      originalSize: `${originalImg.width}x${originalImg.height}`,
      processedMatSize: `${processedMat.cols}x${processedMat.rows}`,
      processedMatChannels: processedMat.channels(),
      boundingBox: boundingBox,
      numCandidates: allCandidates ? allCandidates.length : 0
    });

    // Set canvas dimensions
    beforeCanvas.width = originalImg.width;
    beforeCanvas.height = originalImg.height;
    afterCanvas.width = originalImg.width;
    afterCanvas.height = originalImg.height;

    // Draw original image
    const beforeCtx = beforeCanvas.getContext('2d');
    beforeCtx.drawImage(originalImg, 0, 0);

    // Draw all candidate boxes in blue (for debugging)
    if (CONFIG.ui.showAllCandidates && allCandidates && allCandidates.length > 0) {
      console.log(`Drawing ${allCandidates.length} candidate boxes in blue...`);
      allCandidates.forEach((box, i) => {
        Utils.drawBoundingBox(beforeCanvas, box, 'rgba(0, 100, 255, 0.5)');
      });
    }

    // Draw selected detection box in red (on top of blue ones)
    if (CONFIG.ui.showDetectionBox && boundingBox) {
      Utils.drawBoundingBox(beforeCanvas, boundingBox, 'red');
    }

    // Draw processed image
    console.log('Drawing processed mat to after canvas...');
    try {
      cv.imshow(afterCanvas, processedMat);
      console.log('Successfully displayed processed image');
    } catch (error) {
      console.error('Error displaying processed image:', error);
      // Fallback: show original
      const afterCtx = afterCanvas.getContext('2d');
      afterCtx.drawImage(originalImg, 0, 0);
    }

    // Store processed canvas for download
    this.processedImage = afterCanvas;
  }

  /**
   * Show file information
   * @private
   */
  _showFileInfo(file, img) {
    if (this.elements.fileInfo) {
      this.elements.fileInfo.innerHTML = `
        <strong>${file.name}</strong><br>
        ${img.width} × ${img.height} px | ${Utils.formatFileSize(file.size)}
      `;
    }
  }

  /**
   * Download processed image
   */
  downloadProcessedImage() {
    if (!this.processedImage || !this.currentFile) {
      this._showStatus('No processed image to download', 'warning');
      return;
    }

    Utils.downloadCanvas(this.processedImage, this.currentFile.name);
    this._showStatus('Image downloaded!', 'success');
  }

  /**
   * Reset application state
   */
  reset() {
    // Clean up
    this.currentFile = null;
    this.originalImage = null;
    this.processedImage = null;
    this.detectionResult = null;
    this.isProcessing = false;

    // Clear file input
    if (this.elements.fileInput) {
      this.elements.fileInput.value = '';
    }

    // Clear canvases
    if (this.elements.beforeCanvas) {
      const ctx = this.elements.beforeCanvas.getContext('2d');
      ctx.clearRect(0, 0, this.elements.beforeCanvas.width, this.elements.beforeCanvas.height);
    }
    if (this.elements.afterCanvas) {
      const ctx = this.elements.afterCanvas.getContext('2d');
      ctx.clearRect(0, 0, this.elements.afterCanvas.width, this.elements.afterCanvas.height);
    }

    // Update UI
    this._updateUI('ready');
    this._showStatus('Ready for next image', 'info');
  }

  /**
   * Update progress bar
   * @private
   */
  _updateProgress(percent, text) {
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${percent}%`;
    }
    if (this.elements.progressText) {
      this.elements.progressText.textContent = text;
    }
  }

  /**
   * Show status message
   * @private
   */
  _showStatus(message, type = 'info') {
    if (this.elements.statusMessage) {
      this.elements.statusMessage.textContent = message;
      this.elements.statusMessage.className = `status-message status-${type}`;
    }
  }

  /**
   * Update UI state
   * @private
   */
  _updateUI(state) {
    // Hide/show elements based on state
    const states = {
      ready: {
        dropZone: true,
        progressContainer: false,
        previewContainer: false
      },
      processing: {
        dropZone: false,
        progressContainer: true,
        previewContainer: false
      },
      complete: {
        dropZone: false,
        progressContainer: false,
        previewContainer: true
      },
      'no-detection': {
        dropZone: false,
        progressContainer: false,
        previewContainer: true
      },
      error: {
        dropZone: true,
        progressContainer: false,
        previewContainer: false
      }
    };

    const stateConfig = states[state];
    if (stateConfig) {
      this._toggleElement('drop-zone', stateConfig.dropZone);
      this._toggleElement('progress-container', stateConfig.progressContainer);
      this._toggleElement('preview-container', stateConfig.previewContainer);
    }
  }

  /**
   * Toggle element visibility
   * @private
   */
  _toggleElement(id, show) {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new WatermarkRemovalApp();
  app.init();
});
