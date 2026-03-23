# Fix: Only Merge NEARBY Candidates (Not Distant Text)

## Problem Identified

From your screenshot, the issue is crystal clear:

**Console shows:**
```
Merging 12 candidates:
  merged: '227x236 at (9,0)'  ← HUGE BOX covering EVERYTHING!

Adjusted bounding box: {x: 1553, y: 1536, w: 431, h: 448}
Mask area: 212841 pixels (5.07% of image)  ← 5% of entire image!
```

**Visual shows:**
- ✅ **95×95 blue box** (bottom-right) = THE STAR watermark
- ❌ **Text blue boxes** (top area) = NOT watermark, just noise
- ❌ **Red box** = Merges EVERYTHING from top to bottom

**What went wrong:**
```
Candidates:
  1-2: Star parts at (212, 212) and (186, 186) ← CLOSE TOGETHER ✓
  3-12: Text at (170, 0), (147, 0), (141, 0)... ← FAR AWAY ✗

Old algorithm: Merge ALL 12 = Huge 227×236 box ✗
```

The old merge function blindly combined **ALL candidates**, including text that's **200+ pixels away** from the star!

## Solution: Proximity-Based Clustering

### New Algorithm:

**1. Cluster by Distance**
- Group candidates that are within **100 pixels** of each other
- Candidates > 100 pixels apart = separate clusters

**2. Score Each Cluster**
- Calculate average score for each cluster
- Cluster with text (low position scores) = low average
- Cluster with star (high position scores) = high average

**3. Select Best Cluster**
- Pick cluster with highest average score
- This will be the star cluster (bottom-right, high scores)

**4. Merge Only That Cluster**
- Ignore all other clusters (text, noise)
- Create bounding box around ONLY the star parts

### Expected Behavior

**Console output after fix:**
```
Found 2 clusters from 12 candidates

  Cluster 1: 2 candidates, avgScore=0.903
    boxes: ['24x24 at (212,212)', '50x50 at (186,186)'] ← THE STAR!

  Cluster 2: 10 candidates, avgScore=0.512
    boxes: ['9x10 at (170,0)', '11x5 at (147,0)', ...] ← Text/noise

Selected best cluster with 2 candidates  ← Star cluster wins!

Merged 2 nearby candidates:
  merged: '95x95 at (186,186)'  ← CORRECT SIZE!

Adjusted bounding box: {x: 1900, y: 1900, w: 190, h: 190}
Mask area: 45000 pixels (1.07% of image)  ← Much more reasonable!
```

**Key differences:**
- ✅ Only 2 candidates merged (star parts), not all 12
- ✅ Box size ~95×95 (correct), not 227×236 (way too big)
- ✅ Mask area ~1% (correct), not 5% (way too large)
- ✅ Text cluster ignored completely

### Visual Result

**"Before" image:**
- **Red box ~95×95** around the star only
- Blue boxes show 2 clusters:
  - Bottom-right cluster (star) = merged
  - Top cluster (text) = ignored

**"After" image:**
- **Only the star removed** ✓
- Text completely untouched ✓
- No large blurred areas ✓

## Test Right Now! 🎯

### 1. Hard Refresh
`Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### 2. Upload Your Image

### 3. Check Console

**Look for:**
```
Found 2 clusters from 12 candidates
  Cluster 1: 2 candidates, avgScore=0.9XX  ← High score (star)
  Cluster 2: 10 candidates, avgScore=0.5XX ← Low score (text)

Selected best cluster with 2 candidates
Merged 2 nearby candidates: merged: '95x95 at (186,186)'
```

**NOT:**
```
Merging 12 candidates: merged: '227x236 at (9,0)'  ← This was wrong!
```

### 4. Visual Check

- **Red box should be ~95×95** (size of star)
- **Red box should be in bottom-right corner only**
- **Text at top should have blue boxes but NOT inside red box**

### 5. After Image

- **Only the star removed**
- **No large blurred areas**
- **Text completely preserved**

## Configuration

The proximity threshold is set to **100 pixels** in the code:

```javascript
const proximityThreshold = 100; // Pixels
```

**If star parts are further apart:**
```javascript
const proximityThreshold = 150; // Increase for larger spacing
```

**If accidentally merging unrelated candidates:**
```javascript
const proximityThreshold = 50;  // Decrease for stricter grouping
```

## Summary

**Old approach:**
- Merge ALL candidates indiscriminately ✗
- Result: Huge box covering text + star ✗

**New approach:**
- Cluster candidates by distance (100px threshold) ✓
- Select cluster with highest score (the star) ✓
- Merge only that cluster ✓
- Result: Small box covering only the star ✓

---

**This should now remove ONLY the 95×95 star in the bottom-right corner!** 🎯
