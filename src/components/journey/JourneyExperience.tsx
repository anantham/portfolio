'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Pause, Play, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import journeyEvents from '@/data/journeyEvents.json'
import GlobeClient from '@/components/journey/GlobeClient'
import {
  JourneyEvent,
  buildJourneyTimeline,
  formatEventDate,
  getEventProgress,
  getJourneyState,
  getLineageColor,
  getTransportColor,
} from '@/lib/journey'

interface ArcDatum {
  id: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
  altitude: number
  stroke: number
  dashLength: number
  dashGap: number
  dashInitialGap: number
  dashAnimateTime: number
}

const baseJourneyEvents = journeyEvents as JourneyEvent[]
const wheelSensitivity = 0.0006
const autoPlaySpeed = 0.006
const trailWindow = 2
const AUTOPLAY_START_EVENT = 'hong-kong-apr-2023'
const IDLE_AUTOPLAY_MS = 10_000

// Stable module-level constants — defined once, never recreated.
// Passing these as Globe props prevents the globe from re-diffing on every frame.
const GLOBE_MATERIAL = { color: '#030712', emissive: '#020617', emissiveIntensity: 0.16, shininess: 0.3 }
const hexPolygonColorFn = () => 'rgba(148, 163, 184, 0.44)'
const ringColorFn = () => (value: number) => `rgba(125, 211, 252, ${Math.max(0, 1 - value)})`

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const smoothStep = (value: number) => value * value * (3 - 2 * value)
const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress
const epsilonGap = 0.0004

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '')
  const full = normalized.length === 3
    ? normalized.split('').map((value) => `${value}${value}`).join('')
    : normalized

  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const getEventYear = (event: JourneyEvent) => new Date(`${event.startDate}T00:00:00Z`).getUTCFullYear()
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const getEventMonthAbbr = (event: JourneyEvent) => MONTH_ABBR[new Date(`${event.startDate}T00:00:00Z`).getUTCMonth()]

const getMedianGap = (markers: number[]) => {
  if (markers.length < 2) return 0.08

  const gaps: number[] = []
  for (let index = 1; index < markers.length; index += 1) {
    const gap = markers[index] - markers[index - 1]
    if (gap > epsilonGap) gaps.push(gap)
  }

  if (gaps.length === 0) return 0.08
  gaps.sort((a, b) => a - b)
  return gaps[Math.floor(gaps.length / 2)]
}

const getLocalGap = (markers: number[], currentProgress: number, fallbackGap: number) => {
  if (markers.length < 2) return fallbackGap

  const firstGap = Math.max(epsilonGap, markers[1] - markers[0])
  const lastGap = Math.max(epsilonGap, markers[markers.length - 1] - markers[markers.length - 2])

  if (currentProgress <= markers[0]) return firstGap
  if (currentProgress >= markers[markers.length - 1]) return lastGap

  const nextIndex = markers.findIndex((marker) => marker >= currentProgress)
  if (nextIndex <= 0) return firstGap

  const leftGap = Math.max(epsilonGap, markers[nextIndex] - markers[nextIndex - 1])
  const rightGap =
    nextIndex < markers.length - 1
      ? Math.max(epsilonGap, markers[nextIndex + 1] - markers[nextIndex])
      : leftGap

  // Bias towards finer control near clusters by prioritizing the smaller neighboring gap.
  return Math.min(leftGap, rightGap)
}

export default function JourneyExperience() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const touchYRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const modeRef = useRef<'autoplay' | 'manual'>('autoplay')
  const hasSeededFromQueryRef = useRef(false)
  const progressRef = useRef(0)
  const windowRadiusRef = useRef(0.45)
  const activeEventRef = useRef<JourneyEvent | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressRepeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cameraTargetRef = useRef<typeof cameraTarget>(null)

  const [mode, setMode] = useState<'autoplay' | 'manual'>('manual')
  const [progress, setProgress] = useState(0)
  const [worldFeatures, setWorldFeatures] = useState<any[]>([])
  const [viewport, setViewport] = useState({ width: 1200, height: 800 })
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [smoothRadius, setSmoothRadius] = useState(0.45)
  const [isDwellCardDismissed, setIsDwellCardDismissed] = useState(false)

  const isMobile = viewport.width < 900

  const timeline = useMemo(() => buildJourneyTimeline(baseJourneyEvents), [])
  const journeyState = useMemo(() => getJourneyState(timeline, progress), [timeline, progress])
  const activeEvent = journeyState?.activeEvent ?? timeline.events[0]
  const markerProfile = useMemo(() => {
    const rawMarkers = timeline.events
      .map((event) => getEventProgress(timeline, event.id))
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b)

    const markers = rawMarkers.filter(
      (value, index) => index === 0 || Math.abs(value - rawMarkers[index - 1]) > epsilonGap,
    )

    return {
      markers,
      medianGap: getMedianGap(markers),
    }
  }, [timeline])

  // View window for the timeline ribbon: centered on progress, width driven by smoothRadius.
  const viewWindow = useMemo(() => {
    const r = smoothRadius
    const start = clamp(progress - r, 0, Math.max(0, 1 - 2 * r))
    const end = start + 2 * r
    return { start, end }
  }, [progress, smoothRadius])

  // Group adjacent labels that would visually overlap.
  // When all visible events are within ≤2 years, show month-level labels instead of years.
  const { labelGroups, labelYearSpan } = useMemo(() => {
    const ribbonWidth = Math.min(viewport.width * 0.96, 980) - (isMobile ? 32 : 48)
    const span = viewWindow.end - viewWindow.start
    if (span <= 0) return { labelGroups: [], labelYearSpan: 99 }

    const candidates = timeline.events
      .map((event) => {
        const marker = getEventProgress(timeline, event.id) ?? 0
        const isActive = event.id === activeEvent?.id
        const inWindow = isActive || (marker >= viewWindow.start - 0.002 && marker <= viewWindow.end + 0.002)
        if (!inWindow) return null
        const displayLeft = clamp((marker - viewWindow.start) / span, 0, 1)
        return { event, displayLeft, year: getEventYear(event), month: getEventMonthAbbr(event), isActive }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.displayLeft - b.displayLeft)

    const yearSpan = candidates.length > 0
      ? Math.max(...candidates.map(c => c.year)) - Math.min(...candidates.map(c => c.year))
      : 99

    const MAX_LABELS = 5
    // Adaptive gap: wide enough to naturally produce ≤ MAX_LABELS groups.
    // ribbonWidth / (MAX_LABELS - 1) spaces MAX_LABELS labels evenly across the full ribbon.
    const naturalGap = yearSpan <= 1 ? 36 : 42
    const minCenterGap = Math.max(naturalGap, ribbonWidth / (MAX_LABELS - 1))

    type LabelGroup = { events: typeof candidates; centerLeft: number }
    const groups: LabelGroup[] = []

    for (const item of candidates) {
      const last = groups[groups.length - 1]
      const lastContainsActive = last?.events.some((e) => e.isActive)
      const itemPx = item.displayLeft * ribbonWidth
      const lastCenterPx = (last?.centerLeft ?? -Infinity) * ribbonWidth

      if (!last || item.isActive || lastContainsActive || itemPx - lastCenterPx >= minCenterGap) {
        groups.push({ events: [item], centerLeft: item.displayLeft })
      } else {
        last.events.push(item)
        const positions = last.events.map((e) => e.displayLeft)
        last.centerLeft = (Math.min(...positions) + Math.max(...positions)) / 2
      }
    }

    // Hard cap: keep active group + evenly sampled non-active groups up to MAX_LABELS.
    let finalGroups = groups
    if (groups.length > MAX_LABELS) {
      const activeGroup = groups.find(g => g.events.some(e => e.isActive))
      const nonActive = groups.filter(g => !g.events.some(e => e.isActive))
      const slots = MAX_LABELS - (activeGroup ? 1 : 0)
      const sampled = slots <= 0 ? [] : Array.from(
        { length: Math.min(slots, nonActive.length) },
        (_, i) => nonActive[Math.round(i * (nonActive.length - 1) / Math.max(1, Math.min(slots, nonActive.length) - 1))]
      )
      finalGroups = (activeGroup ? [...sampled, activeGroup] : sampled)
        .sort((a, b) => a.centerLeft - b.centerLeft)
    }

    return { labelGroups: finalGroups, labelYearSpan: yearSpan }
  }, [timeline, activeEvent?.id, viewWindow, viewport.width, isMobile])

  const transitions = useMemo(() => {
    return timeline.events.slice(1).map((toEvent, index) => {
      const fromEvent = timeline.events[index]
      const travelMode = toEvent.transportFromPrevious
      const isLineageTransition = fromEvent.era === 'lineage' || toEvent.era === 'lineage'

      return {
        id: `${fromEvent.id}-${toEvent.id}`,
        fromEvent,
        toEvent,
        color: isLineageTransition ? getLineageColor(toEvent) : getTransportColor(travelMode),
        altitude: isLineageTransition
          ? 0.14
          : travelMode === 'flight'
            ? 0.32
            : travelMode === 'train'
              ? 0.1
              : travelMode === 'hike'
                ? 0.07
                : 0.04,
      }
    })
  }, [timeline.events])

  // Primitive deps — completed trail only recomputes on segment boundary, not every frame.
  const jHasState = journeyState !== null
  const jTraveling = journeyState?.traveling ?? false
  const jCompletedTransitions = journeyState?.completedTransitions ?? -1
  const jActiveTransitionIndex = journeyState?.activeTransitionIndex ?? null
  const jTravelProgress = journeyState?.travelProgress ?? 0

  // Stable: only changes when a new segment completes. No per-frame recomputation.
  const completedArcsData = useMemo(() => {
    if (!jHasState) return [] as ArcDatum[]
    const completedEnd = jCompletedTransitions
    const completedStart = Math.max(0, completedEnd - (trailWindow - 1))
    return transitions
      .filter((_, index) => index >= completedStart && index <= completedEnd)
      .map((transition, index, list) => {
        const age = list.length - 1 - index
        // age=0 → most recent trail (bright), age=1 → ghost
        const alpha = age === 0 ? 0.58 : 0.16
        const stroke = age === 0 ? 0.68 : 0.26
        return {
          id: `trail-${transition.id}`,
          startLat: transition.fromEvent.lat,
          startLng: transition.fromEvent.lng,
          endLat: transition.toEvent.lat,
          endLng: transition.toEvent.lng,
          color: hexToRgba(transition.color, alpha),
          altitude: transition.altitude,
          stroke,
          dashLength: 1,
          dashGap: 0,
          dashInitialGap: 0,
          dashAnimateTime: 0,
        }
      })
  }, [jHasState, jCompletedTransitions, transitions])

  // Per-frame during travel: trace arc grows from source → destination as travelProgress → 1.
  // No looping dash — dashAnimateTime is 0 throughout.
  const activeArcData = useMemo(() => {
    if (!jTraveling || jActiveTransitionIndex === null) return [] as ArcDatum[]
    const activeTransition = transitions[jActiveTransitionIndex]
    if (!activeTransition) return [] as ArcDatum[]
    const tp = clamp(jTravelProgress, 0, 1)
    return [
      // Trace body: grows from 0 → full arc length
      {
        id: `trace-${activeTransition.id}`,
        startLat: activeTransition.fromEvent.lat,
        startLng: activeTransition.fromEvent.lng,
        endLat: activeTransition.toEvent.lat,
        endLng: activeTransition.toEvent.lng,
        color: hexToRgba(activeTransition.color, 0.88),
        altitude: activeTransition.altitude,
        stroke: 0.9,
        dashLength: Math.max(0.003, tp),
        dashGap: Math.max(0, 1 - tp),
        dashInitialGap: 0,
        dashAnimateTime: 0,
      },
      // Leading head: bright dot riding the tip of the trace
      {
        id: `head-${activeTransition.id}`,
        startLat: activeTransition.fromEvent.lat,
        startLng: activeTransition.fromEvent.lng,
        endLat: activeTransition.toEvent.lat,
        endLng: activeTransition.toEvent.lng,
        color: '#f8fafc',
        altitude: activeTransition.altitude + 0.012,
        stroke: 1.4,
        dashLength: 0.025,
        dashGap: 0.975,
        dashInitialGap: Math.max(0, tp - 0.013),
        dashAnimateTime: 0,
      },
    ]
  }, [jTraveling, jActiveTransitionIndex, jTravelProgress, transitions])

  const arcsData = useMemo(
    () => activeArcData.length === 0 ? completedArcsData : [...completedArcsData, ...activeArcData],
    [completedArcsData, activeArcData],
  )

  const pointsData = useMemo(() => {
    return timeline.events.map((event) => {
      const isActive = event.id === journeyState?.activeEvent.id

      return {
        ...event,
        pointColor: getLineageColor(event),
        pointAltitude: isActive ? 0.082 : 0.018,
        pointRadius: isActive ? 0.35 : 0.15,
      }
    })
  }, [timeline.events, journeyState?.activeEvent.id])

  // Use primitive deps — jTraveling and activeEvent.id are stable between frames;
  // journeyState itself is recreated every frame so must not be a direct dep here.
  const ringsData = useMemo(() => {
    if (jTraveling || !activeEvent) return []
    return [activeEvent]
  }, [jTraveling, activeEvent])

  const hoverEvent = useMemo(() => {
    if (!hoveredEventId) return null
    return timeline.events.find((event) => event.id === hoveredEventId) ?? null
  }, [hoveredEventId, timeline.events])

  const loopStartProgress = useMemo(
    () => getEventProgress(timeline, AUTOPLAY_START_EVENT) ?? 0,
    [timeline],
  )

  const cameraTarget = useMemo(() => {
    if (!journeyState) return null

    // Compute geographic spread of the ±4 surrounding events to determine dwell zoom.
    // Tight cluster (same city/state) → zoom in; intercontinental spread → keep wide.
    const idx = journeyState.activeEventIndex
    const windowEvents = timeline.events.slice(Math.max(0, idx - 4), Math.min(timeline.events.length, idx + 5))
    const lats = windowEvents.map((e) => e.lat)
    const lngs = windowEvents.map((e) => e.lng)
    const latSpread = windowEvents.length > 1 ? Math.max(...lats) - Math.min(...lats) : 180
    const rawLngSpread = windowEvents.length > 1 ? Math.max(...lngs) - Math.min(...lngs) : 360
    const lngSpread = Math.min(rawLngSpread, 360 - rawLngSpread)
    const geoSpread = Math.max(latSpread, lngSpread)
    const dwellAltitude =
      geoSpread < 1 ? 0.35 :
      geoSpread < 4 ? 0.52 :
      geoSpread < 20 ? 0.80 :
      journeyState.activeEvent.era === 'lineage' ? 1.22 : 1.08

    if (!journeyState.traveling) {
      return {
        lat: journeyState.activeEvent.lat,
        lng: journeyState.activeEvent.lng,
        altitude: dwellAltitude,
        duration: 300,
      }
    }

    // Scale peak cruise altitude by geographic distance — short hops don't zoom far out.
    const latDiff = Math.abs(journeyState.toEvent.lat - journeyState.fromEvent.lat)
    const lngRaw = Math.abs(journeyState.toEvent.lng - journeyState.fromEvent.lng)
    const lngDiff = Math.min(lngRaw, 360 - lngRaw)
    const geoDist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
    const peakBoost = geoDist < 2 ? 0.10 : geoDist < 8 ? 0.40 : geoDist < 20 ? 0.65 : 0.74

    const travelProgress = smoothStep(clamp(journeyState.travelProgress, 0, 1))
    const cruiseAltitude = dwellAltitude + peakBoost * Math.sin(Math.PI * travelProgress)
    const cruiseBase = dwellAltitude + peakBoost * 0.25

    let altitude = cruiseAltitude

    if (travelProgress < 0.16) {
      const phase = travelProgress / 0.16
      altitude = lerp(dwellAltitude, cruiseBase, phase)
    } else if (travelProgress > 0.84) {
      const phase = (travelProgress - 0.84) / 0.16
      altitude = lerp(cruiseBase, dwellAltitude, phase)
    }

    return {
      lat: journeyState.lat,
      lng: journeyState.lng,
      altitude: clamp(altitude, 0.30, 2.15),
      // Always smooth so the zoom arc plays out even during manual scrubbing.
      duration: 200,
    }
  }, [journeyState, timeline.events])

  const jumpToEvent = useCallback(
    (eventId: string) => {
      const target = getEventProgress(timeline, eventId)
      if (target === null) return

      setMode('manual')
      setProgress(target)
    },
    [timeline],
  )

  const onPointHover = useCallback(
    (point: object | null) => {
      if (isMobile) return
      setHoveredEventId(point ? (point as JourneyEvent).id : null)
    },
    [isMobile],
  )

  const onPointClick = useCallback(
    (point: object) => {
      setMode('manual')
      jumpToEvent((point as JourneyEvent).id)
    },
    [jumpToEvent],
  )

  const onGlobeReady = useCallback(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = false
    controls.enablePan = false
    controls.enableZoom = false
    controls.enableRotate = modeRef.current === 'manual' && !isMobile
    const target = cameraTargetRef.current
    if (target) {
      globeRef.current.pointOfView({ lat: target.lat, lng: target.lng, altitude: target.altitude }, 0)
    }
  }, [isMobile])

  const scrubByDelta = useCallback(
    (delta: number) => {
      if (Math.abs(delta) < 0.2) return

      if (modeRef.current !== 'manual') {
        setMode('manual')
      }

      setProgress((current) => {
        const localGap = getLocalGap(markerProfile.markers, current, markerProfile.medianGap)
        const gapRatio = localGap / Math.max(epsilonGap, markerProfile.medianGap)
        const sensitivityGain = clamp(Math.pow(gapRatio, 0.5), 0.05, 2.8)

        // During travel, require much more scroll so the beam moves slowly.
        const state = getJourneyState(timeline, current)
        const travelMul = state?.traveling ? 0.12 : 1.0

        const normalizedDelta = clamp(delta, -180, 180)
        const rawStep = normalizedDelta * wheelSensitivity * sensitivityGain * travelMul
        const dynamicCap = clamp(0.002 + sensitivityGain * 0.01, 0.001, 0.03) * travelMul
        const boundedStep = clamp(rawStep, -dynamicCap, dynamicCap)

        return clamp(current + boundedStep, 0, 1)
      })
    },
    [markerProfile, timeline],
  )

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  // Idle-to-autoplay: if nothing happens for IDLE_AUTOPLAY_MS, start playing.
  // Any activity (mousemove, scroll, keydown, touch) resets the countdown.
  // Switching to manual (via scrub/click) is handled by existing handlers;
  // this effect only ever starts autoplay — it never stops it.
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null

    const arm = () => {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => setMode('autoplay'), IDLE_AUTOPLAY_MS)
    }

    window.addEventListener('mousemove', arm, { passive: true })
    window.addEventListener('touchstart', arm, { passive: true })
    window.addEventListener('wheel', arm, { passive: true })
    window.addEventListener('keydown', arm)

    arm() // start the initial countdown immediately

    return () => {
      if (idleTimer) clearTimeout(idleTimer)
      window.removeEventListener('mousemove', arm)
      window.removeEventListener('touchstart', arm)
      window.removeEventListener('wheel', arm)
      window.removeEventListener('keydown', arm)
    }
  }, [])

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    activeEventRef.current = activeEvent ?? null
  }, [activeEvent])

  useEffect(() => {
    setIsDwellCardDismissed(false)
  }, [activeEvent?.id])

  const navigateRelative = useCallback(
    (offset: 1 | -1) => {
      const current = activeEventRef.current
      if (!current) return
      const idx = timeline.events.findIndex((e) => e.id === current.id)
      const target = timeline.events[idx + offset]
      if (target) jumpToEvent(target.id)
    },
    [timeline.events, jumpToEvent],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return
      if (event.key === 'ArrowRight') navigateRelative(1)
      else if (event.key === 'ArrowLeft') navigateRelative(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateRelative])

  // Smoothly animate the timeline view-window radius toward the target density.
  // Runs at 60 fps; only calls setSmoothRadius when the value meaningfully changes.
  useEffect(() => {
    let rafId: number
    const tick = () => {
      const localGap = getLocalGap(markerProfile.markers, progressRef.current, markerProfile.medianGap)
      const target = clamp(localGap * 8, 0.06, 0.45)
      const next = windowRadiusRef.current + (target - windowRadiusRef.current) * 0.08
      if (Math.abs(next - windowRadiusRef.current) > 0.0001) {
        windowRadiusRef.current = next
        setSmoothRadius(next)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [markerProfile])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const resize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    resize()
    window.addEventListener('resize', resize)

    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const cancelLongPress = () => {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      if (longPressRepeatRef.current !== null) {
        clearInterval(longPressRepeatRef.current)
        longPressRepeatRef.current = null
      }
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      scrubByDelta(event.deltaY)
    }

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      touchYRef.current = touch?.clientY ?? null
      touchStartYRef.current = touch?.clientY ?? null

      // Long-press zone detection: left 28% = prev, right 28% = next.
      // Only applies on mobile; center zone is reserved for vertical scrub.
      if (!isMobile) return
      const x = touch?.clientX ?? 0
      const sw = window.innerWidth
      const direction: 1 | -1 | null = x < sw * 0.28 ? -1 : x > sw * 0.72 ? 1 : null
      if (direction === null) return

      longPressTimerRef.current = setTimeout(() => {
        navigateRelative(direction)
        longPressRepeatRef.current = setInterval(() => navigateRelative(direction), 550)
      }, 380)
    }

    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY
      // Cancel long press if the finger moves vertically before the timer fires.
      if (touchStartYRef.current !== null && currentY !== undefined &&
          Math.abs(currentY - touchStartYRef.current) > 10) {
        cancelLongPress()
      }
      if (touchYRef.current === null) return
      const y = currentY ?? touchYRef.current
      const delta = touchYRef.current - y
      touchYRef.current = y
      event.preventDefault()
      scrubByDelta(delta * 1.3)
    }

    const onTouchEnd = () => cancelLongPress()

    node.addEventListener('wheel', onWheel, { capture: true, passive: false })
    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchmove', onTouchMove, { passive: false })
    node.addEventListener('touchend', onTouchEnd, { passive: true })
    node.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      node.removeEventListener('wheel', onWheel, { capture: true })
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onTouchMove)
      node.removeEventListener('touchend', onTouchEnd)
      node.removeEventListener('touchcancel', onTouchEnd)
      cancelLongPress()
    }
  }, [scrubByDelta, isMobile, navigateRelative])

  useEffect(() => {
    let cancelled = false

    fetch('/data/world.geojson')
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return
        const features = Array.isArray(payload?.features) ? payload.features : []
        setWorldFeatures(features)
      })
      .catch(() => {
        if (cancelled) return
        setWorldFeatures([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (mode !== 'autoplay') return

    let frame = 0
    let previous = performance.now()

    const tick = (now: number) => {
      const elapsed = (now - previous) / 1000
      previous = now

      setProgress((current) => {
        const next = current + elapsed * autoPlaySpeed
        return next > 1 ? loopStartProgress : next
      })

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frame)
  }, [mode, loopStartProgress])

  useEffect(() => {
    cameraTargetRef.current = cameraTarget
    if (!cameraTarget || !globeRef.current) return

    globeRef.current.pointOfView(
      {
        lat: cameraTarget.lat,
        lng: cameraTarget.lng,
        altitude: cameraTarget.altitude,
      },
      cameraTarget.duration,
    )
  }, [cameraTarget])

  useEffect(() => {
    if (!globeRef.current) return

    const onVisibilityChange = () => {
      if (!globeRef.current) return

      if (document.hidden) {
        globeRef.current.pauseAnimation?.()
      } else {
        globeRef.current.resumeAnimation?.()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    if (!controls) return
    controls.enableRotate = mode === 'manual' && !isMobile
  }, [mode, isMobile])

  useEffect(() => {
    if (hasSeededFromQueryRef.current) return

    const eventFromQuery = searchParams.get('event')
    if (!eventFromQuery) {
      setProgress(loopStartProgress)
      hasSeededFromQueryRef.current = true
      return
    }

    const targetProgress = getEventProgress(timeline, eventFromQuery)
    if (targetProgress === null) {
      hasSeededFromQueryRef.current = true
      return
    }

    setProgress(targetProgress)
    hasSeededFromQueryRef.current = true
  }, [searchParams, timeline, loopStartProgress])

  useEffect(() => {
    if (!activeEvent?.id) return

    const params = new URLSearchParams(searchParams.toString())
    if (params.get('event') === activeEvent.id) return

    params.set('event', activeEvent.id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [activeEvent?.id, pathname, router, searchParams])

  return (
    <section ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-black text-slate-100 touch-none">
      <div className="absolute inset-0">
        <GlobeClient
          ref={globeRef}
          width={viewport.width}
          height={viewport.height}
          backgroundColor="rgba(0,0,0,1)"
          globeMaterial={GLOBE_MATERIAL}
          showAtmosphere={false}
          showGraticules={false}
          enablePointerInteraction={!isMobile}
          hexPolygonsData={worldFeatures}
          hexPolygonResolution={3}
          hexPolygonUseDots
          hexPolygonMargin={0.5}
          hexPolygonColor={hexPolygonColorFn}
          arcsData={arcsData}
          arcColor="color"
          arcAltitude="altitude"
          arcStroke="stroke"
          arcDashLength="dashLength"
          arcDashGap="dashGap"
          arcDashInitialGap="dashInitialGap"
          arcDashAnimateTime="dashAnimateTime"
          arcTransitionDuration={0}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor="pointColor"
          pointAltitude="pointAltitude"
          pointRadius="pointRadius"
          pointResolution={12}
          onPointHover={onPointHover}
          onPointClick={onPointClick}
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringColor={ringColorFn}
          ringMaxRadius={3.4}
          ringPropagationSpeed={1.3}
          ringRepeatPeriod={1200}
          onGlobeReady={onGlobeReady}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(148,163,184,0.16),transparent_42%)]" />

      {isMobile && (
        <>
          <div className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-10 select-none text-4xl font-light text-white/20">‹</div>
          <div className="pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-10 select-none text-4xl font-light text-white/20">›</div>
        </>
      )}

      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 md:left-8 md:top-8">
        <Link
          href="/"
          aria-label="Home"
          className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-white/20 bg-black/60 p-2 text-slate-200 backdrop-blur"
        >
          <ArrowLeft size={16} />
        </Link>

        <button
          type="button"
          aria-label={mode === 'autoplay' ? 'Pause' : 'Play'}
          onClick={() => setMode(mode === 'autoplay' ? 'manual' : 'autoplay')}
          className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-white/20 bg-black/60 p-2 text-slate-200 backdrop-blur"
        >
          {mode === 'autoplay' ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <span className="rounded-full border border-white/10 bg-black/55 px-3 py-2 text-xs text-slate-300">
          {activeEvent ? getEventYear(activeEvent) : ''}
        </span>
      </div>

      {(() => {
        const isDwelling = !journeyState?.traveling
        const displayCard = hoverEvent ?? (isDwelling && !isDwellCardDismissed ? activeEvent : null)
        const isDwellMode = displayCard !== null && displayCard === activeEvent && !hoverEvent
        if (!displayCard) return null
        return (
          <div className="absolute right-4 top-20 z-20 w-[min(88vw,300px)] rounded-2xl border border-white/10 bg-black/68 p-4 backdrop-blur md:right-8 md:top-8">
            {isDwellMode && (
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setIsDwellCardDismissed(true)}
                className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition-colors hover:text-white"
              >
                <X size={13} />
              </button>
            )}
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{formatEventDate(displayCard)}</p>
            <h2 className="mt-2 text-base font-medium text-white">{displayCard.title}</h2>
            <p className="text-xs text-slate-300">
              {displayCard.locationName}, {displayCard.country}
            </p>
            <p className="mt-2 text-sm text-slate-200">{displayCard.summary}</p>
            {displayCard.media?.image ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                <Image
                  src={displayCard.media.image}
                  alt={displayCard.media.alt || displayCard.title}
                  width={600}
                  height={340}
                  className="h-28 w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        )
      })()}

      <div className="absolute bottom-6 left-1/2 z-20 w-[min(96vw,980px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/66 px-4 py-4 backdrop-blur md:bottom-8 md:px-6">
        <div className="relative h-1.5 rounded-full bg-slate-800/80">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-300 via-indigo-300 to-emerald-300"
            style={{
              width: `${clamp((progress - viewWindow.start) / (viewWindow.end - viewWindow.start), 0, 1) * 100}%`,
            }}
          />

          {timeline.events.map((event) => {
            const marker = getEventProgress(timeline, event.id) ?? 0
            const active = event.id === activeEvent?.id
            const span = viewWindow.end - viewWindow.start
            const displayLeft = clamp((marker - viewWindow.start) / span, 0, 1)
            const inWindow =
              active ||
              (marker >= viewWindow.start - 0.002 && marker <= viewWindow.end + 0.002)

            return (
              <button
                key={event.id}
                type="button"
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${displayLeft * 100}%`,
                  opacity: inWindow ? 1 : 0,
                  pointerEvents: inWindow ? 'auto' : 'none',
                  transition: 'opacity 200ms',
                }}
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                onClick={() => jumpToEvent(event.id)}
              >
                <span
                  className={`block h-3 w-3 rounded-full border ${
                    active
                      ? 'border-white bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)]'
                      : 'border-slate-200/70 bg-slate-700'
                  }`}
                />
              </button>
            )
          })}
        </div>

        <div className="relative mt-3 h-4">
          {labelGroups.map((group) => {
            const isCoarse = group.events.length > 1
            const isActive = group.events.some((e) => e.isActive)
            const minYear = Math.min(...group.events.map((e) => e.year))
            const maxYear = Math.max(...group.events.map((e) => e.year))
            const m0 = group.events[0].month
            const mN = group.events[group.events.length - 1].month

            let label: string
            if (labelYearSpan === 0) {
              // All visible events in same year — show month only
              label = isCoarse && m0 !== mN ? `${m0}–${mN}` : m0
            } else if (labelYearSpan <= 2) {
              // Span ≤ 2 years — show month + short year
              if (isCoarse) {
                label = minYear === maxYear
                  ? `${m0}–${mN} '${String(minYear).slice(-2)}`
                  : `${m0} '${String(minYear).slice(-2)}–${mN} '${String(maxYear).slice(-2)}`
              } else {
                label = `${m0} '${String(minYear).slice(-2)}`
              }
            } else {
              label = isCoarse ? `${minYear}–${maxYear}` : String(minYear)
            }

            const firstEvent = group.events[0].event

            return (
              <button
                key={`label-group-${firstEvent.id}`}
                type="button"
                className={`absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] uppercase tracking-[0.12em] transition-[color] duration-200 ${
                  isActive
                    ? 'text-sky-200'
                    : isCoarse
                      ? 'text-slate-600 hover:text-slate-400'
                      : 'text-slate-400 hover:text-slate-200'
                }`}
                style={{ left: `${group.centerLeft * 100}%` }}
                onMouseEnter={() => setHoveredEventId(firstEvent.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                onClick={() => jumpToEvent(firstEvent.id)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
