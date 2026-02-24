export type JourneyEra = 'lineage' | 'education' | 'work' | 'travel'

export type JourneyCategory =
  | 'family'
  | 'school'
  | 'college'
  | 'conference'
  | 'hosting'
  | 'project'
  | 'hike'

export type JourneyTravelMode = 'none' | 'flight' | 'train' | 'hike'

export interface JourneyEvent {
  id: string
  title: string
  startDate: string
  endDate?: string
  locationName: string
  country: string
  lat: number
  lng: number
  era: JourneyEra
  category: JourneyCategory
  transportFromPrevious: JourneyTravelMode
  travelDaysFromPrevious?: number
  lineageDepth?: 2 | 4 | 8
  branch?: 'maternal' | 'paternal' | 'union' | 'self'
  summary: string
  why?: string
  media?: {
    image?: string
    alt?: string
  }
  tags?: string[]
}

export interface JourneySegment {
  from: JourneyEvent
  to: JourneyEvent
  start: number
  end: number
  dwellRatio: number
}

export interface JourneyTimeline {
  events: JourneyEvent[]
  segments: JourneySegment[]
}

export interface JourneyState {
  progress: number
  segmentIndex: number
  activeEventIndex: number
  activeEvent: JourneyEvent
  fromEvent: JourneyEvent
  toEvent: JourneyEvent
  traveling: boolean
  travelProgress: number
  lat: number
  lng: number
  completedTransitions: number
  activeTransitionIndex: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const toUtcMs = (dateLike: string) => new Date(`${dateLike}T00:00:00Z`).getTime()

const normalizeLng = (lng: number) => {
  const normalized = ((lng + 180) % 360 + 360) % 360 - 180
  return normalized === -180 ? 180 : normalized
}

const interpolateLng = (fromLng: number, toLng: number, progress: number) => {
  const delta = ((toLng - fromLng + 540) % 360) - 180
  return normalizeLng(fromLng + delta * progress)
}

const getEventStart = (event: JourneyEvent) => toUtcMs(event.startDate)

const getEventEnd = (event: JourneyEvent) => {
  if (event.endDate) return toUtcMs(event.endDate)
  return getEventStart(event)
}

export const buildJourneyTimeline = (events: JourneyEvent[]): JourneyTimeline => {
  const sorted = [...events].sort((a, b) => getEventStart(a) - getEventStart(b))

  if (sorted.length === 0) {
    return { events: [], segments: [] }
  }

  if (sorted.length === 1) {
    return {
      events: sorted,
      segments: [
        {
          from: sorted[0],
          to: sorted[0],
          start: 0,
          end: 1,
          dwellRatio: 1,
        },
      ],
    }
  }

  const weighted = sorted.slice(0, -1).map((from, index) => {
    const to = sorted[index + 1]

    const gapDays = Math.max(7, (getEventStart(to) - getEventEnd(from)) / DAY_MS)
    const requestedTravel = Math.max(0, to.travelDaysFromPrevious ?? 0)
    const travelDays = clamp(requestedTravel || Math.round(gapDays * 0.2), 1, Math.max(1, gapDays - 1))
    const dwellDays = Math.max(3, gapDays - travelDays)

    // Travel gets a large minimum weight so it always takes many scrolls to traverse.
    // Dwell is capped so it passes quickly even for long historical gaps.
    const travelWeight = Math.max(travelDays * 2, 40)
    const effectiveDwell = Math.min(dwellDays, 18)
    const weight = effectiveDwell + travelWeight

    return {
      from,
      to,
      dwellRatio: effectiveDwell / weight,
      weight,
    }
  })

  // Hold on the final event so the narrative can rest.
  weighted.push({
    from: sorted[sorted.length - 1],
    to: sorted[sorted.length - 1],
    dwellRatio: 1,
    weight: 21,
  })

  const totalWeight = weighted.reduce((acc, segment) => acc + segment.weight, 0)

  let cursor = 0
  const segments: JourneySegment[] = weighted.map((segment) => {
    const start = cursor / totalWeight
    cursor += segment.weight
    const end = cursor / totalWeight

    return {
      from: segment.from,
      to: segment.to,
      start,
      end,
      dwellRatio: segment.dwellRatio,
    }
  })

  return { events: sorted, segments }
}

export const getJourneyState = (timeline: JourneyTimeline, rawProgress: number): JourneyState | null => {
  if (timeline.events.length === 0 || timeline.segments.length === 0) {
    return null
  }

  const progress = clamp(rawProgress, 0, 1)
  const segmentIndex = timeline.segments.findIndex((segment) => progress <= segment.end)
  const resolvedSegmentIndex = segmentIndex === -1 ? timeline.segments.length - 1 : segmentIndex
  const segment = timeline.segments[resolvedSegmentIndex]

  const segmentSpan = Math.max(0.000001, segment.end - segment.start)
  const localProgress = clamp((progress - segment.start) / segmentSpan, 0, 1)
  const traveling = segment.from.id !== segment.to.id && localProgress > segment.dwellRatio
  const travelProgress = traveling
    ? clamp((localProgress - segment.dwellRatio) / Math.max(0.000001, 1 - segment.dwellRatio), 0, 1)
    : 0

  const lat = traveling
    ? segment.from.lat + (segment.to.lat - segment.from.lat) * travelProgress
    : segment.from.lat

  const lng = traveling
    ? interpolateLng(segment.from.lng, segment.to.lng, travelProgress)
    : segment.from.lng

  const activeEvent = traveling ? segment.to : segment.from
  const activeEventIndex = timeline.events.findIndex((event) => event.id === activeEvent.id)

  const completedTransitions = clamp(
    traveling ? resolvedSegmentIndex - 1 : resolvedSegmentIndex - 1,
    -1,
    timeline.events.length - 2,
  )

  const activeTransitionIndex =
    traveling && segment.from.id !== segment.to.id ? resolvedSegmentIndex : null

  return {
    progress,
    segmentIndex: resolvedSegmentIndex,
    activeEventIndex,
    activeEvent,
    fromEvent: segment.from,
    toEvent: segment.to,
    traveling,
    travelProgress,
    lat,
    lng,
    completedTransitions,
    activeTransitionIndex,
  }
}

export const getEventProgress = (timeline: JourneyTimeline, eventId: string): number | null => {
  const eventIndex = timeline.events.findIndex((event) => event.id === eventId)
  if (eventIndex === -1) return null

  // Event i is best represented just after arrival at that event.
  // For non-final events, that means the beginning of segment i (where `from` is event i).
  if (eventIndex === 0) return 0

  if (eventIndex < timeline.events.length - 1) {
    const segment = timeline.segments[eventIndex]
    if (!segment) return null
    return clamp(segment.start + (segment.end - segment.start) * 0.05, 0, 1)
  }

  // For the final event, jump into the explicit final hold segment.
  const finalSegment = timeline.segments[timeline.segments.length - 1]
  if (!finalSegment) return null
  return clamp(finalSegment.start + (finalSegment.end - finalSegment.start) * 0.2, 0, 1)
}

export const getTransportColor = (mode: JourneyTravelMode) => {
  switch (mode) {
    case 'flight':
      return '#7dd3fc'
    case 'train':
      return '#f59e0b'
    case 'hike':
      return '#22c55e'
    default:
      return '#94a3b8'
  }
}

export const getLineageColor = (event: JourneyEvent) => {
  if (event.branch === 'maternal') return '#fb7185'
  if (event.branch === 'paternal') return '#60a5fa'
  if (event.branch === 'union') return '#fbbf24'
  if (event.lineageDepth === 8) return '#c084fc'
  if (event.lineageDepth === 4) return '#a78bfa'
  if (event.lineageDepth === 2) return '#e2e8f0'
  return '#e2e8f0'
}

export const formatEventDate = (event: JourneyEvent) => {
  const start = new Date(`${event.startDate}T00:00:00Z`)
  const end = event.endDate ? new Date(`${event.endDate}T00:00:00Z`) : null

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
  })

  const startLabel = formatter.format(start)
  if (!end) return startLabel

  const endLabel = formatter.format(end)
  if (startLabel === endLabel) return startLabel

  return `${startLabel} - ${endLabel}`
}
