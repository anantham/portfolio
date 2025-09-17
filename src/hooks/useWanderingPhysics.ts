'use client'

import { useEffect, useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

interface Velocity {
  x: number
  y: number
}

interface WanderingState {
  position: Position
  velocity: Velocity
}

interface UseWanderingPhysicsProps {
  mousePosition: Position
  wheelSize: number
  baseSpeed?: number
  avoidanceDistance?: number
  avoidanceStrength?: number
  wanderStrength?: number
  boundaryPadding?: number
}

export function useWanderingPhysics({
  mousePosition,
  wheelSize,
  baseSpeed = 0.5,
  avoidanceDistance = 120,
  avoidanceStrength = 0.8,
  wanderStrength = 0.3,
  boundaryPadding = 50
}: UseWanderingPhysicsProps): Position {
  const [position, setPosition] = useState<Position>({
    x: Math.random() * (window?.innerWidth || 800),
    y: Math.random() * (window?.innerHeight || 600)
  })
  const velocityRef = useRef<Velocity>({
    x: (Math.random() - 0.5) * baseSpeed * 2,
    y: (Math.random() - 0.5) * baseSpeed * 2
  })
  const driftAngleRef = useRef<number>(Math.random() * Math.PI * 2)
  const lastDriftUpdate = useRef<number>(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    const animate = (timestamp: number) => {
      const deltaTime = 16.67 // ~60fps in milliseconds

      // Get window dimensions
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const halfWheel = wheelSize / 2

      // Calculate distance to mouse
      const dx = position.x - mousePosition.x
      const dy = position.y - mousePosition.y
      const distanceToMouse = Math.sqrt(dx * dx + dy * dy)

      // Current velocity
      let vx = velocityRef.current.x
      let vy = velocityRef.current.y

      // Brownian motion components
      // 1. Drift term (persistent directional bias)
      if (timestamp - lastDriftUpdate.current > 8000 + Math.random() * 4000) {
        // Update drift direction every 8-12 seconds
        driftAngleRef.current += (Math.random() - 0.5) * Math.PI * 0.5 // ±45 degree changes
        lastDriftUpdate.current = timestamp
      }

      const driftForce = baseSpeed * 0.3 // 30% of base speed as drift
      const driftX = Math.cos(driftAngleRef.current) * driftForce
      const driftY = Math.sin(driftAngleRef.current) * driftForce

      // 2. Variance term (random diffusion)
      const varianceStrength = wanderStrength
      const brownianX = (Math.random() - 0.5) * varianceStrength
      const brownianY = (Math.random() - 0.5) * varianceStrength

      // Apply Brownian motion
      vx += driftX + brownianX
      vy += driftY + brownianY

      // Mouse avoidance force (stronger and more immediate)
      if (distanceToMouse < avoidanceDistance && distanceToMouse > 0) {
        const avoidanceForce = avoidanceStrength * Math.pow(1 - distanceToMouse / avoidanceDistance, 2)
        const normalizedX = dx / distanceToMouse
        const normalizedY = dy / distanceToMouse

        vx += normalizedX * avoidanceForce
        vy += normalizedY * avoidanceForce

        // When avoiding, add some random deflection for more natural movement
        const randomDeflection = 0.2
        vx += (Math.random() - 0.5) * randomDeflection
        vy += (Math.random() - 0.5) * randomDeflection
      }

      // Boundary avoidance (gentle curves away from edges)
      const edgeForce = 0.2
      if (position.x < boundaryPadding) {
        vx += edgeForce * (1 - position.x / boundaryPadding)
      }
      if (position.x > windowWidth - boundaryPadding - wheelSize) {
        vx -= edgeForce * (1 - (windowWidth - position.x - wheelSize) / boundaryPadding)
      }
      if (position.y < boundaryPadding) {
        vy += edgeForce * (1 - position.y / boundaryPadding)
      }
      if (position.y > windowHeight - boundaryPadding - wheelSize) {
        vy -= edgeForce * (1 - (windowHeight - position.y - wheelSize) / boundaryPadding)
      }

      // Normalize velocity to maintain consistent speed
      const currentSpeed = Math.sqrt(vx * vx + vy * vy)
      if (currentSpeed > 0) {
        const targetSpeed = baseSpeed
        vx = (vx / currentSpeed) * targetSpeed
        vy = (vy / currentSpeed) * targetSpeed
      }

      // Apply some momentum/smoothing
      const smoothing = 0.95
      velocityRef.current.x = velocityRef.current.x * smoothing + vx * (1 - smoothing)
      velocityRef.current.y = velocityRef.current.y * smoothing + vy * (1 - smoothing)

      // Update position
      setPosition(prev => {
        let newX = prev.x + velocityRef.current.x * (deltaTime / 16.67)
        let newY = prev.y + velocityRef.current.y * (deltaTime / 16.67)

        // Hard boundary constraints (just in case)
        newX = Math.max(halfWheel, Math.min(windowWidth - halfWheel, newX))
        newY = Math.max(halfWheel, Math.min(windowHeight - halfWheel, newY))

        return { x: newX, y: newY }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mousePosition, wheelSize, baseSpeed, avoidanceDistance, avoidanceStrength, wanderStrength, boundaryPadding, position.x, position.y])

  // Handle window resize to reset position if needed
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const halfWheel = wheelSize / 2

      setPosition(prev => ({
        x: Math.max(halfWheel, Math.min(windowWidth - halfWheel, prev.x)),
        y: Math.max(halfWheel, Math.min(windowHeight - halfWheel, prev.y))
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [wheelSize])

  return position
}