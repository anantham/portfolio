#!/usr/bin/env node

/**
 * Generate ground routes for journey segments
 * Uses Mapbox Directions API to create waypoints for train/hike segments
 * Output: src/data/journeyRoutes.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const EVENTS_FILE = path.join(__dirname, '../src/data/journeyEvents.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/journeyRoutes.json');

// Transport modes that need ground routes
const GROUND_TRANSPORT = ['train', 'hike', 'car'];

/**
 * Fetch route from Mapbox Directions API
 * @param {number} fromLng
 * @param {number} fromLat
 * @param {number} toLng
 * @param {number} toLat
 * @param {string} profile - 'driving-traffic', 'walking', 'cycling'
 */
async function fetchMapboxRoute(fromLng, fromLat, toLng, toLat, profile = 'driving') {
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'your_mapbox_token_here') {
    console.warn('⚠️  No Mapbox token found. Using simple interpolation.');
    return generateSimpleRoute(fromLng, fromLat, toLng, toLat);
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&steps=true&access_token=${MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates;

    // Sample waypoints (too many points = heavy)
    const sampledWaypoints = sampleWaypoints(coordinates, 30);

    return {
      waypoints: sampledWaypoints.map(([lng, lat]) => ({ lat, lng })),
      distance: route.distance / 1000, // meters to km
      duration: route.duration / 60, // seconds to minutes
      generatedBy: 'mapbox-directions-api',
    };
  } catch (error) {
    console.warn(`⚠️  Mapbox API failed: ${error.message}. Using simple interpolation.`);
    return generateSimpleRoute(fromLng, fromLat, toLng, toLat);
  }
}

/**
 * Sample waypoints to reduce density
 */
function sampleWaypoints(coordinates, maxPoints) {
  if (coordinates.length <= maxPoints) {
    return coordinates;
  }

  const step = coordinates.length / maxPoints;
  const sampled = [];

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.floor(i * step);
    sampled.push(coordinates[index]);
  }

  // Always include the last point
  if (sampled[sampled.length - 1] !== coordinates[coordinates.length - 1]) {
    sampled.push(coordinates[coordinates.length - 1]);
  }

  return sampled;
}

/**
 * Generate simple interpolated route (fallback when no API token)
 */
function generateSimpleRoute(fromLng, fromLat, toLng, toLat) {
  const waypoints = [];
  const steps = 20;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = fromLat + (toLat - fromLat) * t;
    const lng = fromLng + (toLng - fromLng) * t;
    waypoints.push({ lat, lng });
  }

  // Calculate approximate distance using Haversine formula
  const distance = haversineDistance(fromLat, fromLng, toLat, toLng);

  return {
    waypoints,
    distance,
    duration: distance * 2, // Assume ~30 km/h average
    generatedBy: 'simple-interpolation',
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get Mapbox profile based on transport mode
 */
function getMapboxProfile(transport) {
  switch (transport) {
    case 'hike':
      return 'walking';
    case 'train':
    case 'car':
      return 'driving';
    default:
      return 'driving';
  }
}

/**
 * Main function
 */
async function generateRoutes() {
  console.log('🗺️  Generating journey routes...\n');

  // Read journey events
  const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));

  const routes = {};
  let prevEvent = null;

  for (const event of events) {
    if (!prevEvent) {
      prevEvent = event;
      continue;
    }

    // Check if this event has ground transport
    if (GROUND_TRANSPORT.includes(event.transportFromPrevious)) {
      console.log(`📍 ${prevEvent.locationName} → ${event.locationName} (${event.transportFromPrevious})`);

      const profile = getMapboxProfile(event.transportFromPrevious);
      const routeData = await fetchMapboxRoute(
        prevEvent.lng,
        prevEvent.lat,
        event.lng,
        event.lat,
        profile
      );

      routes[event.id] = {
        id: event.id,
        from: {
          lat: prevEvent.lat,
          lng: prevEvent.lng,
          name: prevEvent.locationName,
        },
        to: {
          lat: event.lat,
          lng: event.lng,
          name: event.locationName,
        },
        transportMode: event.transportFromPrevious,
        ...routeData,
        generatedAt: new Date().toISOString(),
      };

      console.log(`   ✓ ${routeData.waypoints.length} waypoints, ${routeData.distance.toFixed(1)} km\n`);

      // Rate limiting for Mapbox API
      if (routeData.generatedBy === 'mapbox-directions-api') {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    prevEvent = event;
  }

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(routes, null, 2));

  console.log(`✅ Generated ${Object.keys(routes).length} routes`);
  console.log(`📁 Saved to: ${OUTPUT_FILE}\n`);

  // Summary
  const mapboxCount = Object.values(routes).filter(
    (r) => r.generatedBy === 'mapbox-directions-api'
  ).length;
  const simpleCount = Object.values(routes).filter(
    (r) => r.generatedBy === 'simple-interpolation'
  ).length;

  console.log('Summary:');
  console.log(`  - Mapbox routes: ${mapboxCount}`);
  console.log(`  - Simple interpolation: ${simpleCount}`);

  if (simpleCount > 0 && !MAPBOX_TOKEN) {
    console.log('\n💡 Tip: Set MAPBOX_ACCESS_TOKEN environment variable for accurate routes');
  }
}

// Run
generateRoutes().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
