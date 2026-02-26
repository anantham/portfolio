/* ================================================================== */
/* Mandala Asset Utilities                                            */
/* Image paths with fallback to coloured placeholder SVGs.            */
/* Decouples component development from asset generation.             */
/* ================================================================== */

import { PillarId } from '@/data/mandalaData'

// URL-encoded hex colours matching each pillar's palette
const PILLAR_PLACEHOLDER_COLORS: Record<PillarId, string> = {
  panna: '%2338bdf8', // sky-400
  sila: '%23f59e0b', // amber-500
  samadhi: '%2334d399', // emerald-400
}

/**
 * Returns a data-URI SVG placeholder for a wedge panel.
 * Used when the real generated asset hasn't been placed yet.
 */
export function panelPlaceholder(
  pillar: PillarId,
  illuminated: boolean
): string {
  const color = PILLAR_PLACEHOLDER_COLORS[pillar]
  const opacity = illuminated ? '0.6' : '0.15'
  const label = illuminated ? 'illuminated' : 'resting'

  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'><rect width='400' height='600' rx='20' fill='${color}' opacity='${opacity}'/><text x='200' y='300' text-anchor='middle' fill='white' opacity='0.5' font-size='14' font-family='serif'>${label}</text></svg>`
}

/**
 * Returns a data-URI SVG placeholder for the central hub circle.
 */
export function hubPlaceholder(illuminated: boolean): string {
  const opacity = illuminated ? '0.8' : '0.15'

  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'><circle cx='256' cy='256' r='240' fill='%23f59e0b' opacity='${opacity}'/></svg>`
}

/**
 * Returns `true` when the source string is a data-URI placeholder
 * rather than a real asset path. Useful for conditional rendering
 * (e.g. skipping <Image> optimisation on inline SVGs).
 */
export function isPlaceholder(src: string): boolean {
  return src.startsWith('data:')
}
