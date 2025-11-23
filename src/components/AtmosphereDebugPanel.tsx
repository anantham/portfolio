/**
 * Atmosphere Debug Panel
 *
 * Shows current circadian state, memory, and behavior metrics.
 * Toggle with Alt+D or click the floating indicator.
 */

'use client'

import { useAtmosphere } from '@/contexts/AtmosphereContext'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, Clock, Brain, Activity } from 'lucide-react'

export default function AtmosphereDebugPanel() {
  const {
    circadian,
    theme,
    memory,
    familiarityLevel,
    behavior,
    uiComplexity,
    showAdvanced
  } = useAtmosphere()

  const [isOpen, setIsOpen] = useState(false)

  // Toggle with Alt+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setIsOpen(!isOpen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      {/* Floating indicator */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full glass-card border border-zen-700 flex items-center justify-center hover:border-dharma-400 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Toggle Atmosphere Debug (Alt+D)"
      >
        <Eye size={20} className="text-dharma-400" />
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-4 right-4 z-50 w-96 max-h-[90vh] overflow-auto glass-card border border-zen-700 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-zen-50">Atmosphere Debug</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zen-400 hover:text-zen-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Circadian Section */}
            <Section
              icon={<Clock size={16} />}
              title="Circadian State"
              color={theme.accent}
            >
              <Metric label="Phase" value={circadian.phase} />
              <Metric label="Time" value={`${circadian.hour.toString().padStart(2, '0')}:${circadian.minute.toString().padStart(2, '0')}`} />
              <Metric label="Energy" value={circadian.energy.toFixed(2)} bar />
              <Metric label="Warmth" value={circadian.warmth.toFixed(2)} bar />
              <Metric label="Luminance" value={circadian.luminance.toFixed(2)} bar />
              <Metric label="Contemplation" value={circadian.contemplation.toFixed(2)} bar />
            </Section>

            {/* Memory Section */}
            <Section
              icon={<Brain size={16} />}
              title="Memory & Familiarity"
              color={theme.glow}
            >
              <Metric label="Visit Count" value={memory.visitCount} />
              <Metric label="Familiarity" value={familiarityLevel} />
              <Metric label="Seen Nodes" value={memory.seenNodes.size} />
              <Metric label="UI Complexity" value={uiComplexity} />
              <Metric label="Show Advanced" value={showAdvanced ? 'Yes' : 'No'} />
            </Section>

            {/* Behavior Section */}
            <Section
              icon={<Activity size={16} />}
              title="Current Session"
              color="#60a5fa"
            >
              <Metric label="Scroll Speed" value={behavior.scrollSpeed} />
              <Metric label="Hover Depth" value={behavior.hoverDepth} />
              <Metric label="Duration" value={`${Math.floor(behavior.sessionDuration)}s`} />
              <Metric label="Interactions/min" value={behavior.interactionDensity.toFixed(1)} />
            </Section>

            {/* Theme Colors */}
            <Section
              title="Active Theme"
              color={theme.accent}
            >
              <div className="grid grid-cols-2 gap-2">
                <ColorSwatch label="Accent" color={theme.accent} />
                <ColorSwatch label="Glow" color={theme.glow} />
                <ColorSwatch label="BG Start" color={theme.background.start} />
                <ColorSwatch label="BG End" color={theme.background.end} />
              </div>
              <Metric label="Speed Mult" value={`${theme.speed.toFixed(2)}x`} />
              <Metric label="Intensity" value={theme.intensity.toFixed(2)} bar />
            </Section>

            <div className="mt-4 pt-4 border-t border-zen-700 text-xs text-zen-500">
              Press <kbd className="px-2 py-1 bg-zen-800 rounded">Alt+D</kbd> to toggle
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Section({
  icon,
  title,
  color,
  children
}: {
  icon?: React.ReactNode
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4 pb-4 border-b border-zen-700/50 last:border-0">
      <div className="flex items-center gap-2 mb-3">
        {icon && <span style={{ color }}>{icon}</span>}
        <h3 className="text-sm font-medium text-zen-300">{title}</h3>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  bar
}: {
  label: string
  value: string | number
  bar?: boolean
}) {
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  const showBar = bar && !isNaN(numValue)

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zen-400">{label}</span>
        <span className="text-zen-200 font-mono">{value}</span>
      </div>
      {showBar && (
        <div className="h-1 bg-zen-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-dharma-400"
            initial={{ width: 0 }}
            animate={{ width: `${numValue * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  )
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded border border-zen-700"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-zen-400">{label}</span>
    </div>
  )
}
