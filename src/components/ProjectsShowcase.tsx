'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import content from '@/data/content.json'

interface Project {
  id: string
  title: string
  description: string
  image: string
  video?: { webm: string; mp4: string }
  href: string
}

const projects: Project[] = [
  {
    id: 'lexion',
    title: 'Lexicon Forge',
    description: 'Read webnovels from any language, translate them, insert images, and craft your own version.',
    image: '/images/projects/lexicon-thumb.jpg',
    href: 'https://lexicon-forge.vercel.app/'
  },
  {
    id: 'tarot-cards',
    title: 'Tarot Cards',
    description: 'A visual tarot experience for reflection and storytelling. Decks from Lord of the Mysteries included.',
    image: '/images/projects/tarot-thumb.jpg',
    video: { webm: '/videos/tarot-hover.webm', mp4: '/videos/tarot-hover.mp4' },
    href: 'https://cardsfromtarot.vercel.app'
  },
  {
    id: 'mapping-tpot',
    title: 'Mapping TPOT',
    description: 'Research mapping the topology and dynamics of Twitter post-rationalist communities.',
    image: '/images/lexicon.png',
    href: 'https://github.com/anantham/map-tpot'
  }
]

function ProjectCard({ project }: { project: Project }) {
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleHoverStart = useCallback(() => {
    timerRef.current = setTimeout(() => setIsHovered(true), 350)
  }, [])

  const handleHoverEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsHovered(false)
  }, [])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isHovered) {
      video.currentTime = 0
      video.play().catch(() => {/* autoplay blocked — image fallback stays visible */})
    } else {
      video.pause()
    }
  }, [isHovered])

  return (
    <motion.a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="relative block rounded-2xl overflow-hidden aspect-[4/3] bg-zen-900 group"
    >
      {/* Static thumbnail */}
      <Image
        src={project.image}
        alt={project.title}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
      />

      {/* Hover video (fades in over thumbnail) */}
      {project.video && (
        <motion.video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={project.video.webm} type="video/webm" />
          <source src={project.video.mp4} type="video/mp4" />
        </motion.video>
      )}

      {/* Permanent dark gradient at bottom for title legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Title — always visible */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-lg font-medium text-zen-50 leading-snug">
          {project.title}
        </h3>

        {/* Description — slides up on dwell hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-sm text-zen-300 leading-relaxed mt-2"
            >
              {project.description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.a>
  )
}

export default function ProjectsShowcase() {
  return (
    <section id="projects-section" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-light text-zen-50">
            {content.projects.title}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}
