'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Viewer, Entity, PolylineGraphics, PointGraphics, CameraFlyTo, Billboard } from 'resium';
import * as Cesium from 'cesium';
import {
  Cartesian3,
  Color,
  Ion,
  Viewer as CesiumViewer,
  Math as CesiumMath,
  HeadingPitchRange,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  JulianDate,
  SampledPositionProperty,
  Cartographic,
  Ellipsoid,
  ArcType,
} from 'cesium';
import { buildJourneyTimeline, getJourneyState, getTransportColor, type JourneyEvent } from '@/lib/journey';

// Load route data
import journeyRoutes from '@/data/journeyRoutes.json';

// Set Cesium Ion token if available
if (typeof window !== 'undefined') {
  const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
  if (cesiumToken && cesiumToken !== 'your_cesium_ion_token_here') {
    Ion.defaultAccessToken = cesiumToken;
  }
}

interface CesiumJourneyExperienceProps {
  events: JourneyEvent[];
}

const WHEEL_SENSITIVITY = 0.0006;
const AUTOPLAY_SPEED = 0.004;
const IDLE_AUTOPLAY_MS = 10_000;

export default function CesiumJourneyExperience({ events }: CesiumJourneyExperienceProps) {
  const viewerRef = useRef<CesiumViewer | null>(null);
  const [progress, setProgress] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef(Date.now());

  // Build timeline
  const timeline = buildJourneyTimeline(events);
  const state = getJourneyState(timeline, progress);

  // Camera state
  const [cameraAltitude, setCameraAltitude] = useState(15000000); // Start at 15M meters
  const [cameraPitch, setCameraPitch] = useState(-90); // Looking down
  const [cameraHeading, setCameraHeading] = useState(0);

  // Initialize viewer
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;

    // Hide default UI
    viewer.animation.container.style.display = 'none';
    viewer.timeline.container.style.display = 'none';
    viewer.fullscreenButton.container.style.display = 'none';
    viewer.vrButton.container.style.display = 'none';
    viewer.geocoder.container.style.display = 'none';
    viewer.homeButton.container.style.display = 'none';
    viewer.sceneModePicker.container.style.display = 'none';
    viewer.baseLayerPicker.container.style.display = 'none';
    viewer.navigationHelpButton.container.style.display = 'none';
    viewer.selectionIndicator.container.style.display = 'none';

    // Configure globe
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.atmosphereLightIntensity = 3.0;
    viewer.scene.globe.atmosphereBrightnessShift = 0.4;
    viewer.scene.globe.baseColor = Color.fromCssColorString('#030712');

    // Enable terrain if token is available
    const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
    if (cesiumToken && cesiumToken !== 'your_cesium_ion_token_here') {
      import('cesium').then((Cesium) => {
        viewer.terrainProvider = Cesium.createWorldTerrain({
          requestWaterMask: true,
          requestVertexNormals: true,
        });
      });
    }

    // Wheel scroll handler
    const handler = new ScreenSpaceEventHandler(viewer.canvas);
    handler.setInputAction((event: any) => {
      const delta = event;
      setProgress((prev) => Math.max(0, Math.min(1, prev + delta * WHEEL_SENSITIVITY)));
      setLastInteraction(Date.now());
      setIsAutoPlaying(false);
    }, ScreenSpaceEventType.WHEEL);

    return () => {
      handler.destroy();
    };
  }, []);

  // Auto-play logic
  useEffect(() => {
    const checkIdle = setInterval(() => {
      if (Date.now() - lastInteraction > IDLE_AUTOPLAY_MS && !isAutoPlaying && progress < 0.99) {
        setIsAutoPlaying(true);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [lastInteraction, isAutoPlaying, progress]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const dt = (now - lastUpdateRef.current) / 1000; // seconds
      lastUpdateRef.current = now;

      if (isAutoPlaying) {
        setProgress((prev) => {
          const next = prev + AUTOPLAY_SPEED * dt;
          if (next >= 1) {
            setIsAutoPlaying(false);
            return 1;
          }
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAutoPlaying]);

  // Camera choreography based on journey state
  useEffect(() => {
    if (!state || !viewerRef.current) return;

    const viewer = viewerRef.current;
    const { traveling, travelProgress, fromEvent, toEvent, lat, lng } = state;

    if (traveling && fromEvent.transportFromPrevious !== 'flight') {
      // Ground travel - swoop down to low altitude
      const cruiseAltitude = 500 + Math.sin(Math.PI * travelProgress) * 200; // 500-700m
      const pitch = -60; // Tilted view
      const heading = calculateBearing(fromEvent.lng, fromEvent.lat, toEvent.lng, toEvent.lat);

      setCameraAltitude(cruiseAltitude);
      setCameraPitch(pitch);
      setCameraHeading(heading);

      // Smooth camera follow
      const cameraPos = Cartesian3.fromDegrees(lng, lat, cruiseAltitude);
      viewer.camera.flyTo({
        destination: cameraPos,
        orientation: {
          heading: CesiumMath.toRadians(heading),
          pitch: CesiumMath.toRadians(pitch),
          roll: 0,
        },
        duration: 0.5,
      });
    } else if (traveling && fromEvent.transportFromPrevious === 'flight') {
      // Flight travel - arc camera
      const arcAltitude = 2000000 + Math.sin(Math.PI * travelProgress) * 1000000; // 2-3M meters
      setCameraAltitude(arcAltitude);
      setCameraPitch(-75);

      const cameraPos = Cartesian3.fromDegrees(lng, lat, arcAltitude);
      viewer.camera.flyTo({
        destination: cameraPos,
        orientation: {
          heading: 0,
          pitch: CesiumMath.toRadians(-75),
          roll: 0,
        },
        duration: 0.5,
      });
    } else {
      // Dwelling - globe view
      const dwellAltitude = 5000000; // 5M meters
      setCameraAltitude(dwellAltitude);
      setCameraPitch(-90);

      const cameraPos = Cartesian3.fromDegrees(state.activeEvent.lng, state.activeEvent.lat, dwellAltitude);
      viewer.camera.flyTo({
        destination: cameraPos,
        orientation: {
          heading: 0,
          pitch: CesiumMath.toRadians(-90),
          roll: 0,
        },
        duration: 1.5,
      });
    }
  }, [state?.traveling, state?.travelProgress, state?.lat, state?.lng]);

  if (!state) {
    return <div className="w-full h-full bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Loading journey...</div>
    </div>;
  }

  // Generate completed flight arcs
  const completedArcs = [];
  for (let i = 1; i <= state.completedTransitions + 1; i++) {
    const event = timeline.events[i];
    const prevEvent = timeline.events[i - 1];

    if (event && prevEvent && event.transportFromPrevious === 'flight') {
      const start = Cartesian3.fromDegrees(prevEvent.lng, prevEvent.lat, 0);
      const end = Cartesian3.fromDegrees(event.lng, event.lat, 0);
      const color = Color.fromCssColorString(getTransportColor('flight')).withAlpha(0.4);

      completedArcs.push({
        id: `arc-${event.id}`,
        positions: [start, end],
        color,
      });
    }
  }

  // Active traveling path
  let activePath = null;
  if (state.traveling && state.fromEvent.id !== state.toEvent.id) {
    const route = (journeyRoutes as any)[state.toEvent.id];

    if (route && state.toEvent.transportFromPrevious !== 'flight') {
      // Ground route
      const waypoints = route.waypoints || [];
      const positions = waypoints.map((wp: { lat: number; lng: number }) =>
        Cartesian3.fromDegrees(wp.lng, wp.lat, 0)
      );

      // Calculate entity position along route
      const totalWaypoints = positions.length - 1;
      const currentIndex = Math.floor(state.travelProgress * totalWaypoints);
      const nextIndex = Math.min(currentIndex + 1, totalWaypoints);
      const segmentProgress = (state.travelProgress * totalWaypoints) % 1;

      const entityPosition = Cartesian3.lerp(
        positions[currentIndex],
        positions[nextIndex],
        segmentProgress,
        new Cartesian3()
      );

      const color = Color.fromCssColorString(getTransportColor(state.toEvent.transportFromPrevious));

      activePath = {
        id: `active-route-${state.toEvent.id}`,
        positions,
        entityPosition,
        color,
        transportMode: state.toEvent.transportFromPrevious,
      };
    } else if (state.toEvent.transportFromPrevious === 'flight') {
      // Active flight arc
      const start = Cartesian3.fromDegrees(state.fromEvent.lng, state.fromEvent.lat, 0);
      const end = Cartesian3.fromDegrees(state.toEvent.lng, state.toEvent.lat, 0);

      // Growing arc based on progress
      const arcPosition = Cartesian3.lerp(start, end, state.travelProgress, new Cartesian3());
      const color = Color.fromCssColorString(getTransportColor('flight'));

      activePath = {
        id: `active-arc-${state.toEvent.id}`,
        positions: [start, arcPosition],
        entityPosition: arcPosition,
        color,
        transportMode: 'flight',
      };
    }
  }

  return (
    <div className="relative w-full h-full">
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
      >
        {/* Completed flight arcs */}
        {completedArcs.map((arc) => (
          <Entity key={arc.id}>
            <PolylineGraphics
              positions={arc.positions}
              width={2}
              material={arc.color}
              arcType={ArcType.GEODESIC}
            />
          </Entity>
        ))}

        {/* Active traveling path */}
        {activePath && (
          <>
            {/* Path line */}
            <Entity key={activePath.id}>
              <PolylineGraphics
                positions={activePath.positions}
                width={activePath.transportMode === 'flight' ? 3 : 5}
                material={activePath.color.withAlpha(0.8)}
                arcType={activePath.transportMode === 'flight' ? ArcType.GEODESIC : ArcType.NONE}
                clampToGround={activePath.transportMode !== 'flight'}
              />
            </Entity>

            {/* Moving entity */}
            <Entity key={`${activePath.id}-entity`} position={activePath.entityPosition}>
              <PointGraphics
                pixelSize={activePath.transportMode === 'flight' ? 10 : 14}
                color={activePath.color}
                outlineColor={Color.WHITE}
                outlineWidth={2}
              />
            </Entity>
          </>
        )}

        {/* Event markers */}
        {timeline.events.map((event, idx) => (
          <Entity
            key={event.id}
            position={Cartesian3.fromDegrees(event.lng, event.lat, 0)}
          >
            <PointGraphics
              pixelSize={idx === state.activeEventIndex ? 12 : 7}
              color={
                idx === state.activeEventIndex
                  ? Color.YELLOW
                  : idx < state.activeEventIndex
                  ? Color.LIGHTBLUE.withAlpha(0.7)
                  : Color.GRAY.withAlpha(0.5)
              }
              outlineColor={Color.WHITE}
              outlineWidth={idx === state.activeEventIndex ? 2 : 1}
            />
          </Entity>
        ))}
      </Viewer>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm p-4 rounded-lg max-w-md">
        <h3 className="text-white font-semibold text-lg">{state.activeEvent.title}</h3>
        <p className="text-slate-300 text-sm mt-1">{state.activeEvent.locationName}, {state.activeEvent.country}</p>
        <p className="text-slate-400 text-xs mt-2">{state.activeEvent.summary}</p>
        {state.traveling && (
          <div className="mt-3 text-xs text-amber-400">
            {state.toEvent.transportFromPrevious === 'train' && '🚂 Train'}
            {state.toEvent.transportFromPrevious === 'flight' && '✈️ Flight'}
            {state.toEvent.transportFromPrevious === 'hike' && '🥾 Hiking'}
            {' → '}{state.toEvent.locationName} ({Math.round(state.travelProgress * 100)}%)
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-900/50">
        <div
          className="h-full bg-sky-500 transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Debug info */}
      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm p-2 rounded text-xs text-slate-400 font-mono">
        <div>Progress: {(progress * 100).toFixed(1)}%</div>
        <div>Altitude: {(cameraAltitude / 1000).toFixed(0)} km</div>
        <div>Mode: {state.traveling ? 'Traveling' : 'Dwelling'}</div>
        {isAutoPlaying && <div className="text-amber-400">▶ Auto-playing</div>}
      </div>
    </div>
  );
}

// Helper: Calculate bearing between two coordinates
function calculateBearing(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const Δλ = (lng2 - lng1) * (Math.PI / 180);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * (180 / Math.PI)) + 360) % 360;
}
