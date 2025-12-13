'use client'

import { motion } from 'framer-motion'
import content from '@/data/content.json'
import DharmaWheel from '@/components/DharmaWheel'

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden py-20">
      <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <DharmaWheel size={160} className="mb-10 animate-float" />
          <h1 className="text-5xl md:text-7xl font-light text-zen-50 mb-16 tracking-tight">
            <span className="block leading-tight">
              {content.hero.title.main}
            </span>
            <span className="block mt-4 md:mt-6 leading-tight text-dharma-400 font-normal">
              {content.hero.title.highlight}
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-xl md:text-2xl text-zen-200 leading-relaxed font-light"
          >
            {content.site.tagline}
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
