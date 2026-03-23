/**
 * Watermark Remover
 * Removes watermark using OpenCV inpainting
 */

class WatermarkRemover {
  /**
   * Remove watermark from image using mask
   * @param {cv.Mat} imageMat - Input image matrix
   * @param {cv.Mat} maskMat - Binary mask of watermark region
   * @param {Object} boundingBox - Bounding box of watermark {x, y, w, h}
   * @returns {cv.Mat} Processed image with watermark removed
   */
  remove(imageMat, maskMat, boundingBox) {
    try {
      // Validate inputs
      if (!imageMat || !maskMat) {
        throw new Error('Invalid input: imageMat and maskMat are required');
      }

      console.log('Removing watermark:', {
        imageSize: `${imageMat.cols}x${imageMat.rows}`,
        maskSize: `${maskMat.cols}x${maskMat.rows}`,
        boundingBox: boundingBox
      });

      if (imageMat.rows !== maskMat.rows || imageMat.cols !== maskMat.cols) {
        throw new Error('Image and mask dimensions must match');
      }

      // Validate mask size
      const maskArea = cv.countNonZero(maskMat);
      const imageArea = imageMat.rows * imageMat.cols;
      const maskPercentage = ((maskArea / imageArea) * 100).toFixed(2);
      console.log(`Mask area: ${maskArea} pixels (${maskPercentage}% of image)`);

      if (maskArea === 0) {
        throw new Error('Mask is empty - no watermark region defined');
      }

      // Calculate adaptive inpainting radius
      const radius = this._calculateInpaintingRadius(boundingBox);
      console.log('Inpainting radius:', radius);

      // Convert image to appropriate format if needed
      const processedImage = this._prepareImage(imageMat);
      console.log('Image prepared, channels:', processedImage.channels());

      // Apply Navier-Stokes inpainting
      const result = new cv.Mat();
      console.log('Applying inpainting...');
      cv.inpaint(
        processedImage,
        maskMat,
        result,
        radius,
        cv.INPAINT_NS
      );
      console.log('Inpainting complete');

      // Apply post-processing for edge blending (if enabled)
      let finalResult;
      if (CONFIG.inpainting.enablePostProcessing) {
        console.log('Applying post-processing...');
        finalResult = this._postProcess(result, maskMat);
        console.log('Post-processing complete');
        result.delete();
      } else {
        console.log('Post-processing disabled, using raw inpainting result');
        finalResult = result;
      }

      // Clean up
      if (processedImage !== imageMat) {
        processedImage.delete();
      }

      return finalResult;

    } catch (error) {
      console.error('Watermark removal error:', error);
      throw error;
    }
  }

  /**
   * Validate mask size relative to image
   * @private
   */
  _validateMaskSize(maskMat, imageMat) {
    // Count non-zero pixels in mask
    const maskArea = cv.countNonZero(maskMat);
    const imageArea = imageMat.rows * imageMat.cols;

    // Mask should be between 0.01% and 10% of image
    const minArea = imageArea * 0.0001;
    const maxArea = imageArea * 0.1;

    return maskArea >= minArea && maskArea <= maxArea;
  }

  /**
   * Calculate adaptive inpainting radius based on watermark size
   * @private
   */
  _calculateInpaintingRadius(boundingBox) {
    if (!CONFIG.inpainting.adaptiveRadius || !boundingBox) {
      return CONFIG.inpainting.defaultRadius;
    }

    // Calculate diagonal of bounding box
    const diagonal = Math.sqrt(
      boundingBox.w * boundingBox.w +
      boundingBox.h * boundingBox.h
    );

    // Radius = diagonal * multiplier
    let radius = Math.floor(diagonal * CONFIG.inpainting.radiusMultiplier);

    // Clamp to min/max values
    radius = Math.max(CONFIG.inpainting.minRadius, radius);
    radius = Math.min(CONFIG.inpainting.maxRadius, radius);

    return radius;
  }

  /**
   * Prepare image for inpainting (ensure correct format)
   * @private
   */
  _prepareImage(imageMat) {
    // Inpainting works with 3-channel (RGB) or 1-channel (grayscale) images
    const channels = imageMat.channels();

    if (channels === 3) {
      // Already RGB, return as-is
      return imageMat;
    } else if (channels === 4) {
      // Convert RGBA to RGB
      const rgb = new cv.Mat();
      cv.cvtColor(imageMat, rgb, cv.COLOR_RGBA2RGB);
      return rgb;
    } else if (channels === 1) {
      // Already grayscale, return as-is
      return imageMat;
    } else {
      throw new Error(`Unsupported image format: ${channels} channels`);
    }
  }

  /**
   * Post-process inpainted image for better blending
   * @private
   */
  _postProcess(inpaintedMat, maskMat) {
    // Apply subtle Gaussian blur only to the masked region for seamless blending
    try {
      // Create a slightly dilated mask for the blur region
      const blurMask = new cv.Mat();
      const kernel = cv.getStructuringElement(
        cv.MORPH_ELLIPSE,
        new cv.Size(7, 7)
      );
      cv.dilate(maskMat, blurMask, kernel, new cv.Point(-1, -1), 2);

      // Apply subtle blur to entire inpainted image
      const blurred = new cv.Mat();
      const ksize = new cv.Size(
        CONFIG.inpainting.gaussianKernelSize,
        CONFIG.inpainting.gaussianKernelSize
      );
      cv.GaussianBlur(
        inpaintedMat,
        blurred,
        ksize,
        CONFIG.inpainting.gaussianSigma
      );

      // Copy only the blurred masked region back to result
      const result = new cv.Mat();
      inpaintedMat.copyTo(result);
      blurred.copyTo(result, blurMask);

      // Clean up
      blurMask.delete();
      blurred.delete();
      kernel.delete();

      return result;

    } catch (error) {
      console.warn('Post-processing failed, returning inpainted result:', error);
      return inpaintedMat.clone();
    }
  }

  /**
   * Simple remove without post-processing (faster)
   * @param {cv.Mat} imageMat - Input image matrix
   * @param {cv.Mat} maskMat - Binary mask of watermark region
   * @param {Object} boundingBox - Bounding box of watermark
   * @returns {cv.Mat} Processed image
   */
  removeFast(imageMat, maskMat, boundingBox) {
    const radius = this._calculateInpaintingRadius(boundingBox);
    const processedImage = this._prepareImage(imageMat);

    const result = new cv.Mat();
    cv.inpaint(processedImage, maskMat, result, radius, cv.INPAINT_NS);

    if (processedImage !== imageMat) {
      processedImage.delete();
    }

    return result;
  }
}

// Create singleton instance
const watermarkRemover = new WatermarkRemover();
