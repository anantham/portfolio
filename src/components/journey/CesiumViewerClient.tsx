'use client';

import { useEffect, useRef, useState } from 'react';
import { Viewer, Entity, PolylineGraphics, PointGraphics, CameraFlyTo } from 'resium';
import {
  Cartesian3,
  Color,
  Ion,
  Viewer as CesiumViewer,
  Math as CesiumMath,
  PolylineDashMaterialProperty,
  SampledPositionProperty,
  JulianDate,
  Transforms,
  HeadingPitchRoll,
} from 'cesium';

// Set Cesium Ion token if available
if (typeof window !== 'undefined') {
  const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
  if (cesiumToken && cesiumToken !== 'your_cesium_ion_token_here') {
    Ion.defaultAccessToken = cesiumToken;
  }
}

export interface CesiumJourneyProps {
  events: any[];
  routes: Record<string, any>;
  currentEventIndex: number;
  traveling: boolean;
  travelProgress: number;
}

export default function CesiumViewerClient({
  events = [],
  routes = {},
  currentEventIndex = 0,
  traveling = false,
  travelProgress = 0,
}: CesiumJourneyProps) {
  const viewerRef = useRef<CesiumViewer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (viewerRef.current) {
      setReady(true);

      // Configure viewer
      const viewer = viewerRef.current;

      // Disable default UI elements we don't need
      viewer.animation.container.style.display = 'none';
      viewer.timeline.container.style.display = 'none';
      viewer.fullscreenButton.container.style.display = 'none';
      viewer.vrButton.container.style.display = 'none';
      viewer.geocoder.container.style.display = 'none';
      viewer.homeButton.container.style.display = 'none';
      viewer.sceneModePicker.container.style.display = 'none';
      viewer.baseLayerPicker.container.style.display = 'none';
      viewer.navigationHelpButton.container.style.display = 'none';

      // Enable lighting and atmosphere
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.atmosphereLightIntensity = 3.0;
      viewer.scene.globe.atmosphereBrightnessShift = 0.4;

      // Enable terrain if Cesium Ion token is available
      const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
      if (cesiumToken && cesiumToken !== 'your_cesium_ion_token_here') {
        viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
          url: Cesium.IonResource.fromAssetId(1),
          requestWaterMask: true,
          requestVertexNormals: true,
        });
      }
    }
  }, [viewerRef.current]);

  // Get current event
  const currentEvent = events[currentEventIndex];
  const prevEvent = currentEventIndex > 0 ? events[currentEventIndex - 1] : null;

  // Camera position
  const cameraDestination = currentEvent
    ? Cartesian3.fromDegrees(currentEvent.lng, currentEvent.lat, 5000000) // 5000km altitude
    : Cartesian3.fromDegrees(0, 0, 20000000);

  // Generate flight arcs for completed journeys
  const flightArcs = events
    .slice(0, currentEventIndex)
    .map((event, idx) => {
      if (idx === 0 || event.transportFromPrevious !== 'flight') return null;

      const prevEvt = events[idx - 1];
      const start = Cartesian3.fromDegrees(prevEvt.lng, prevEvt.lat, 0);
      const end = Cartesian3.fromDegrees(event.lng, event.lat, 0);

      return {
        id: `arc-${event.id}`,
        positions: [start, end],
        color: Color.fromCssColorString('#7dd3fc').withAlpha(0.6),
      };
    })
    .filter(Boolean);

  // Ground route entities
  const groundRoutes = [];
  if (traveling && prevEvent && currentEvent && routes[currentEvent.id]) {
    const route = routes[currentEvent.id];
    const waypoints = route.waypoints || [];

    if (waypoints.length > 0) {
      // Convert waypoints to Cartesian3 positions
      const positions = waypoints.map((wp: { lat: number; lng: number }) =>
        Cartesian3.fromDegrees(wp.lng, wp.lat, 0)
      );

      // Interpolate position based on travel progress
      const currentWaypointIndex = Math.floor(travelProgress * (positions.length - 1));
      const nextWaypointIndex = Math.min(currentWaypointIndex + 1, positions.length - 1);
      const localProgress =
        (travelProgress * (positions.length - 1)) % 1;

      const currentPos = positions[currentWaypointIndex];
      const nextPos = positions[nextWaypointIndex];

      // Interpolated position
      const entityPosition = Cartesian3.lerp(
        currentPos,
        nextPos,
        localProgress,
        new Cartesian3()
      );

      groundRoutes.push({
        id: `route-${currentEvent.id}`,
        positions,
        entityPosition,
        color:
          currentEvent.transportFromPrevious === 'train'
            ? Color.ORANGE
            : currentEvent.transportFromPrevious === 'hike'
            ? Color.GREEN
            : Color.SKYBLUE,
      });
    }
  }

  return (
    <div className="w-full h-full">
      <Viewer
        ref={viewerRef}
        full
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        fullscreenButton={false}
        vrButton={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        sceneModePicker={false}
        selectionIndicator={false}
        navigationHelpButton={false}
        navigationInstructionsInitiallyVisible={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Camera flyTo on event change */}
        {ready && (
          <CameraFlyTo
            destination={cameraDestination}
            duration={2}
            orientation={{
              heading: 0,
              pitch: CesiumMath.toRadians(-90),
              roll: 0,
            }}
          />
        )}

        {/* Flight arcs */}
        {flightArcs.map((arc) => (
          <Entity key={arc.id} id={arc.id}>
            <PolylineGraphics
              positions={arc.positions}
              width={2}
              material={arc.color}
              arcType={Cesium.ArcType.GEODESIC}
            />
          </Entity>
        ))}

        {/* Ground routes */}
        {groundRoutes.map((route) => (
          <>
            {/* Path line */}
            <Entity key={route.id} id={route.id}>
              <PolylineGraphics
                positions={route.positions}
                width={4}
                material={route.color.withAlpha(0.8)}
                clampToGround
              />
            </Entity>

            {/* Moving entity */}
            <Entity
              key={`${route.id}-entity`}
              id={`${route.id}-entity`}
              position={route.entityPosition}
            >
              <PointGraphics
                pixelSize={12}
                color={route.color}
                outlineColor={Color.WHITE}
                outlineWidth={2}
              />
            </Entity>
          </>
        ))}

        {/* Event markers */}
        {events.map((event, idx) => (
          <Entity
            key={event.id}
            id={event.id}
            position={Cartesian3.fromDegrees(event.lng, event.lat, 0)}
          >
            <PointGraphics
              pixelSize={idx === currentEventIndex ? 10 : 6}
              color={
                idx === currentEventIndex
                  ? Color.YELLOW
                  : idx < currentEventIndex
                  ? Color.LIGHTBLUE
                  : Color.GRAY
              }
              outlineColor={Color.WHITE}
              outlineWidth={idx === currentEventIndex ? 2 : 1}
            />
          </Entity>
        ))}
      </Viewer>
    </div>
  );
}
