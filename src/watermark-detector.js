/**
 * Watermark Detector
 * Detects star-shaped watermark in bottom-right corner of images
 */

class WatermarkDetector {
  /**
   * Detect watermark in image
   * @param {cv.Mat} imageMat - Input image matrix
   * @returns {Object} {found: boolean, mask: cv.Mat|null, boundingBox: Object|null, confidence: number}
   */
  detect(imageMat) {
    let detectionMat = null;
    let workingMat = null;

    try {
      // Downscale image for faster detection if needed
      const downscaled = Utils.downscaleForDetection(imageMat);
      detectionMat = downscaled.mat;
      const scale = downscaled.scale;

      // Calculate search region in bottom-right corner
      const searchRegion = this._calculateSearchRegion(detectionMat.cols, detectionMat.rows);

      // Extract bottom-right region
      const regionMat = detectionMat.roi(searchRegion);
      workingMat = regionMat.clone();
      regionMat.delete();

      // Convert to grayscale
      const gray = new cv.Mat();
      if (workingMat.channels() === 4) {
        cv.cvtColor(workingMat, gray, cv.COLOR_RGBA2GRAY);
      } else if (workingMat.channels() === 3) {
        cv.cvtColor(workingMat, gray, cv.COLOR_RGB2GRAY);
      } else {
        gray.delete();
        return this._noDetectionResult();
      }

      // Apply Gaussian blur to reduce noise
      const blurred = new cv.Mat();
      const ksize = new cv.Size(5, 5);
      cv.GaussianBlur(gray, blurred, ksize, 1.5);

      // Edge detection using Canny
      const edges = new cv.Mat();
      cv.Canny(
        blurred,
        edges,
        CONFIG.detection.cannyThreshold1,
        CONFIG.detection.cannyThreshold2,
        CONFIG.detection.cannyApertureSize
      );

      // Find contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      // Filter contours to find star-shaped watermark
      const candidates = this._filterContours(contours, scale);
      console.log(`Found ${contours.size()} total contours, ${candidates.length} candidates match criteria`);

      // Log all candidates with scores for debugging
      if (candidates.length > 0) {
        console.log('All candidates before scoring:');
        candidates.forEach((c, i) => {
          console.log(`  ${i + 1}. Area: ${c.area.toFixed(0)}, Circ: ${c.circularity.toFixed(3)}, Box: ${c.box.w}x${c.box.h} at (${c.box.x}, ${c.box.y})`);
        });
      }

      // Clean up
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();

      if (candidates.length === 0) {
        console.warn('No watermark candidates found - try adjusting detection parameters');
        workingMat.delete();
        if (scale !== 1.0) detectionMat.delete();
        return this._noDetectionResult();
      }

      // Select best candidate - prioritize STAR SHAPE in BOTTOM-RIGHT corner
      // Score based on: position (closer to bottom-right = better) + star-like circularity
      const scoredCandidates = candidates.map(c => {
        // Calculate how close to bottom-right corner (0 = far, 1 = very close)
        const centerX = c.box.x + c.box.w / 2;
        const centerY = c.box.y + c.box.h / 2;
        const distFromBottomRight = Math.sqrt(
          Math.pow(workingMat.cols - centerX, 2) +
          Math.pow(workingMat.rows - centerY, 2)
        );
        const maxDist = Math.sqrt(workingMat.cols * workingMat.cols + workingMat.rows * workingMat.rows);
        const positionScore = 1 - (distFromBottomRight / maxDist);

        // Accept any circularity - 4-pointed stars have very low circularity (0.01-0.05)
        // Don't penalize low circularity shapes
        const circularityScore = c.circularity < 0.1 ? 1.0 : 0.5;

        // Prefer smaller objects (stars are typically small, text is large)
        const sizeScore = c.area < 1000 ? 1.0 : (c.area < 3000 ? 0.5 : 0.1);

        // Combined score (position is most important for watermarks)
        const totalScore = (positionScore * 0.5) + (circularityScore * 0.3) + (sizeScore * 0.2);

        return { ...c, score: totalScore, positionScore, circularityScore, sizeScore };
      });

      // Log all scored candidates
      console.log('Candidates with scores (position=50%, circularity=30%, size=20%):');
      scoredCandidates.forEach((c, i) => {
        console.log(`  ${i + 1}. Score: ${c.score.toFixed(3)} (pos:${c.positionScore.toFixed(2)} circ:${c.circularityScore.toFixed(2)} size:${c.sizeScore.toFixed(2)}) - ${c.box.w}x${c.box.h} at (${c.box.x}, ${c.box.y})`);
      });

      // Merge nearby candidates (parts of the same watermark)
      const mergedBox = this._mergeNearbyCandidates(scoredCandidates);

      console.log(`\n✓ Merged ${scoredCandidates.length} candidates into single bounding box:`, mergedBox);

      // Adjust coordinates back to search region and original scale
      const adjustedBox = {
        x: Math.floor((searchRegion.x + mergedBox.x) / scale),
        y: Math.floor((searchRegion.y + mergedBox.y) / scale),
        w: Math.ceil(mergedBox.w / scale),
        h: Math.ceil(mergedBox.h / scale)
      };

      console.log('Adjusted bounding box:', adjustedBox);

      // Create mask for the detected watermark
      const mask = this._createMask(imageMat, adjustedBox);

      // Calculate confidence score based on average of all candidates
      const avgConfidence = scoredCandidates.reduce((sum, c) => sum + c.score, 0) / scoredCandidates.length;
      const confidence = Math.min(1.0, avgConfidence);

      // Store all candidates for debugging visualization
      const allAdjustedBoxes = candidates.map(c => ({
        x: Math.floor((searchRegion.x + c.box.x) / scale),
        y: Math.floor((searchRegion.y + c.box.y) / scale),
        w: Math.ceil(c.box.w / scale),
        h: Math.ceil(c.box.h / scale),
        area: c.area,
        circularity: c.circularity
      }));

      // Clean up
      workingMat.delete();
      if (scale !== 1.0) detectionMat.delete();

      return {
        found: true,
        mask: mask,
        boundingBox: adjustedBox,
        confidence: confidence,
        allCandidates: allAdjustedBoxes  // All detected candidates for debugging
      };

    } catch (error) {
      console.error('Detection error:', error);

      // Clean up on error
      if (workingMat) workingMat.delete();
      if (detectionMat) detectionMat.delete();

      return this._noDetectionResult();
    }
  }

  /**
   * Calculate search region in bottom-right corner
   * @private
   */
  _calculateSearchRegion(width, height) {
    const regionWidth = Math.floor(width * CONFIG.detection.searchRegionPercent);
    const regionHeight = Math.floor(height * CONFIG.detection.searchRegionPercent);

    return new cv.Rect(
      width - regionWidth,
      height - regionHeight,
      regionWidth,
      regionHeight
    );
  }

  /**
   * Filter contours based on area and shape
   * @private
   */
  _filterContours(contours, scale) {
    const candidates = [];
    const scaledMinArea = CONFIG.detection.minContourArea * (scale * scale);
    const scaledMaxArea = CONFIG.detection.maxContourArea * (scale * scale);

    console.log(`Filtering ${contours.size()} contours with criteria:`, {
      areaRange: `${scaledMinArea.toFixed(0)} - ${scaledMaxArea.toFixed(0)} pixels`,
      circularityRange: `${CONFIG.detection.minCircularity} - ${CONFIG.detection.maxCircularity}`
    });

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      const perimeter = cv.arcLength(contour, true);
      const circularity = perimeter === 0 ? 0 : (4 * Math.PI * area) / (perimeter * perimeter);
      const boundingRect = cv.boundingRect(contour);

      // Log every contour for debugging
      console.log(`  Contour ${i + 1}: area=${area.toFixed(0)}, circ=${circularity.toFixed(3)}, box=${boundingRect.width}x${boundingRect.height}`);

      // Check filters and log why rejected
      let rejected = false;
      let reason = '';

      if (area < scaledMinArea) {
        rejected = true;
        reason = `area too small (${area.toFixed(0)} < ${scaledMinArea.toFixed(0)})`;
      } else if (area > scaledMaxArea) {
        rejected = true;
        reason = `area too large (${area.toFixed(0)} > ${scaledMaxArea.toFixed(0)})`;
      } else if (perimeter === 0) {
        rejected = true;
        reason = 'perimeter is 0';
      } else if (circularity < CONFIG.detection.minCircularity) {
        rejected = true;
        reason = `circularity too low (${circularity.toFixed(3)} < ${CONFIG.detection.minCircularity})`;
      } else if (circularity > CONFIG.detection.maxCircularity) {
        rejected = true;
        reason = `circularity too high (${circularity.toFixed(3)} > ${CONFIG.detection.maxCircularity})`;
      }

      if (rejected) {
        console.log(`    ✗ REJECTED: ${reason}`);
      } else {
        console.log(`    ✓ ACCEPTED as candidate`);
        candidates.push({
          area: area,
          circularity: circularity,
          box: {
            x: boundingRect.x,
            y: boundingRect.y,
            w: boundingRect.width,
            h: boundingRect.height
          }
        });
      }
    }

    return candidates;
  }

  /**
   * Create binary mask for detected watermark
   * @private
   */
  _createMask(imageMat, boundingBox) {
    // Create empty mask (black)
    const mask = cv.Mat.zeros(imageMat.rows, imageMat.cols, cv.CV_8UC1);

    // Draw filled white rectangle in watermark region
    const topLeft = new cv.Point(boundingBox.x, boundingBox.y);
    const bottomRight = new cv.Point(
      boundingBox.x + boundingBox.w,
      boundingBox.y + boundingBox.h
    );
    const white = new cv.Scalar(255);
    cv.rectangle(mask, topLeft, bottomRight, white, -1);

    // Dilate mask to include safety margin
    const dilated = new cv.Mat();
    const kernelSize = CONFIG.detection.dilationSize;
    const kernel = cv.getStructuringElement(
      cv.MORPH_ELLIPSE,
      new cv.Size(kernelSize, kernelSize)
    );
    cv.dilate(
      mask,
      dilated,
      kernel,
      new cv.Point(-1, -1),
      CONFIG.detection.dilationIterations
    );

    // Clean up
    mask.delete();
    kernel.delete();

    return dilated;
  }

  /**
   * Merge nearby candidates into a single bounding box
   * Only merges candidates that are CLOSE TOGETHER (same watermark)
   * @private
   */
  _mergeNearbyCandidates(candidates) {
    if (candidates.length === 0) {
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0].box;
    }

    // Cluster candidates by proximity
    // Only merge candidates within 100 pixels of each other
    const proximityThreshold = 100;
    const clusters = this._clusterByProximity(candidates, proximityThreshold);

    console.log(`Found ${clusters.length} clusters from ${candidates.length} candidates`);
    clusters.forEach((cluster, i) => {
      const boxes = cluster.map(c => `${c.box.w}x${c.box.h} at (${c.box.x},${c.box.y})`);
      const avgScore = cluster.reduce((sum, c) => sum + c.score, 0) / cluster.length;
      console.log(`  Cluster ${i + 1}: ${cluster.length} candidates, avgScore=${avgScore.toFixed(3)}, boxes:`, boxes);
    });

    // Select the cluster with the highest average score
    const bestCluster = clusters.reduce((best, current) => {
      const bestAvg = best.reduce((sum, c) => sum + c.score, 0) / best.length;
      const currentAvg = current.reduce((sum, c) => sum + c.score, 0) / current.length;
      return currentAvg > bestAvg ? current : best;
    });

    console.log(`Selected best cluster with ${bestCluster.length} candidates`);

    // Merge only the candidates in the best cluster
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    bestCluster.forEach(c => {
      const box = c.box;
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.w);
      maxY = Math.max(maxY, box.y + box.h);
    });

    const merged = {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY
    };

    console.log(`Merged ${bestCluster.length} nearby candidates:`, {
      merged: `${merged.w}x${merged.h} at (${merged.x},${merged.y})`
    });

    return merged;
  }

  /**
   * Cluster candidates by proximity (distance between centers)
   * @private
   */
  _clusterByProximity(candidates, maxDistance) {
    const clusters = [];
    const used = new Set();

    for (let i = 0; i < candidates.length; i++) {
      if (used.has(i)) continue;

      const cluster = [candidates[i]];
      used.add(i);

      const centerI = {
        x: candidates[i].box.x + candidates[i].box.w / 2,
        y: candidates[i].box.y + candidates[i].box.h / 2
      };

      // Find all candidates within maxDistance
      for (let j = 0; j < candidates.length; j++) {
        if (i === j || used.has(j)) continue;

        const centerJ = {
          x: candidates[j].box.x + candidates[j].box.w / 2,
          y: candidates[j].box.y + candidates[j].box.h / 2
        };

        const distance = Math.sqrt(
          Math.pow(centerI.x - centerJ.x, 2) +
          Math.pow(centerI.y - centerJ.y, 2)
        );

        if (distance <= maxDistance) {
          cluster.push(candidates[j]);
          used.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Calculate confidence score for detection
   * @private
   */
  _calculateConfidence(candidate) {
    // Confidence based on how well circularity matches star shape
    // Ideal star circularity is around 0.5
    const idealCircularity = 0.5;
    const circularityScore = 1 - Math.abs(candidate.circularity - idealCircularity) / idealCircularity;

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, circularityScore));
  }

  /**
   * Return no detection result
   * @private
   */
  _noDetectionResult() {
    return {
      found: false,
      mask: null,
      boundingBox: null,
      confidence: 0
    };
  }
}

// Create singleton instance
const watermarkDetector = new WatermarkDetector();
