'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import content from '@/data/content.json'
import { CARD_PREVIEW_HOVER_DELAY_MS, CARD_PREVIEW_LEAVE_DELAY_MS } from '@/lib/cardPreviewTiming'

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
    image: '/images/projects/mapping-tpot-thumb.png',
    href: 'https://github.com/anantham/map-tpot'
  }
]

function ProjectCard({
  project,
  isFeatured,
  onFeatureStart,
  onFeatureEnd
}: {
  project: Project
  isFeatured: boolean
  onFeatureStart: () => void
  onFeatureEnd: () => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isFeatured) {
      video.currentTime = 0
      video.play().catch(() => {/* autoplay blocked — image fallback stays visible */})
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isFeatured])

  return (
    <motion.a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      data-project-card="true"
      onMouseEnter={onFeatureStart}
      onMouseLeave={onFeatureEnd}
      onFocus={onFeatureStart}
      onBlur={onFeatureEnd}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={{ aspectRatio: isFeatured ? 16 / 7 : 4 / 3 }}
      transition={{
        duration: 0.6,
        aspectRatio: { duration: 0.75, ease: [0.4, 0, 0.2, 1] }
      }}
      viewport={{ once: true }}
      className="relative block rounded-2xl overflow-hidden bg-zen-900 group"
    >
      {/* Static thumbnail */}
      <Image
        src={project.image}
        alt={project.title}
        fill
        className="object-cover"
        sizes={isFeatured ? '(min-width: 1024px) 80vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'}
      />

      {/* Hover video (fades in over thumbnail) */}
      {project.video && (
        <motion.video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          animate={{ opacity: isFeatured ? 1 : 0 }}
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
          {isFeatured && (
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
  const [featuredProjectId, setFeaturedProjectId] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearFeaturedProject = useCallback(() => {
    if (enterTimerRef.current) { clearTimeout(enterTimerRef.current); enterTimerRef.current = null }
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
    setFeaturedProjectId(null)
  }, [])

  const scheduleFeature = useCallback((id: string) => {
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
    enterTimerRef.current = setTimeout(() => setFeaturedProjectId(id), CARD_PREVIEW_HOVER_DELAY_MS)
  }, [])

  const scheduleUnfeature = useCallback(() => {
    if (enterTimerRef.current) { clearTimeout(enterTimerRef.current); enterTimerRef.current = null }
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
    leaveTimerRef.current = setTimeout(() => setFeaturedProjectId(null), CARD_PREVIEW_LEAVE_DELAY_MS)
  }, [])

  useEffect(() => () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
  }, [])

  const orderedProjects = useMemo(() => {
    if (!featuredProjectId) return projects
    const featured = projects.find(project => project.id === featuredProjectId)
    if (!featured) return projects
    return [featured, ...projects.filter(project => project.id !== featuredProjectId)]
  }, [featuredProjectId])

  useEffect(() => {
    if (!featuredProjectId) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!sectionRef.current) return
      const target = event.target as Node | null
      if (!target) return
      if (!sectionRef.current.contains(target)) {
        clearFeaturedProject()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearFeaturedProject()
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [featuredProjectId, clearFeaturedProject])

  return (
    <section
      ref={sectionRef}
      id="projects-section"
      className="py-20 px-4"
      onMouseLeave={scheduleUnfeature}
    >
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
          {orderedProjects.map(project => {
            const isFeatured = featuredProjectId === project.id

            return (
              <motion.div
                key={project.id}
                layout
                transition={{ layout: { type: 'spring', stiffness: 260, damping: 30 } }}
                className={isFeatured ? 'md:col-span-2 lg:col-span-3' : ''}
              >
                <ProjectCard
                  project={project}
                  isFeatured={isFeatured}
                  onFeatureStart={() => scheduleFeature(project.id)}
                  onFeatureEnd={scheduleUnfeature}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
