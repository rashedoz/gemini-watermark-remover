# Quick Start Guide

Get the Watermark Removal Tool running in 60 seconds!

## Step 1: Start the Server

Open Terminal and run:

```bash
cd /Volumes/CloudOn/Tools/Watermark_Remover
python3 -m http.server 8000
```

You should see:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

## Step 2: Open in Browser

Open your web browser and navigate to:
```
http://localhost:8000
```

Wait for "Ready! Drop an image to remove watermark" message.

## Step 3: Test with Sample Image

1. Open Finder and navigate to:
   ```
   /Volumes/CloudOn/Designs/Banners/p1.png
   ```

2. Drag `p1.png` onto the browser window

3. Wait 5-10 seconds for processing

4. See before/after comparison with watermark removed!

5. Click "Download Processed Image" to save

## That's it! 🎉

---

## Quick Troubleshooting

**"OpenCV.js failed to load"**
- Check internet connection (needs to download OpenCV first time)
- Refresh the page
- Make sure you're using http:// not file://

**"No watermark detected"**
- Verify watermark is in bottom-right corner of image
- Check watermark is visible (not too small)
- Try adjusting detection settings in `src/config.js`

**Browser shows "Connection refused"**
- Make sure server is running (check Terminal)
- Try different port: `python3 -m http.server 8080`
- Open http://localhost:8080

---

## Need More Help?

- Full documentation: See `README.md`
- Testing guide: See `TESTING.md`
- Implementation details: See `IMPLEMENTATION_SUMMARY.md`

---

## What Next?

After successful test:
1. Try your own images with watermarks
2. Adjust detection settings if needed (`src/config.js`)
3. Share with your graphics team
4. Provide feedback for improvements

Enjoy removing those watermarks! ✨
