'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
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
  dashAnimateTime: number
}

const baseJourneyEvents = journeyEvents as JourneyEvent[]
const wheelSensitivity = 0.0006
const autoPlaySpeed = 0.006
const trailWindow = 4

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
  const modeRef = useRef<'autoplay' | 'manual'>('autoplay')
  const hasSeededFromQueryRef = useRef(false)

  const [mode, setMode] = useState<'autoplay' | 'manual'>('autoplay')
  const [progress, setProgress] = useState(0)
  const [worldFeatures, setWorldFeatures] = useState<any[]>([])
  const [viewport, setViewport] = useState({ width: 1200, height: 800 })
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)

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

  const arcsData = useMemo(() => {
    if (!journeyState) return [] as ArcDatum[]

    const completedEnd = journeyState.completedTransitions
    const completedStart = Math.max(0, completedEnd - (trailWindow - 1))

    const completed = transitions
      .filter((_, index) => index >= completedStart && index <= completedEnd)
      .map((transition, index, list) => {
        const age = list.length - 1 - index
        const alpha = clamp(0.55 - age * 0.12, 0.14, 0.55)
        const stroke = clamp(0.64 - age * 0.11, 0.24, 0.64)

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
          dashAnimateTime: 0,
        }
      })

    const activeTransition =
      journeyState.activeTransitionIndex !== null
        ? transitions[journeyState.activeTransitionIndex]
        : null

    const activeArc: ArcDatum[] =
      journeyState.traveling && activeTransition
        ? [
            {
              id: `beam-${activeTransition.id}`,
              startLat: activeTransition.fromEvent.lat,
              startLng: activeTransition.fromEvent.lng,
              endLat: activeTransition.toEvent.lat,
              endLng: activeTransition.toEvent.lng,
              color: '#f8fafc',
              altitude: activeTransition.altitude + 0.06,
              stroke: 0.84,
              dashLength: 0.22,
              dashGap: 0.78,
              dashAnimateTime: 580,
            },
          ]
        : []

    return [...completed, ...activeArc]
  }, [journeyState, transitions])

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

  const ringsData = useMemo(() => {
    if (!journeyState || journeyState.traveling) return []
    return [journeyState.activeEvent]
  }, [journeyState])

  const hoverEvent = useMemo(() => {
    if (!hoveredEventId) return null
    return timeline.events.find((event) => event.id === hoveredEventId) ?? null
  }, [hoveredEventId, timeline.events])

  const cameraTarget = useMemo(() => {
    if (!journeyState) return null

    const dwellAltitude = journeyState.activeEvent.era === 'lineage' ? 1.22 : 1.08

    if (!journeyState.traveling) {
      return {
        lat: journeyState.activeEvent.lat,
        lng: journeyState.activeEvent.lng,
        altitude: dwellAltitude,
        duration: mode === 'manual' ? 0 : 260,
      }
    }

    const travelProgress = smoothStep(clamp(journeyState.travelProgress, 0, 1))
    const cruiseAltitude = 1.34 + 0.74 * Math.sin(Math.PI * travelProgress)

    let altitude = cruiseAltitude

    if (travelProgress < 0.16) {
      const phase = travelProgress / 0.16
      altitude = lerp(dwellAltitude, 1.34, phase)
    } else if (travelProgress > 0.84) {
      const phase = (travelProgress - 0.84) / 0.16
      altitude = lerp(1.34, dwellAltitude, phase)
    }

    return {
      lat: journeyState.lat,
      lng: journeyState.lng,
      altitude: clamp(altitude, 1.05, 2.12),
      duration: mode === 'manual' ? 0 : 120,
    }
  }, [journeyState, mode])

  const jumpToEvent = useCallback(
    (eventId: string) => {
      const target = getEventProgress(timeline, eventId)
      if (target === null) return

      setMode('manual')
      setProgress(target)
    },
    [timeline],
  )

  const scrubByDelta = useCallback(
    (delta: number) => {
      if (Math.abs(delta) < 0.2) return

      if (modeRef.current !== 'manual') {
        setMode('manual')
      }

      setProgress((current) => {
        const localGap = getLocalGap(markerProfile.markers, current, markerProfile.medianGap)
        const gapRatio = localGap / Math.max(epsilonGap, markerProfile.medianGap)
        const sensitivityGain = clamp(Math.pow(gapRatio, 0.85), 0.16, 2.8)

        const normalizedDelta = clamp(delta, -180, 180)
        const rawStep = normalizedDelta * wheelSensitivity * sensitivityGain
        const dynamicCap = clamp(0.004 + sensitivityGain * 0.012, 0.0025, 0.035)
        const boundedStep = clamp(rawStep, -dynamicCap, dynamicCap)

        return clamp(current + boundedStep, 0, 1)
      })
    },
    [markerProfile],
  )

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

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

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      scrubByDelta(event.deltaY)
    }

    const onTouchStart = (event: TouchEvent) => {
      touchYRef.current = event.touches[0]?.clientY ?? null
    }

    const onTouchMove = (event: TouchEvent) => {
      if (touchYRef.current === null) return
      const currentY = event.touches[0]?.clientY ?? touchYRef.current
      const delta = touchYRef.current - currentY
      touchYRef.current = currentY

      event.preventDefault()
      scrubByDelta(delta * 1.3)
    }

    node.addEventListener('wheel', onWheel, { passive: false })
    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      node.removeEventListener('wheel', onWheel)
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onTouchMove)
    }
  }, [scrubByDelta])

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
        return next > 1 ? 0 : next
      })

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frame)
  }, [mode])

  useEffect(() => {
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
    if (hasSeededFromQueryRef.current) return

    const eventFromQuery = searchParams.get('event')
    if (!eventFromQuery) {
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
  }, [searchParams, timeline])

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
          globeMaterial={{
            color: '#030712',
            emissive: '#020617',
            emissiveIntensity: 0.16,
            shininess: 0.3,
          }}
          showAtmosphere={false}
          showGraticules={false}
          enablePointerInteraction={!isMobile}
          hexPolygonsData={worldFeatures}
          hexPolygonResolution={3}
          hexPolygonUseDots
          hexPolygonMargin={0.5}
          hexPolygonColor={() => 'rgba(148, 163, 184, 0.44)'}
          arcsData={arcsData}
          arcColor="color"
          arcAltitude="altitude"
          arcStroke="stroke"
          arcDashLength="dashLength"
          arcDashGap="dashGap"
          arcDashAnimateTime="dashAnimateTime"
          arcTransitionDuration={260}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor="pointColor"
          pointAltitude="pointAltitude"
          pointRadius="pointRadius"
          pointResolution={12}
          onPointHover={(point: object | null) => {
            if (isMobile) return
            if (!point) {
              setHoveredEventId(null)
              return
            }

            const data = point as JourneyEvent
            setHoveredEventId(data.id)
          }}
          onPointClick={(point: object) => {
            const data = point as JourneyEvent
            setMode('manual')
            jumpToEvent(data.id)
          }}
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => (value: number) => `rgba(125, 211, 252, ${Math.max(0, 1 - value)})`}
          ringMaxRadius={3.4}
          ringPropagationSpeed={1.3}
          ringRepeatPeriod={1200}
          onGlobeReady={() => {
            if (!globeRef.current) return
            const controls = globeRef.current.controls()
            controls.autoRotate = false
            controls.enablePan = false
            controls.enableZoom = false

            if (cameraTarget) {
              globeRef.current.pointOfView(
                {
                  lat: cameraTarget.lat,
                  lng: cameraTarget.lng,
                  altitude: cameraTarget.altitude,
                },
                0,
              )
            }
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(148,163,184,0.16),transparent_42%)]" />

      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 md:left-8 md:top-8">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-xs tracking-[0.12em] text-slate-200 backdrop-blur"
        >
          <ArrowLeft size={14} />
          Home
        </Link>

        <button
          type="button"
          onClick={() => {
            if (mode === 'autoplay') {
              setMode('manual')
            } else {
              setMode('autoplay')
            }
          }}
          className="pointer-events-auto rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 backdrop-blur"
        >
          {mode === 'autoplay' ? 'Autoplay' : 'Manual'}
        </button>

        <span className="rounded-full border border-white/10 bg-black/55 px-3 py-2 text-xs text-slate-300">
          {activeEvent ? getEventYear(activeEvent) : ''}
        </span>
      </div>

      {hoverEvent ? (
        <div className="absolute right-4 top-20 z-20 w-[min(88vw,300px)] rounded-2xl border border-white/10 bg-black/68 p-4 backdrop-blur md:right-8 md:top-8">
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{formatEventDate(hoverEvent)}</p>
          <h2 className="mt-2 text-base font-medium text-white">{hoverEvent.title}</h2>
          <p className="text-xs text-slate-300">
            {hoverEvent.locationName}, {hoverEvent.country}
          </p>
          <p className="mt-2 text-sm text-slate-200">{hoverEvent.summary}</p>
          {hoverEvent.media?.image ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <Image
                src={hoverEvent.media.image}
                alt={hoverEvent.media.alt || hoverEvent.title}
                width={600}
                height={340}
                className="h-28 w-full object-cover"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="absolute bottom-6 left-1/2 z-20 w-[min(96vw,980px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/66 px-4 py-4 backdrop-blur md:bottom-8 md:px-6">
        <div className="relative h-1.5 rounded-full bg-slate-800/80">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-300 via-indigo-300 to-emerald-300"
            style={{ width: `${progress * 100}%` }}
          />

          {timeline.events.map((event) => {
            const marker = getEventProgress(timeline, event.id) ?? 0
            const active = event.id === activeEvent?.id

            return (
              <button
                key={event.id}
                type="button"
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${marker * 100}%` }}
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

        <div className="mt-3 flex items-center gap-4 overflow-x-auto pb-1 text-[11px] uppercase tracking-[0.12em] text-slate-300">
          {timeline.events.map((event) => {
            const year = getEventYear(event)

            return (
              <button
                key={`year-${event.id}`}
                type="button"
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                onClick={() => jumpToEvent(event.id)}
                className={`whitespace-nowrap transition ${
                  event.id === activeEvent?.id ? 'text-sky-200' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {year}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
