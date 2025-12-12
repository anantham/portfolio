'use client'

import type { VaithyaAnimation, VaithyaDirection, VaithyaMood, VaithyaCostume } from '@/lib/vaithya-types'

interface VaithyaSpriteProps {
  animation: VaithyaAnimation
  frameIndex: number
  direction: VaithyaDirection
  mood: VaithyaMood
  costume: VaithyaCostume
  color: string // kept for future tinting; not used by placeholders
}

const SPRITE_SHEET_URL = '/vaithya/sprites.png'
const FRAME_SIZE = 32
const SHEET_COLS = 4
const SHEET_ROWS = 15

const SPRITE_META = {
  animations: {
    idle: { row: 0, frames: 3, colStart: 0 },
    walk: { row: 1, frames: 4, colStart: 0 },
    point_right: { row: 2, frames: 2, colStart: 0 },
    point_up: { row: 2, frames: 2, colStart: 2 },
    sit: { row: 3, frames: 2, colStart: 0 },
    sleep: { row: 4, frames: 2, colStart: 0 },
    blink: { row: 5, frames: 3, colStart: 0 },
    look_around: { row: 6, frames: 4, colStart: 0 },
    scratch_head: { row: 7, frames: 3, colStart: 0 },
    stretch: { row: 8, frames: 3, colStart: 0 },
    climb: { row: 9, frames: 4, colStart: 0 },
    peek: { row: 10, frames: 2, colStart: 0 },
    yawn: { row: 11, frames: 3, colStart: 0 },
    fidget: { row: 12, frames: 4, colStart: 0 },
  } satisfies Record<VaithyaAnimation, { row: number; frames: number; colStart: number }>,
  costumes: {
    builder_hat: { row: 13, col: 0 },
    monk_robe: { row: 13, col: 1 },
    wizard_cap: { row: 13, col: 2 },
    leaf_crown: { row: 13, col: 3 },
  } satisfies Record<Exclude<VaithyaCostume, 'none'>, { row: number; col: number }>,
}

export default function VaithyaSprite({
  animation,
  frameIndex,
  direction,
  costume,
}: VaithyaSpriteProps) {
  const animMeta = SPRITE_META.animations[animation] ?? SPRITE_META.animations.idle
  const frameCount = animMeta.frames
  const colStart = animMeta.colStart ?? 0
  const col = colStart + (frameIndex % frameCount)
  const row = animMeta.row

  const baseStyle: React.CSSProperties = {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundImage: `url(${SPRITE_SHEET_URL})`,
    backgroundSize: `${SHEET_COLS * FRAME_SIZE}px ${SHEET_ROWS * FRAME_SIZE}px`,
    backgroundPosition: `-${col * FRAME_SIZE}px -${row * FRAME_SIZE}px`,
    imageRendering: 'pixelated',
  }

  const costumeStyle =
    costume !== 'none'
      ? {
          ...baseStyle,
          backgroundPosition: `-${SPRITE_META.costumes[costume].col * FRAME_SIZE}px -${
            SPRITE_META.costumes[costume].row * FRAME_SIZE
          }px`,
        }
      : null

  return (
    <div
      className="relative"
      style={{
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        transform: direction === 'left' ? 'scaleX(-1)' : undefined,
        transformOrigin: '50% 50%',
      }}
    >
      <div className="absolute inset-0" style={baseStyle} />
      {costumeStyle && <div className="absolute inset-0" style={costumeStyle} />}
    </div>
  )
}
