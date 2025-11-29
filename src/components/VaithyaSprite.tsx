'use client'

import type { VaithyaAnimation, VaithyaDirection, VaithyaMood, VaithyaCostume } from '@/lib/vaithya-types'
import { ANIMATION_SEQUENCES, SPRITE_SIZE } from '@/lib/vaithya-types'

interface VaithyaSpriteProps {
  animation: VaithyaAnimation
  frameIndex: number
  direction: VaithyaDirection
  mood: VaithyaMood
  costume: VaithyaCostume
  color: string // From circadian theme
}

const HEAD_SIZE = 9
const SHOULDER_Y = HEAD_SIZE
const TORSO_LENGTH = 9
const HIP_Y = SHOULDER_Y + TORSO_LENGTH
const CENTER_X = SPRITE_SIZE / 2
const THIGH_LENGTH = 6
const SHIN_LENGTH = 5

export default function VaithyaSprite({
  animation,
  frameIndex,
  direction,
  mood,
  costume,
  color,
}: VaithyaSpriteProps) {
  const sequence = ANIMATION_SEQUENCES[animation]
  const phase = sequence ? (frameIndex % sequence.frames.length) / sequence.frames.length : 0
  const cycle = Math.sin(phase * Math.PI * 2)
  const counterCycle = Math.sin(phase * Math.PI * 2 + Math.PI)

  const isFlipped = direction === 'left'
  const isWalking = animation === 'walk'
  const isSitting = animation === 'sit'
  const isSleeping = animation === 'sleep'
  const isStretching = animation === 'stretch'
  const isPointing = animation === 'point_right' || animation === 'point_up'
  const isClimbing = animation === 'climb'
  const isPeeking = animation === 'peek'

  const bodyBob = (isWalking ? cycle * 1.5 : 0) + (isSitting ? 3 : 0)
  const torsoLean = isWalking ? cycle * 3 : isPointing ? 4 : isStretching ? -4 : isClimbing ? -3 : 0
  const headTilt = isSleeping ? 12 : animation === 'look_around' ? (frameIndex % 4 - 1.5) * 4 : 0

  // Arms and legs swing in opposing cycles for a stick-figure gait
  const frontArmUpper = isStretching ? -115 : isPointing ? (animation === 'point_up' ? -130 : -45) : isClimbing ? -40 : isWalking ? -counterCycle * 22 : -8
  const frontArmLower = isStretching ? -5 : isPointing ? (animation === 'point_up' ? -10 : -5) : isClimbing ? -15 : isWalking ? frontArmUpper * 0.5 : 0
  const backArmUpper = isStretching ? 115 : isClimbing ? 30 : isWalking ? -frontArmUpper * 0.6 : 10
  const backArmLower = isStretching ? 10 : isClimbing ? 5 : isWalking ? backArmUpper * 0.4 : 0

  const frontLegUpper = isWalking ? cycle * 24 : isSitting ? -80 : isSleeping ? -20 : isClimbing ? -30 : 0
  const backLegUpper = isWalking ? counterCycle * 24 : isSitting ? -55 : isSleeping ? 10 : isClimbing ? 25 : 0
  const frontLegLower = isWalking ? -12 - Math.max(0, cycle) * 10 : isSitting ? 38 : isSleeping ? 12 : isClimbing ? 12 : 0
  const backLegLower = isWalking ? -12 - Math.max(0, counterCycle) * 10 : isSitting ? 25 : isSleeping ? 6 : isClimbing ? 8 : 0
  const kneeLiftFront = isWalking ? -Math.max(0, cycle) * 3 : isClimbing ? -4 : isSitting ? -1 : 0
  const kneeLiftBack = isWalking ? -Math.max(0, counterCycle) * 3 : isClimbing ? -2 : isSitting ? -1 : 0
  const footSpread = isSitting ? 5 : 0

  const eyePosition = getEyePosition(animation, frameIndex)
  const eyebrowStyle = getEyebrowStyle(animation, mood)
  const eyesClosed = animation === 'sleep' || animation === 'blink' || eyePosition === 'closed'

  const figureTransform = [
    isFlipped ? 'scaleX(-1)' : '',
    isSleeping ? 'rotate(90deg) translateX(6px)' : '',
    isPeeking ? 'translateX(-8px)' : '',
    `translateY(${bodyBob}px)`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className="relative"
      style={{
        width: SPRITE_SIZE,
        height: SPRITE_SIZE,
        transform: figureTransform,
        transition: 'transform 0.2s ease-out',
      }}
    >
      <div
        className="absolute"
        style={{
          inset: 0,
          transform: `rotate(${torsoLean}deg)`,
          transformOrigin: '50% 70%',
        }}
      >
        <Torso color={color} />
        <Arm x={CENTER_X + 3} upper={frontArmUpper} lower={frontArmLower} color={color} />
        <Arm x={CENTER_X - 3} upper={backArmUpper} lower={backArmLower} color={color} />
        <Leg
          x={CENTER_X + 2 + footSpread}
          lift={kneeLiftFront}
          upper={frontLegUpper}
          lower={frontLegLower}
          color={color}
        />
        <Leg
          x={CENTER_X - 2 - footSpread}
          lift={kneeLiftBack}
          upper={backLegUpper}
          lower={backLegLower}
          color={color}
        />
        <Head
          color={color}
          eyebrowStyle={eyebrowStyle}
          eyePosition={eyesClosed ? 'closed' : eyePosition}
          headTilt={headTilt}
          isSleeping={isSleeping}
        />
        {costume !== 'none' && (
          <Costume costume={costume} color={color} centerX={CENTER_X} headSize={HEAD_SIZE} />
        )}
      </div>

      {animation === 'sleep' && <SleepParticles />}
    </div>
  )
}

function Torso({ color }: { color: string }) {
  return (
    <div
      className="absolute"
      style={{
        width: 2,
        height: TORSO_LENGTH,
        left: CENTER_X,
        top: SHOULDER_Y,
        backgroundColor: color,
        borderRadius: 4,
        transform: 'translate(-50%, 0)',
      }}
    />
  )
}

function Arm({
  x,
  upper,
  lower,
  color,
  y = SHOULDER_Y,
}: {
  x: number
  upper: number
  lower: number
  color: string
  y?: number
}) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, 0) rotate(${upper}deg)`,
        transformOrigin: '50% 0%',
      }}
    >
      <div
        style={{
          width: 2,
          height: 6,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          width: 2,
          height: 5,
          backgroundColor: color,
          borderRadius: 2,
          transform: `translateY(6px) rotate(${lower}deg)`,
          transformOrigin: '50% 0%',
        }}
      />
    </div>
  )
}

function Leg({
  x,
  upper,
  lower,
  lift,
  color,
  y = HIP_Y,
}: {
  x: number
  upper: number
  lower: number
  lift: number
  color: string
  y?: number
}) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y + lift,
        transform: `translate(-50%, 0) rotate(${upper}deg)`,
        transformOrigin: '50% 0%',
      }}
    >
      <div
        style={{
          width: 2,
          height: THIGH_LENGTH,
          backgroundColor: color,
          borderRadius: 2,
          boxShadow: '0 0 2px rgba(0,0,0,0.12)',
        }}
      />
      <div
        style={{
          width: 2,
          height: SHIN_LENGTH,
          backgroundColor: color,
          borderRadius: 2,
          transform: `translateY(${THIGH_LENGTH}px) rotate(${lower}deg)`,
          transformOrigin: '50% 0%',
          boxShadow: '0 0 2px rgba(0,0,0,0.12)',
        }}
      />
      <div
        style={{
          width: 4,
          height: 2,
          backgroundColor: color,
          borderRadius: 2,
          transform: `translate(-1px, ${THIGH_LENGTH + SHIN_LENGTH}px)`,
          boxShadow: '0 0 2px rgba(0,0,0,0.12)',
        }}
      />
    </div>
  )
}

function Head({
  color,
  eyebrowStyle,
  eyePosition,
  headTilt,
  isSleeping,
}: {
  color: string
  eyebrowStyle: string
  eyePosition: 'forward' | 'left' | 'right' | 'up' | 'closed'
  headTilt: number
  isSleeping: boolean
}) {
  const baseLeft = CENTER_X - (HEAD_SIZE + 2) / 2
  const eyeY = eyePosition === 'up' ? 3 : 4
  const leftEyeX = eyePosition === 'right' ? 5 : eyePosition === 'left' ? 3 : 4
  const rightEyeX = eyePosition === 'right' ? 9 : eyePosition === 'left' ? 7 : 8

  return (
    <div
      className="absolute"
      style={{
        width: HEAD_SIZE + 2,
        height: HEAD_SIZE + 2,
        left: baseLeft,
        top: 0,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        backgroundColor: 'rgba(255,255,255,0.9)',
        transform: `rotate(${headTilt}deg)`,
        transformOrigin: '50% 100%',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      }}
    >
      {eyePosition !== 'closed' && (
        <>
          <div
            className="absolute"
            style={{
              width: 2,
              height: 2,
              left: leftEyeX,
              top: eyeY,
              backgroundColor: '#0f172a',
              borderRadius: '50%',
            }}
          />
          <div
            className="absolute"
            style={{
              width: 2,
              height: 2,
              left: rightEyeX,
              top: eyeY,
              backgroundColor: '#0f172a',
              borderRadius: '50%',
            }}
          />
        </>
      )}

      {eyePosition === 'closed' && (
        <div
          className="absolute left-1/2"
          style={{
            width: 8,
            height: 1,
            backgroundColor: '#0f172a',
            top: eyeY + 1,
            transform: 'translateX(-50%)',
            borderRadius: 2,
          }}
        />
      )}

      {!isSleeping && eyePosition !== 'closed' && (
        <>
          <div
            className="absolute"
            style={{
              width: 5,
              height: 1,
              left: leftEyeX - 1,
              top: eyebrowStyle === 'raised' ? eyeY - 2 : eyeY - 1,
              backgroundColor: '#0f172a',
              borderRadius: 2,
              transform: eyebrowStyle === 'angled' ? 'rotate(-10deg)' : 'none',
            }}
          />
          <div
            className="absolute"
            style={{
              width: 5,
              height: 1,
              left: rightEyeX - 1,
              top: eyebrowStyle === 'raised' ? eyeY - 2 : eyeY - 1,
              backgroundColor: '#0f172a',
              borderRadius: 2,
              transform: eyebrowStyle === 'angled' ? 'rotate(10deg)' : 'none',
            }}
          />
        </>
      )}
    </div>
  )
}

function Costume({
  costume,
  color,
  centerX,
  headSize,
}: {
  costume: VaithyaCostume
  color: string
  centerX: number
  headSize: number
}) {
  switch (costume) {
    case 'builder_hat': {
      const width = headSize + 4
      return (
        <div
          className="absolute"
          style={{
            width,
            height: 5,
            left: centerX - width / 2,
            top: -2,
            backgroundColor: '#fbbf24',
            borderRadius: '4px 4px 0 0',
            border: '1px solid #f59e0b',
          }}
        >
          <div
            className="absolute"
            style={{
              width: width + 4,
              height: 2,
              left: -2,
              bottom: -1,
              backgroundColor: '#fbbf24',
              borderRadius: '2px',
            }}
          />
        </div>
      )
    }

    case 'monk_robe': {
      const width = headSize + 6
      return (
        <div
          className="absolute"
          style={{
            width,
            height: 8,
            left: centerX - width / 2,
            top: 1,
            backgroundColor: '#f97316',
            borderRadius: '8px 8px 0 0',
            opacity: 0.9,
            border: '1px solid #ea580c',
          }}
        />
      )
    }

    case 'wizard_cap':
      return (
        <div
          className="absolute"
          style={{
            width: 0,
            height: 0,
            left: centerX - 3,
            top: -6,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '10px solid #3b82f6',
            transform: 'rotate(10deg)',
          }}
        >
          <div
            className="absolute"
            style={{
              width: 2,
              height: 2,
              left: -1,
              top: -8,
              backgroundColor: '#fbbf24',
              borderRadius: '50%',
            }}
          />
        </div>
      )

    case 'leaf_crown':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: 4,
                height: 5,
                left: centerX - 6 + i * 4,
                top: -1,
                backgroundColor: '#22c55e',
                borderRadius: '2px 2px 0 0',
                transform: `rotate(${(i - 1) * 12}deg)`,
              }}
            />
          ))}
        </>
      )

    default:
      return null
  }
}

function SleepParticles() {
  return (
    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute text-zen-400 text-xs opacity-60"
          style={{
            animation: `float-z 3s ease-in-out ${i * 0.8}s infinite`,
            left: `${i * 8}px`,
          }}
        >
          Z
        </div>
      ))}
      <style jsx>{`
        @keyframes float-z {
          0% {
            transform: translateY(0px) scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

function getEyePosition(
  animation: VaithyaAnimation,
  frameIndex: number
): 'forward' | 'left' | 'right' | 'up' | 'closed' {
  switch (animation) {
    case 'point_right':
    case 'point_up':
      return 'right' as const
    case 'sleep':
      return 'closed' as const
    case 'look_around':
      if (frameIndex === 1) return 'left'
      if (frameIndex === 2) return 'right'
      if (frameIndex === 3) return 'up'
      return 'forward'
    case 'stretch':
      return frameIndex === 1 ? 'closed' : 'up'
    case 'scratch_head':
      return 'up'
    default:
      return 'forward'
  }
}

function getEyebrowStyle(animation: VaithyaAnimation, mood: VaithyaMood) {
  if (animation === 'sleep') {
    return 'relaxed'
  }

  switch (mood) {
    case 'playful':
    case 'curious':
      return 'raised'
    case 'focused':
      return 'angled'
    case 'sleepy':
      return 'relaxed'
    default:
      return 'neutral'
  }
}
