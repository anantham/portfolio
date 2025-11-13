'use client'

import { motion } from 'framer-motion'
import DharmaWheel from './DharmaWheel'
import content from '@/data/content.json'

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8"
        >
          <DharmaWheel size={160} className="mb-8 animate-float" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-light text-zen-50 mb-6 tracking-tight">
            {content.hero.title.main}{' '}
            <span className="text-dharma-400 font-normal">{content.hero.title.highlight}</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-xl md:text-2xl text-zen-300 mb-8 leading-relaxed font-light"
          >
            {content.site.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="text-lg text-zen-400 font-light italic"
          >
            <p>
              {content.site.quote.attribution ? `"${content.site.quote.text}"` : content.site.quote.text}
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-12"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.a
              href="https://t.me/+QZCiSoVarG49zSQ8"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-card px-8 py-3 rounded-full text-dharma-400 border border-dharma-500/30 hover:border-dharma-400/50 transition-all duration-300"
            >
              Join the Reading List
            </motion.a>

            <motion.button
              onClick={() => {
                const projectsSection = document.getElementById('projects-section')
                projectsSection?.scrollIntoView({ behavior: 'smooth' })
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-card px-8 py-3 rounded-full text-zen-300 border border-zen-600/30 hover:border-zen-400/50 transition-all duration-300"
            >
              Explore My Work
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}