'use client'

import { motion } from 'framer-motion'
import DharmaWheel from './DharmaWheel'

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border border-dharma-500 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-dharma-600 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border border-dharma-400 rounded-full"></div>
      </div>

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
            Building Bridges to{' '}
            <span className="text-dharma-400 font-normal">Niche Subcultures</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-xl md:text-2xl text-zen-300 mb-8 leading-relaxed font-light"
          >
            A crafted place to meet niche subcultures with care—tools, essays, and rituals
            for building culture on purpose.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="text-lg text-zen-400 font-light italic"
          >
            <p className="mb-2">
              "Notice the music playing at the scale of days or weeks,
            </p>
            <p>
              but invite yourself to zoom out and consider the periodic rhythms
              that exist at the scale of years or decades."
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-card px-8 py-3 rounded-full text-dharma-400 border border-dharma-500/30 hover:border-dharma-400/50 transition-all duration-300"
            >
              Join the Reading List
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-card px-8 py-3 rounded-full text-zen-300 border border-zen-600/30 hover:border-zen-400/50 transition-all duration-300"
            >
              Explore My Work
            </motion.button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-zen-600 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-3 bg-dharma-500 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}