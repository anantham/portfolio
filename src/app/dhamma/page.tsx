'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import MandalaWheel from '@/components/dhamma/MandalaWheel'
import VimuttiSpokes from '@/components/dhamma/VimuttiSpokes'
import ConnectionThreads from '@/components/dhamma/ConnectionThreads'
import MandalaA11y from '@/components/dhamma/MandalaA11y'
import { useMandalaState } from '@/hooks/useMandalaState'
import { usePreloadImages } from '@/hooks/usePreloadImages'
import { PATH_FACTORS } from '@/data/mandalaData'

export default function DhammaPage() {
  const {
    activePanel,
    visitedPanels,
    vimuttiRevealed,
    activeConnection,
    activatePanel,
    deactivatePanel,
    activateConnection,
    deactivateConnection,
  } = useMandalaState()

  usePreloadImages(PATH_FACTORS.map(f => f.illuminatedImage))

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState(0)

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize(Math.min(rect.width, rect.height))
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return (
    <main className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-30 px-4 py-2 rounded-full border border-white/20 bg-black/55 backdrop-blur text-white/70 text-sm hover:text-white/90 transition-colors"
      >
        Back
      </Link>

      {/* Fade-in wrapper */}
      <motion.div
        ref={containerRef}
        className="relative"
        style={{
          width: 'min(90vw, 90vh)',
          height: 'min(90vw, 90vh)',
          containerType: 'inline-size',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* The wheel */}
        <MandalaWheel
          activePanel={activePanel}
          visitedPanels={visitedPanels}
          vimuttiRevealed={vimuttiRevealed}
          onActivatePanel={activatePanel}
          onDeactivatePanel={deactivatePanel}
        />

        {/* Connection threads overlay */}
        {containerSize > 0 && (
          <ConnectionThreads
            activePanel={activePanel}
            activeConnection={activeConnection}
            onActivateConnection={activateConnection}
            onDeactivateConnection={deactivateConnection}
            containerSize={containerSize}
          />
        )}
      </motion.div>

      {/* Accessibility layer */}
      <MandalaA11y />
    </main>
  )
}
