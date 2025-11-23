/**
 * Vaithya Sprite Renderer
 *
 * Renders Tiny Vaithya with CSS-based placeholder graphics.
 * Will be replaced with actual sprite sheet when pixel art is ready.
 */

'use client'

import { useEffect, useState } from 'react'
import type { VaithyaAnimation, VaithyaDirection, VaithyaMood } from '@/lib/vaithya-types'
import { ANIMATION_SEQUENCES, SPRITE_SIZE } from '@/lib/vaithya-types'

interface VaithyaSpriteProps {
  animation: VaithyaAnimation
  frameIndex: number
  direction: VaithyaDirection
  mood: VaithyaMood
  color: string // From circadian theme
}

export default function VaithyaSprite({
  animation,
  frameIndex,
  direction,
  mood,
  color,
}: VaithyaSpriteProps) {
  const [blinkState, setBlinkState] = useState<'open' | 'closing' | 'closed'>('open')

  // Eye position based on animation
  const getEyePosition = () => {
    switch (animation) {
      case 'point_right':
      case 'point_up':
        return 'right'
      case 'sleep':
        return 'closed'
      default:
        return 'forward'
    }
  }

  // Eyebrow position based on mood and animation
  const getEyebrowStyle = () => {
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

  const eyePosition = getEyePosition()
  const eyebrowStyle = getEyebrowStyle()
  const isFlipped = direction === 'left'

  // Animation-specific transforms
  const getBodyTransform = () => {
    let transform = ''

    // Flip for left direction
    if (isFlipped) {
      transform += 'scaleX(-1) '
    }

    // Animation-specific
    switch (animation) {
      case 'walk':
        const walkBob = frameIndex % 2 === 0 ? -1 : 1
        transform += `translateY(${walkBob}px) `
        break

      case 'sit':
        transform += 'translateY(4px) scaleY(0.9) '
        break

      case 'sleep':
        transform += 'rotate(90deg) translateX(8px) '
        break
    }

    return transform
  }

  return (
    <div
      className="relative"
      style={{
        width: SPRITE_SIZE,
        height: SPRITE_SIZE,
        transform: getBodyTransform(),
        transition: 'transform 0.2s ease-out',
      }}
    >
      {/* Body */}
      <div
        className="absolute"
        style={{
          width: 20,
          height: 24,
          left: 6,
          top: 8,
          backgroundColor: color,
          borderRadius: '40% 40% 45% 45% / 50% 50% 40% 40%',
          border: `1px solid ${color}`,
          filter: 'brightness(0.95)',
        }}
      />

      {/* Head */}
      <div
        className="absolute"
        style={{
          width: 16,
          height: 16,
          left: 8,
          top: 2,
          backgroundColor: color,
          borderRadius: '50%',
          border: `1px solid ${color}`,
        }}
      >
        {/* Eyes */}
        {eyePosition !== 'closed' && (
          <>
            <div
              className="absolute"
              style={{
                width: 3,
                height: 3,
                left: eyePosition === 'right' ? 5 : 4,
                top: 6,
                backgroundColor: '#000',
                borderRadius: '50%',
              }}
            />
            <div
              className="absolute"
              style={{
                width: 3,
                height: 3,
                left: eyePosition === 'right' ? 10 : 9,
                top: 6,
                backgroundColor: '#000',
                borderRadius: '50%',
              }}
            />
          </>
        )}

        {/* Eyebrows */}
        {eyePosition !== 'closed' && (
          <>
            <div
              className="absolute"
              style={{
                width: 4,
                height: 1,
                left: 3,
                top: eyebrowStyle === 'raised' ? 4 : eyebrowStyle === 'angled' ? 5 : 5,
                backgroundColor: '#000',
                borderRadius: '2px',
                transform: eyebrowStyle === 'angled' ? 'rotate(-10deg)' : 'none',
              }}
            />
            <div
              className="absolute"
              style={{
                width: 4,
                height: 1,
                left: 9,
                top: eyebrowStyle === 'raised' ? 4 : eyebrowStyle === 'angled' ? 5 : 5,
                backgroundColor: '#000',
                borderRadius: '2px',
                transform: eyebrowStyle === 'angled' ? 'rotate(10deg)' : 'none',
              }}
            />
          </>
        )}
      </div>

      {/* Arms (for pointing animation) */}
      {animation.startsWith('point') && (
        <div
          className="absolute"
          style={{
            width: 2,
            height: 10,
            left: animation === 'point_right' ? 22 : 15,
            top: animation === 'point_up' ? 10 : 14,
            backgroundColor: color,
            borderRadius: '2px',
            transform: animation === 'point_right' ? 'rotate(-45deg)' : 'rotate(-90deg)',
            transformOrigin: 'top center',
          }}
        />
      )}

      {/* Legs (visible in walk/sit) */}
      {(animation === 'walk' || animation === 'sit') && (
        <>
          <div
            className="absolute"
            style={{
              width: 2,
              height: 6,
              left: 10,
              top: animation === 'sit' ? 28 : 28,
              backgroundColor: color,
              borderRadius: '2px',
              transform: animation === 'walk' ? `translateX(${frameIndex % 2 === 0 ? -1 : 1}px)` : 'none',
            }}
          />
          <div
            className="absolute"
            style={{
              width: 2,
              height: 6,
              left: 14,
              top: animation === 'sit' ? 28 : 28,
              backgroundColor: color,
              borderRadius: '2px',
              transform: animation === 'walk' ? `translateX(${frameIndex % 2 === 0 ? 1 : -1}px)` : 'none',
            }}
          />
        </>
      )}

      {/* Sleep Z particles */}
      {animation === 'sleep' && (
        <SleepParticles />
      )}
    </div>
  )
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
