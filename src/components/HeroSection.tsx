'use client'

import { motion } from 'framer-motion'
import content from '@/data/content.json'

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden py-20">
      <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-7xl font-light text-zen-50 mb-16 tracking-tight">
            {/* "Building Bridges" — Fraunces, appears first */}
            <motion.span
              className="block leading-tight"
              style={{ fontFamily: 'var(--font-fraunces)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 2.0, ease: 'easeOut' }}
            >
              Building Bridges
            </motion.span>

            {/* "between Niche Subcultures" — Cormorant Garamond, appears after a pause */}
            <motion.span
              className="block mt-4 md:mt-6 leading-tight"
              style={{ fontFamily: 'var(--font-cormorant)' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 5.0, ease: 'easeOut' }}
            >
              between{' '}
              <span className="text-dharma-400 font-normal">{content.hero.title.highlight}</span>
              {content.hero.title.suffix && (
                <span className="text-zen-50 font-normal"> {content.hero.title.suffix}</span>
              )}
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 7.0, ease: 'easeOut' }}
            className="text-xl md:text-2xl text-zen-200 leading-relaxed font-light"
          >
            {content.site.tagline}
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
