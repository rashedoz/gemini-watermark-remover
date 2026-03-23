# Debugging: No Candidates Found

## Current Situation

From your console:
```
Found 2 total contours, 0 candidates match criteria
No watermark candidates found
```

**Good news:** The star IS being detected (one of the 2 contours)
**Bad news:** It's being filtered out by area or circularity checks

## Changes Just Made

### 1. Added Detailed Rejection Logging

Now the console will show EXACTLY why each contour was rejected:

```
Filtering 2 contours with criteria:
  areaRange: 20 - 10000 pixels
  circularityRange: 0.05 - 0.95

  Contour 1: area=156, circ=0.234, box=18x16
    ✗ REJECTED: circularity too low (0.234 < 0.25)

  Contour 2: area=2450, circ=0.612, box=52x48
    ✓ ACCEPTED as candidate
```

### 2. Made Filters EXTREMELY Lenient

**Old values:**
- Area: 50 - 5,000 pixels
- Circularity: 0.25 - 0.75

**New values:**
- Area: **20 - 10,000 pixels** (accept tiny to medium)
- Circularity: **0.05 - 0.95** (accept almost ANY shape)
- Search region: **25%** (larger area)

These should catch your 4-pointed star regardless of its properties.

## Test Right Now

### 1. Hard Refresh
`Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### 2. Upload Your Image

### 3. Check Console Output

**You should see detailed output like:**
```
Filtering 2 contours with criteria:
  Contour 1: area=XXX, circ=X.XXX, box=WxH
    ✗ REJECTED: [reason] OR ✓ ACCEPTED
  Contour 2: area=XXX, circ=X.XXX, box=WxH
    ✗ REJECTED: [reason] OR ✓ ACCEPTED
```

## What to Look For

### Scenario A: Star Gets Accepted ✅
```
Contour 1: area=245, circ=0.123, box=18x16
  ✓ ACCEPTED as candidate
```
**Result:** Star should be detected and removed!

### Scenario B: Star Still Rejected ❌
```
Contour 1: area=245, circ=0.023, box=18x16
  ✗ REJECTED: circularity too low (0.023 < 0.05)
```
**Action:** I'll adjust the exact parameter that's rejecting it

### Scenario C: Both Contours Rejected ❌
```
Contour 1: area=15, circ=0.156, box=4x4
  ✗ REJECTED: area too small (15 < 20)

Contour 2: area=18500, circ=0.812, box=240x180
  ✗ REJECTED: area too large (18500 > 10000)
```
**Action:** Adjust min/max area based on actual values

## Next Steps

**Copy and paste the console output** showing:
```
Filtering X contours with criteria:
  Contour 1: ...
  Contour 2: ...
```

This will tell me:
1. What the star's actual area is
2. What the star's actual circularity is
3. Exactly which filter is rejecting it
4. What values I need to change

## Quick Manual Override

If you want to manually adjust parameters while we debug, edit `src/config.js`:

**If star's area is being rejected:**
```javascript
minContourArea: 10,    // Lower if star area < 20
maxContourArea: 20000, // Raise if star area > 10000
```

**If star's circularity is being rejected:**
```javascript
minCircularity: 0.01,  // Lower if star circ < 0.05
maxCircularity: 0.99,  // Raise if star circ > 0.95
```

**If not enough contours found (< 2):**
```javascript
searchRegionPercent: 0.35,  // Search larger area
cannyThreshold1: 20,        // More sensitive edge detection
cannyThreshold2: 80,        // More sensitive edge detection
```

---

**Test now and share the exact console output!** This will show us exactly what's happening. 🔍
