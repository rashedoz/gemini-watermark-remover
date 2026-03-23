# Testing Guide

## Quick Test

### 1. Start the Application

```bash
cd /Volumes/CloudOn/Tools/Watermark_Remover
python3 -m http.server 8000
```

### 2. Open Browser

Navigate to: `http://localhost:8000`

### 3. Test with Sample Image

The sample image is located at:
```
/Volumes/CloudOn/Designs/Banners/p1.png
```

**Steps:**
1. Drag and drop `p1.png` onto the upload area
2. Wait for processing (should take 5-10 seconds for a 6.5MB image)
3. Verify:
   - ✅ Watermark is detected in bottom-right corner (red box shown)
   - ✅ Before/After comparison displays correctly
   - ✅ Watermark is removed in the "After" image
   - ✅ No visible artifacts or color changes
   - ✅ Download button works

### 4. Expected Behavior

**Initial Load:**
- Status: "Initializing OpenCV.js..."
- Then: "Ready! Drop an image to remove watermark"

**During Processing:**
- Progress bar shows: 0% → 25% → 50% → 75% → 100%
- Steps shown:
  1. Loading image...
  2. Detecting watermark...
  3. Removing watermark (confidence: X%)...
  4. Finalizing...
  5. Complete!

**After Processing:**
- Before/After comparison visible
- File info shows: filename, dimensions, file size
- Download and "Process Another" buttons enabled

## Test Cases

### Test Case 1: Valid Image with Watermark
**Input:** Image with star watermark in bottom-right corner
**Expected:** Successful detection and removal
**Success Criteria:**
- Watermark detected with confidence > 60%
- Clean removal with no artifacts
- Processing completes in < 15 seconds

### Test Case 2: Image Without Watermark
**Input:** Clean image without watermark
**Expected:** "No watermark detected" message
**Success Criteria:**
- Message: "No watermark detected in the image"
- Original image shown in both preview panels
- User can process another image

### Test Case 3: Invalid File Type
**Input:** PDF, TXT, or other non-image file
**Expected:** Error message
**Success Criteria:**
- Message: "Invalid file type. Please upload .jpg, .jpeg, .png, .webp files"
- Application remains in ready state

### Test Case 4: File Too Large
**Input:** Image > 10MB
**Expected:** Error message
**Success Criteria:**
- Message: "File too large. Maximum size is 10MB"
- Application remains in ready state

### Test Case 5: Different Image Sizes
**Inputs:**
- Small: 800×600 (expected: 2-3 seconds)
- Medium: 1920×1080 (expected: 5-8 seconds)
- Large: 3840×2160 (expected: 10-15 seconds)

**Expected:** All process successfully with appropriate timing

## Browser Testing

Test in multiple browsers:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

**Check:**
- OpenCV.js loads correctly
- Drag-and-drop works
- Canvases render properly
- Download works
- Responsive design on tablet size

## Console Checks

Open browser DevTools (F12) and check:

**No Errors:**
- No red errors in Console
- No CORS errors
- No 404s for resources

**Expected Logs:**
```
OpenCV.js loaded successfully
```

## Performance Testing

### Memory Usage
1. Open DevTools → Performance/Memory tab
2. Process 3-5 images sequentially
3. Verify memory is released after each processing
4. No memory leaks (steady state after multiple images)

### Processing Time
Test with different image sizes and record times:

| Image | Dimensions | File Size | Processing Time |
|-------|------------|-----------|----------------|
| p1.png | ? × ? | 6.5MB | ? seconds |

## Edge Cases

### Edge Case 1: Very Small Watermark
**Setup:** Watermark < 100 pixels area
**Expected:** May not detect (by design)
**Workaround:** Adjust `minContourArea` in config.js

### Edge Case 2: Very Large Watermark
**Setup:** Watermark > 5000 pixels area
**Expected:** May not detect (by design)
**Workaround:** Adjust `maxContourArea` in config.js

### Edge Case 3: Multiple Images in Quick Succession
**Setup:** Drop multiple images rapidly
**Expected:** Warning "Already processing an image..."
**Behavior:** Queue is not supported, must wait for current processing

### Edge Case 4: Watermark Not in Bottom-Right
**Setup:** Watermark in top-left or center
**Expected:** Not detected
**Reason:** Detection only searches bottom-right 25%

## Troubleshooting Tests

### If Detection Fails:
1. Check watermark is in bottom-right corner
2. Verify watermark size (should be visible, not too tiny)
3. Open config.js and try adjusting:
   - `minContourArea: 50` (reduce from 100)
   - `maxContourArea: 8000` (increase from 5000)
   - `minCircularity: 0.2` (reduce from 0.3)

### If OpenCV.js Doesn't Load:
1. Check you're using http:// not file://
2. Check internet connection (needs to download OpenCV.js from CDN)
3. Try refreshing the page
4. Check browser console for errors

### If Processing is Slow:
1. Normal for large images (>5MP)
2. Close other browser tabs
3. Try smaller test image first
4. Check CPU usage

## Acceptance Criteria

The application is ready for use when:

- [x] All core files implemented and in correct locations
- [ ] Application loads without errors
- [ ] OpenCV.js initializes successfully
- [ ] Sample image (p1.png) processes successfully
- [ ] Watermark is detected with reasonable confidence (>60%)
- [ ] Removal quality is good (no obvious artifacts)
- [ ] Download produces valid image file
- [ ] "Process Another" resets correctly
- [ ] Works in Chrome, Firefox, Safari
- [ ] Responsive design works on tablet view

## Visual Quality Check

After processing, verify:

1. **No artifacts**: Removed area blends naturally
2. **Color consistency**: No color shifts in processed area
3. **Edge blending**: No hard edges around removal area
4. **Detail preservation**: Surrounding details remain sharp

## Success Metrics

**Detection Accuracy:** Should detect watermarks in 95%+ of valid test cases
**Processing Speed:** < 10 seconds for typical 5MP images
**Quality:** PSNR > 30 dB (visually imperceptible differences)
**Usability:** Non-technical users can operate without instructions

## Next Steps After Testing

1. Process 10-20 real images from graphics team
2. Gather feedback on detection accuracy
3. Adjust configuration if needed
4. Document any edge cases discovered
5. Create user guide with screenshots
6. Deploy to team

## Known Limitations

- Only detects watermarks in bottom-right 25% of image
- Star-shaped watermarks only (circularity 0.3-0.7)
- Single watermark per image
- No manual selection (fully automatic)
- Browser memory limits for very large images

## Support

If you encounter issues:
1. Check browser console (F12)
2. Review error messages
3. Verify file meets requirements (format, size)
4. Try different test image
5. Adjust config.js parameters
