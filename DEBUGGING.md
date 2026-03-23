# Debugging Guide - Watermark Not Removed

## What I See from Your Screenshot

✅ **Detection is working** - Found 16 contours, 7 candidates
✅ **Small star detected** - 48×55 pixels at position (1444, 1499)
❌ **Wrong watermark detected** - The small star icon, not the "$200 ROAMING" text
❌ **Result looks identical** - Before and After images are the same

## The Real Problem

Your image has **two watermarks**:
1. **Small star icon** (48×55 pixels) - This is what got detected ✅
2. **"$200 ROAMING" text** - This is what you want removed ❌

The text watermark is **much larger** than the small star, and the detection parameters were too restrictive.

## Changes I Just Made

### 1. Expanded Detection Limits (Dramatically)
```javascript
// OLD VALUES
maxContourArea: 10000     // Too small for text
minCircularity: 0.2       // Too strict for text shapes
maxCircularity: 0.8       // Too strict

// NEW VALUES
maxContourArea: 100000    // 10x larger! Can detect big text
minCircularity: 0.05      // Very lenient for irregular text shapes
maxCircularity: 1.0       // Accept ANY shape
searchRegionPercent: 0.40 // Search 40% of image (was 30%)
```

### 2. Increased Inpainting Power
```javascript
// OLD VALUES
defaultRadius: 7
maxRadius: 15
radiusMultiplier: 0.15

// NEW VALUES
defaultRadius: 10         // Larger default
maxRadius: 30             // 2x larger maximum
radiusMultiplier: 0.20    // More aggressive
```

### 3. Added Better Debugging
- Now shows ALL detected candidates (not just the best one)
- Shows size and position of each candidate
- Better error messages if display fails

## How to Test Right Now

### 1. Hard Refresh Browser
**Mac:** `Cmd+Shift+R`
**Windows:** `Ctrl+Shift+R`

### 2. Upload Your Image Again

### 3. Check Console Output

You should now see something like:
```
Found 16 total contours, 10 candidates match criteria
All candidates:
  1. Area: 369, Circ: 0.415, Box: 48x55
  2. Area: 5242, Circ: 0.123, Box: 180x95   <- Might be text!
  3. Area: 12500, Circ: 0.087, Box: 220x120 <- Might be text!
  ...
Selected best candidate (#3): area: 12500, circ: 0.087, box: 220x120 at (...)
```

### 4. What to Look For

**Good signs:**
- More candidates detected (10+ instead of just 7)
- Larger area values (5000+, 10000+, 50000+)
- Lower circularity values (0.05 - 0.15 for text)
- Selected candidate has area > 5000

**Still problematic:**
- Only small candidates found (area < 1000)
- Still selecting the 48×55 star
- "After" image still identical to "Before"

## If Text Watermark Still Not Detected

The issue might be that **each letter** is detected as a **separate contour**. The algorithm is selecting the largest single contour, but "ROAMING" has 7 letters = 7 separate contours.

### Solution: Manual Configuration

If the console shows many small-to-medium sized candidates (area 1000-5000 each), we need to either:

**Option A: Lower the minimum area more**
```javascript
// In src/config.js
minContourArea: 20,  // Detect even smaller pieces
```

**Option B: Create custom mask for text region**

I can create a special mode that:
1. Finds ALL contours in the region
2. Creates a bounding box around ALL of them combined
3. Uses that combined area as the mask

## Understanding the "$200 ROAMING" Watermark

This watermark is **text-based**, which is challenging for contour detection because:
- Each letter is a separate shape
- The "$", "200", "ROAMING" might all be separate contours
- Simple inpainting may not work well on text (it's designed for small objects)

**Reality check:** OpenCV's basic inpainting works best for:
- ✅ Small logos (like your star icon)
- ✅ Watermarks < 10% of image area
- ❌ Large text overlays
- ❌ Complex multi-element watermarks

For large text watermarks, you might need:
- Advanced AI models (like LaMa or DeepFill)
- Manual selection/masking
- Multiple inpainting passes

## Immediate Next Steps

1. ✅ **Hard refresh and test** - See if new limits detect the text
2. ✅ **Check console** - Look for larger candidates (area > 5000)
3. ✅ **Share console output** - Paste the "All candidates" list
4. ⏳ **Evaluate results** - Is the text detected now?

If the text still isn't detected, I can:
- Add contour merging logic
- Create a manual selection mode
- Build a text-specific detection algorithm
- Implement a different removal strategy for text

## Quick Diagnostic

**Run this test:**
1. Hard refresh browser
2. Upload your image
3. Copy the "All candidates:" section from console
4. Share it here

This will tell us:
- Are we detecting the text pieces at all?
- Are they being filtered out?
- Or is the text just not showing up as contours?

---

**Status:** Enhanced detection parameters applied
**Next:** Test and share console output
