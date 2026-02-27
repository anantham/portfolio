# Route Data Requirements for Cesium Journey

## Current State
Your `journeyEvents.json` has:
- ✅ **24 flights** (will stay as arcs)
- ✅ **10 train journeys** (need ground routes)
- ✅ **0 hikes** (type exists, can add later)
- ✅ Start/end coordinates (`lat`, `lng`)
- ✅ Transport mode (`transportFromPrevious`)

## What We Need for Beautiful Ground Routes

### Option A: **I'll Auto-Generate Routes** (For Now)
I'll use **Mapbox Directions API** or **Google Maps Routes API** to automatically generate waypoints between your train segments. You can refine them later.

**What I'll generate:**
```json
{
  "id": "lawrence-ooty",
  "routeWaypoints": [
    { "lat": 10.7867, "lng": 76.6548 },  // Palakkad (start)
    { "lat": 11.0234, "lng": 76.7123 },  // Auto waypoint 1
    { "lat": 11.2456, "lng": 76.6890 },  // Auto waypoint 2
    { "lat": 11.4102, "lng": 76.695 }    // Ooty (end)
  ],
  "routeDistance": 142.3,  // km
  "routeElevationProfile": [
    { "distance": 0, "elevation": 295 },
    { "distance": 50, "elevation": 1200 },
    { "distance": 100, "elevation": 2240 }
  ]
}
```

**This gives you:**
- ✅ Smooth curved paths (not straight lines)
- ✅ Elevation data for camera altitude
- ✅ Realistic train routes following roads/rails

---

### Option B: **You Provide Custom Routes** (For Specific Journeys)
For routes you want to be **exact** (like a specific scenic train line), provide GPX tracks or waypoint arrays.

#### Format 1: GPX Track (Best for hiking/scenic routes)
```xml
<!-- Example: Nilgiri Mountain Railway -->
<gpx>
  <trk>
    <name>Nilgiri Mountain Railway</name>
    <trkseg>
      <trkpt lat="11.4102" lon="76.695"><ele>2240</ele></trkpt>
      <trkpt lat="11.3850" lon="76.710"><ele>1950</ele></trkpt>
      <!-- ... more points -->
    </trkseg>
  </trk>
</gpx>
```

#### Format 2: JSON Waypoints (Easiest)
```json
{
  "id": "lawrence-ooty",
  "customRoute": {
    "waypoints": [
      { "lat": 10.7867, "lng": 76.6548, "elevation": 295, "label": "Palakkad Junction" },
      { "lat": 11.0102, "lng": 76.7020, "elevation": 450, "label": "Coimbatore" },
      { "lat": 11.3501, "lng": 76.7337, "elevation": 1600, "label": "Coonoor" },
      { "lat": 11.4102, "lng": 76.6950, "elevation": 2240, "label": "Ooty Station" }
    ],
    "routeType": "rail",  // "rail", "road", "trail"
    "terrain": "mountain", // "mountain", "coastal", "plain", "urban"
    "highlights": [
      { "distance": 85.2, "label": "Entered Nilgiri Mountains", "camera": "wide" },
      { "distance": 120.5, "label": "Wellington Tunnel", "camera": "close" }
    ]
  }
}
```

---

## Enhanced Data Fields (Optional but Awesome)

Add these to any journey event for **cinematic control**:

### Camera Hints
```json
{
  "id": "your-event-id",
  "cameraSettings": {
    "dwellAltitude": 50000,      // meters (auto-calculated by default)
    "travelAltitude": 500,        // how high to follow train (default: 500m)
    "travelPitch": -60,           // camera angle (default: -45°)
    "travelBearing": "auto",      // or specific heading in degrees
    "transitionDuration": 3000,   // swoop animation time in ms
    "followDistance": 800         // how far behind entity to place camera
  }
}
```

### 3D Model Overrides
```json
{
  "id": "trans-siberian",
  "entityModel": {
    "type": "train",
    "model": "/models/steam-locomotive.glb",  // custom 3D model
    "scale": 1.5,
    "rotationOffset": 90  // if model faces wrong direction
  }
}
```

### Visual Effects
```json
{
  "id": "himalayan-trek",
  "effects": {
    "trail": {
      "enabled": true,
      "color": "#22c55e",
      "width": 3,
      "glowPower": 0.4,
      "fadeTime": 2000  // ms for trail to fade
    },
    "particles": {
      "type": "dust",  // "steam", "dust", "snow"
      "density": 0.7
    },
    "atmosphere": {
      "fog": 0.3,  // 0-1
      "lighting": "golden-hour"  // "noon", "golden-hour", "dusk"
    }
  }
}
```

### Points of Interest (POIs)
```json
{
  "id": "golden-temple-visit",
  "pois": [
    {
      "lat": 31.6200,
      "lng": 74.8765,
      "label": "Golden Temple",
      "pauseFor": 2000,  // pause camera here for 2 seconds
      "zoomTo": 200,     // zoom to 200m altitude
      "description": "Sacred Sikh shrine"
    }
  ]
}
```

---

## Your 10 Train Journeys That Need Routes

Here's what I found in your data:

| From → To | Distance (est) | Route Type | Priority |
|-----------|----------------|------------|----------|
| Palakkad → Coimbatore | ~50 km | Regional | Medium |
| Coimbatore → Palakkad | ~50 km | Regional | Medium |
| Thrissur → Palakkad | ~80 km | Regional | Medium |
| Palakkad → Ooty | ~140 km | **Mountain Railway** ⭐ | **HIGH** |
| Ooty → Palakkad | ~140 km | **Mountain Railway** ⭐ | **HIGH** |
| Palakkad → Sriperumbudur | ~350 km | Long distance | Low |
| Sriperumbudur → Dehradun | ~2400 km | **Trans-India** ⭐ | **HIGH** |
| Trivandrum → Bengaluru | ~650 km | Regional express | Medium |
| Thiruvananthapuram → Hyderabad | ~1100 km | Long distance | Medium |
| Hyderabad → Delhi | ~1600 km | Long distance | Medium |

### Recommended Focus
I'll auto-generate all 10, but you might want **custom routes** for:
1. **Nilgiri Mountain Railway** (Palakkad → Ooty) - Iconic scenic route
2. **Trans-India journey** (Sriperumbudur → Dehradun) - Epic 2400km across India
3. Any route through **Himalayas** (if you add hiking segments)

---

## What I'll Do Next

### Phase 1: Auto-Generation (I'll handle this)
```bash
# I'll create a script that:
1. Reads your journeyEvents.json
2. For each train/hike segment:
   - Fetch route from Mapbox/Google
   - Get elevation profile
   - Generate 20-50 waypoints
   - Calculate camera positions
3. Output: journeyRoutes.json
```

### Phase 2: You Refine (Optional)
```bash
# You can then:
- Replace auto-routes with GPX tracks
- Add camera hints for dramatic moments
- Specify custom 3D models
- Add POIs and effects
```

---

## Quick Decisions Needed

**1. Routing API Choice:**
- ☐ **Mapbox Directions API** (free tier: 100k requests/month, better terrain)
- ☐ **Google Maps Directions API** ($5/1000 requests, more accurate roads)
- ☐ **GraphHopper** (open source, self-hosted, free)

**2. For the 2 high-priority scenic routes, do you want:**
- ☐ I'll auto-generate now, you refine later
- ☐ Wait - I'll provide GPX files first (delay by ~1 day)

**3. 3D Models:**
- ☐ Use simple icons (🚂 emoji-style, fast)
- ☐ Download free GLB models from Sketchfab (better looking)
- ☐ I'll provide custom models later

**My recommendation:** Let me auto-generate everything with **Mapbox Directions API** (I already have access), use **simple icons for now**, and you can **upgrade specific routes** as we go.

---

## Data Format Output

I'll generate this file:

**`src/data/journeyRoutes.json`**
```json
{
  "paternal-grandparents-meet": {
    "from": { "lat": 10.7867, "lng": 76.6548, "name": "Palakkad" },
    "to": { "lat": 11.0168, "lng": 76.9558, "name": "Coimbatore" },
    "transportMode": "train",
    "distance": 52.3,
    "duration": 90,
    "waypoints": [...],
    "elevationProfile": [...],
    "generatedBy": "mapbox-directions-api",
    "generatedAt": "2026-02-27"
  },
  "lawrence-ooty": {
    // ... etc
  }
}
```

---

## Ready to Go?

**Default plan:** I'll auto-generate all routes with Mapbox, start implementing Cesium today, and you can refine specific routes as we test.

Sound good? 🚀
