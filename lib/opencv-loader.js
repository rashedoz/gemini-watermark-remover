/**
 * OpenCV.js Loader
 * Handles initialization of OpenCV.js with CDN and local fallback
 */

class OpenCVLoader {
  constructor() {
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;
  }

  /**
   * Load OpenCV.js from CDN with fallback to local copy
   * @returns {Promise<boolean>} True if loaded successfully
   */
  async load() {
    if (this.loaded) {
      return true;
    }

    if (this.loading) {
      return this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this._loadOpenCV();

    try {
      await this.loadPromise;
      this.loaded = true;
      return true;
    } catch (error) {
      this.loading = false;
      throw error;
    }
  }

  /**
   * Internal method to load OpenCV.js
   * @private
   */
  _loadOpenCV() {
    return new Promise((resolve, reject) => {
      // Check if OpenCV is already loaded
      if (typeof cv !== 'undefined' && cv.Mat) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('OpenCV.js loading timeout'));
      }, CONFIG.opencv.loadTimeout);

      // Create script element
      const script = document.createElement('script');
      script.async = true;
      script.type = 'text/javascript';

      // Set up onload handler
      script.onload = () => {
        clearTimeout(timeout);

        // Wait for OpenCV to be ready
        if (typeof cv !== 'undefined') {
          cv['onRuntimeInitialized'] = () => {
            console.log('OpenCV.js loaded successfully');
            resolve();
          };
        } else {
          reject(new Error('OpenCV.js loaded but cv object not found'));
        }
      };

      // Set up error handler - try local fallback
      script.onerror = () => {
        console.warn('Failed to load OpenCV.js from CDN, trying local fallback...');
        clearTimeout(timeout);

        // Try local fallback
        const fallbackScript = document.createElement('script');
        fallbackScript.async = true;
        fallbackScript.type = 'text/javascript';
        fallbackScript.src = CONFIG.opencv.localFallbackPath;

        fallbackScript.onload = () => {
          if (typeof cv !== 'undefined') {
            cv['onRuntimeInitialized'] = () => {
              console.log('OpenCV.js loaded from local fallback');
              resolve();
            };
          } else {
            reject(new Error('OpenCV.js fallback loaded but cv object not found'));
          }
        };

        fallbackScript.onerror = () => {
          reject(new Error('Failed to load OpenCV.js from both CDN and local fallback'));
        };

        document.head.appendChild(fallbackScript);
      };

      // Set source and append to document
      script.src = CONFIG.opencv.cdnUrl;
      document.head.appendChild(script);
    });
  }

  /**
   * Check if OpenCV is loaded
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded && typeof cv !== 'undefined' && cv.Mat;
  }
}

// Create singleton instance
const opencvLoader = new OpenCVLoader();
