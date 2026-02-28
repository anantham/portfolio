'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Twitter,
  Github,
  Linkedin,
  Youtube,
  BookOpen,
  Send,
  Globe,
  ExternalLink,
  Clock
} from 'lucide-react'
import { siteConfig, hasLink } from '@/lib/config'
import {
  CARD_PREVIEW_HOVER_DELAY_MS,
  CARD_PREVIEW_EXPAND_DURATION_S
} from '@/lib/cardPreviewTiming'
import content from '@/data/content.json'

interface SocialLink {
  name: string
  url: string
  icon: React.ComponentType<any>
  color: string
  description: string
  openInNewTab?: boolean
  preview?: {
    title: string
    subtitle: string
    activity?: string
  }
}

const socialLinks: SocialLink[] = [
  {
    name: 'Twitter',
    url: content.footer.social.twitter.url,
    icon: Twitter,
    color: 'text-blue-400 hover:text-blue-300',
    description: 'Daily thoughts, threads, and community interactions',
    preview: {
      title: content.footer.social.twitter.handle,
      subtitle: 'Building bridges between communities',
      activity: 'Active daily'
    }
  },
  {
    name: 'GitHub',
    url: content.footer.social.github.url,
    icon: Github,
    color: 'text-zen-300 hover:text-zen-200',
    description: 'Open source projects and code repositories',
    preview: {
      title: content.footer.social.github.handle,
      subtitle: 'Tools, experiments, and learning in public',
      activity: 'Recent commits'
    }
  },
  {
    name: 'Substack',
    url: content.footer.social.substack,
    icon: BookOpen,
    color: 'text-orange-400 hover:text-orange-300',
    description: 'Long-form writing and contemplative essays',
    preview: {
      title: "Aditya's Dao",
      subtitle: 'Essays on culture, practice, and building bridges',
      activity: 'Weekly posts'
    }
  },
  {
    name: 'YouTube',
    url: content.footer.social.youtube,
    icon: Youtube,
    color: 'text-red-400 hover:text-red-300',
    description: 'Videos, talks, and visual explorations',
    preview: {
      title: 'Visual Essays',
      subtitle: 'Exploring ideas through video',
      activity: 'Monthly uploads'
    }
  },
  {
    name: 'Telegram',
    url: content.footer.social.telegram,
    icon: Send,
    color: 'text-cyan-400 hover:text-cyan-300',
    description: 'Reading list and community discussions',
    preview: {
      title: 'Reading List',
      subtitle: 'Curated links and community dialogue',
      activity: 'Join the conversation'
    }
  },
  {
    name: 'Trace my Journey',
    url: '/journey',
    icon: Globe,
    color: 'text-indigo-300 hover:text-indigo-200',
    description: 'Interactive globe timeline of lineage, travel, and milestones',
    openInNewTab: false,
    preview: {
      title: 'Journey Atlas',
      subtitle: 'Lineage, movement, and key life events',
      activity: 'Scroll to explore'
    }
  }
]

export default function Footer() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleHoverStart = useCallback((name: string) => {
    hoverTimer.current = setTimeout(() => setHoveredLink(name), CARD_PREVIEW_HOVER_DELAY_MS)
  }, [])

  const handleHoverEnd = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setHoveredLink(null)
  }, [])

  return (
    <footer className="relative py-16 px-4 bg-gradient-to-t from-zen-900 to-transparent">
      <div className="container mx-auto max-w-6xl">
        {/* Main footer content */}
        <div className="mb-12">
          {/* Social links */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-4xl md:text-5xl font-light text-zen-50 mb-10">
                Find me
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {socialLinks.map((link, index) => {
                  const Icon = link.icon
                  const isHovered = hoveredLink === link.name

                  return (
                    <motion.a
                      key={link.name}
                      href={link.url}
                      target={link.openInNewTab === false ? undefined : '_blank'}
                      rel={link.openInNewTab === false ? undefined : 'noopener noreferrer'}
                      onHoverStart={() => handleHoverStart(link.name)}
                      onHoverEnd={handleHoverEnd}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="group"
                    >
                      <div className="glass-card p-4 rounded-xl border border-zen-700/50 hover:border-zen-600/70 transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-zen-800/50 transition-colors ${link.color}`}>
                            <Icon size={20} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-zen-50 text-sm">
                                {link.name}
                              </h4>
                              {link.openInNewTab === false ? null : (
                                <ExternalLink
                                  size={12}
                                  className="text-zen-500 group-hover:text-zen-400 transition-colors"
                                />
                              )}
                            </div>

                            {link.preview && isHovered ? (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: CARD_PREVIEW_EXPAND_DURATION_S, ease: 'easeInOut' }}
                                className="space-y-1"
                              >
                                <p className="text-xs font-medium text-zen-300">
                                  {link.preview.title}
                                </p>
                                <p className="text-xs text-zen-400">
                                  {link.preview.subtitle}
                                </p>
                                {link.preview.activity && (
                                  <div className="flex items-center gap-1 text-xs text-zen-500">
                                    <Clock size={10} />
                                    <span>{link.preview.activity}</span>
                                  </div>
                                )}
                              </motion.div>
                            ) : (
                              <p className="text-xs text-zen-400 leading-relaxed">
                                {link.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.a>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zen-800/50 pt-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-between items-center gap-4"
          >
            {/* Copyright */}
            <div className="text-sm text-zen-500">
              <p>
                ©{' '}
                <a
                  href="https://github.com/anantham/portfolio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zen-300 transition-colors"
                >
                  {new Date().getFullYear()} {siteConfig.name}
                </a>
                .
              </p>
            </div>

            {/* Contact info */}
            <div className="flex items-center gap-4 text-sm text-zen-500">
              {hasLink(siteConfig.contact.email) && (
                <motion.a
                  href={`mailto:${siteConfig.contact.email}`}
                  whileHover={{ scale: 1.05 }}
                  className="hover:text-dharma-400 transition-colors"
                >
                  {siteConfig.contact.email}
                </motion.a>
              )}
            </div>
          </motion.div>
        </div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute bottom-10 left-10 w-20 h-20 border border-dharma-500 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 border border-dharma-600 rounded-full"></div>
        </div>
      </div>
    </footer>
  )
}
