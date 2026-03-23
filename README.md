# Watermark Removal Tool

A browser-based tool to automatically detect and remove star-shaped watermarks from images using OpenCV.js.

## Features

- **Automatic Detection**: Detects star-shaped watermarks in the bottom-right corner
- **Browser-Based**: No server required, all processing happens in your browser
- **Privacy First**: Images never leave your device
- **Fast Processing**: Typically 2-10 seconds depending on image size
- **Easy to Use**: Simple drag-and-drop interface

## Quick Start

### 1. Start Local Server

You need to serve the application through a web server (not just opening the HTML file directly) for OpenCV.js to load properly.

**Option A: Using Python**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B: Using Node.js**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

**Option C: Using PHP**
```bash
php -S localhost:8000
```

### 2. Open in Browser

Navigate to: `http://localhost:8000`

### 3. Process Images

1. Drag and drop an image onto the upload area (or click to browse)
2. Wait for automatic detection and removal
3. Review the before/after comparison
4. Download the processed image

## Supported Formats

- **File Types**: JPG, PNG, WEBP
- **Max File Size**: 10MB
- **Recommended Dimensions**: Up to 4K (3840×2160)

## How It Works

### Detection Process

1. **Region Identification**: Focuses on the bottom-right 25% of the image
2. **Edge Detection**: Uses Canny edge detection to find contours
3. **Shape Filtering**: Identifies star-shaped objects based on:
   - Area: 100-5000 pixels
   - Circularity: 0.3-0.7 (typical for star shapes)
4. **Mask Creation**: Generates a binary mask with safety margin

### Removal Process

1. **Inpainting**: Uses OpenCV's Navier-Stokes inpainting algorithm
2. **Adaptive Radius**: Automatically adjusts based on watermark size
3. **Edge Blending**: Applies subtle Gaussian blur for seamless results
4. **Quality Preservation**: Maintains original image quality

## Configuration

Edit `src/config.js` to customize:

- Detection sensitivity (contour area, circularity thresholds)
- Inpainting radius
- Search region size
- File size limits
- Output format

## Project Structure

```
Watermark_Remover/
├── index.html              # Main web interface
├── assets/
│   └── css/
│       └── style.css       # Responsive styling
├── lib/
│   └── opencv-loader.js    # OpenCV.js initialization
├── src/
│   ├── config.js           # Configuration constants
│   ├── utils.js            # Helper functions
│   ├── watermark-detector.js   # Detection algorithm
│   ├── watermark-remover.js    # Inpainting logic
│   └── app.js              # Main application controller
└── README.md               # This file
```

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (may be slower)

## Troubleshooting

### OpenCV.js fails to load
- Ensure you're running through a web server (not file://)
- Check console for CORS errors
- Try refreshing the page

### Detection fails
- Verify watermark is in the bottom-right corner
- Check watermark size (should be 100-5000 pixels)
- Try adjusting detection thresholds in config.js

### Slow processing
- Large images (>5MP) may take 10-15 seconds
- Close other browser tabs to free memory
- Consider downscaling very large images first

### Memory issues
- Keep images under 10MB
- Process one image at a time
- Refresh the page if you've processed many images

## Performance

| Image Size | Typical Processing Time |
|------------|------------------------|
| 1MP (1000×1000) | 2-3 seconds |
| 5MP (2560×1920) | 5-8 seconds |
| 10MP (3648×2736) | 10-15 seconds |

*Times measured on modern desktop browser (Chrome, M1 Mac)*

## Privacy & Security

- **All processing is local**: Images never uploaded to any server
- **No tracking**: No analytics or data collection
- **Open source**: All code is visible and auditable
- **Offline capable**: Works without internet (after initial load)

## Future Enhancements

- [ ] Batch processing multiple images
- [ ] Manual watermark selection
- [ ] Support for different watermark positions
- [ ] AI-powered removal (LaMa model)
- [ ] Progressive web app (PWA) for offline use
- [ ] Browser extension

## Technical Details

**Dependencies:**
- OpenCV.js 4.8.0 (loaded from CDN)
- Pure JavaScript (no frameworks)

**Algorithms:**
- Edge detection: Canny
- Contour analysis: findContours
- Inpainting: Navier-Stokes (INPAINT_NS)

## License

This project is open source and available for personal and commercial use.

## Credits

Built with [OpenCV.js](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html) - the JavaScript binding of OpenCV.

---

**Need help?** Check the browser console for detailed error messages.
# gemini-watermark-remover
