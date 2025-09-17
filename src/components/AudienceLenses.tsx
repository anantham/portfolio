'use client'

import { motion } from 'framer-motion'
import { Brain, Code, Heart, Flower } from 'lucide-react'
import { content, type LensId } from '@/lib/content'
import { useLens } from '@/contexts/LensContext'

interface LensData {
  id: LensId
  title: string
  subtitle: string
  description: string
  icon: React.ComponentType<any>
  color: string
  gradient: string
}

const iconMap = {
  'lw-math': Brain,
  'engineer': Code,
  'embodied': Heart,
  'buddhist': Flower
}

const styleMap = {
  'lw-math': {
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  'engineer': {
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  'embodied': {
    color: 'text-rose-400',
    gradient: 'from-rose-500/20 to-pink-500/20'
  },
  'buddhist': {
    color: 'text-dharma-400',
    gradient: 'from-dharma-500/20 to-yellow-500/20'
  }
}

const lenses: LensData[] = content.lenses.archetypes.map(archetype => ({
  ...archetype,
  icon: iconMap[archetype.id],
  ...styleMap[archetype.id]
}))

export default function AudienceLenses() {
  const { selectedLens, setSelectedLens } = useLens()
  const [hoveredLens, setHoveredLens] = useState<LensId | null>(null)

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-zen-50 mb-6">
            {content.lenses.title.split(' ').map((word, i, words) => {
              if (word === 'today?') {
                return <span key={i} className="text-dharma-400">{word}</span>
              }
              return word + (i < words.length - 1 ? ' ' : '')
            })}
          </h2>
          <p className="text-xl text-zen-300 max-w-3xl mx-auto">
            {content.lenses.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {lenses.map((lens, index) => {
            const Icon = lens.icon
            const isSelected = selectedLens === lens.id
            const isHovered = hoveredLens === lens.id

            return (
              <motion.div
                key={lens.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedLens(isSelected ? null : lens.id)}
                  onHoverStart={() => setHoveredLens(lens.id)}
                  onHoverEnd={() => setHoveredLens(null)}
                  className={`
                    glass-card p-6 rounded-2xl cursor-pointer transition-all duration-300
                    ${isSelected ? 'ring-2 ring-dharma-400/50' : ''}
                    bg-gradient-to-br ${lens.gradient}
                    border border-zen-700/50 hover:border-zen-600/70
                  `}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-dharma-500 rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-zen-900 rounded-full" />
                    </motion.div>
                  )}

                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      animate={{
                        scale: isHovered ? 1.1 : 1,
                        rotate: isHovered ? 5 : 0
                      }}
                      transition={{ duration: 0.2 }}
                      className={`p-4 rounded-xl bg-zen-800/50 mb-4 ${lens.color}`}
                    >
                      <Icon size={32} />
                    </motion.div>

                    <h3 className="text-xl font-medium text-zen-50 mb-2">
                      {lens.title}
                    </h3>

                    <p className="text-sm text-zen-400 mb-4 font-medium">
                      {lens.subtitle}
                    </p>

                    <p className="text-sm text-zen-300 leading-relaxed">
                      {lens.description}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {selectedLens && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-12"
          >
            <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-dharma-500/10 to-zen-600/10 border border-dharma-500/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-dharma-400 animate-pulse"></div>
                <span className="text-zen-300 text-sm">
                  Lens selected: <span className="text-dharma-400 font-medium">
                    {lenses.find(l => l.id === selectedLens)?.title}
                  </span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}