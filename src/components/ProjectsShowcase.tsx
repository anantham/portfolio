'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { ExternalLink, Github, Play, Sparkles, BookOpen, Palette } from 'lucide-react'

interface Project {
  id: string
  title: string
  subtitle: string
  description: string
  longDescription: string
  status: 'live' | 'beta' | 'coming-soon'
  type: 'app' | 'story' | 'research'
  icon: React.ComponentType<any>
  gradient: string
  tags: string[]
  previewImage?: string
  links: {
    demo?: string
    github?: string
    subdomain?: string
    details?: string
  }
  featured?: boolean
}

const projects: Project[] = [
  {
    id: 'lexion',
    title: 'Lexicon Forge',
    subtitle: 'Participate in reading, share your taste with others',
    description: 'Read, translate, and remix webnovels with your own flair.',
    longDescription: 'This is an interface you can use to read webnovels from different languages, translate it, insert images, and craft your version, your translation!',
    status: 'live',
    type: 'app',
    icon: Sparkles,
    gradient: 'from-blue-500/20 to-purple-500/20',
    tags: ['Webnovels', 'Translation', 'Remix', 'Reading'],
    previewImage: '/images/lexicon.png',
    links: {
      demo: 'https://lexicon-forge.vercel.app/'
    },
    featured: true
  },
  {
    id: 'tarot-cards',
    title: 'Tarot Cards',
    subtitle: 'Let the visuals prompt you',
    description: 'A visual tarot experience for reflection and storytelling. Decks from Lord of the Mysteries included.',
    longDescription: 'Draw cards, sit with the imagery, and let it prompt your next thought. Includes decks inspired by Lord of the Mysteries.',
    status: 'live',
    type: 'story',
    icon: BookOpen,
    gradient: 'from-rose-500/20 to-orange-500/20',
    tags: ['Tarot', 'Visual Prompts', 'Storytelling', 'Ritual'],
    links: {
      subdomain: 'cardsfromtarot.vercel.app'
    }
  },
  {
    id: 'mapping-tpot',
    title: 'Mapping TPOT',
    subtitle: 'Understanding niche communities',
    description: 'Research project mapping the topology and dynamics of Twitter post-rationalist communities.',
    longDescription: 'An ongoing research initiative to understand how niche intellectual communities form, evolve, and influence each other through social media.',
    status: 'coming-soon',
    type: 'research',
    icon: Palette,
    gradient: 'from-green-500/20 to-teal-500/20',
    tags: ['Research', 'Social Networks', 'Community', 'Analysis'],
    links: {
      details: 'https://github.com/anantham/map-tpot'
    }
  }
]

export default function ProjectsShowcase() {
  return (
    <section id="projects-section" className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-zen-50 mb-6">
            Things I&apos;m{' '}
            <span className="text-dharma-400">building</span>
          </h2>
          <p className="text-xl text-zen-300 max-w-3xl mx-auto">
            Tools, stories, and research projects that explore the intersection of technology,
            community, and contemplative practice.
          </p>
        </motion.div>

        <div className="grid gap-8">
          {/* Featured project (Lexion) */}
          {projects.filter(p => p.featured).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div
                id={`${project.id}-card`}
                data-project-id={project.id}
                className={`glass-card p-8 md:p-12 rounded-3xl bg-gradient-to-br ${project.gradient} border border-zen-700/50`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-zen-800/50 text-blue-400">
                        <project.icon size={28} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-medium
                          ${project.status === 'live' ? 'bg-green-500/20 text-green-400' :
                            project.status === 'beta' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'}
                        `}>
                          {project.status.replace('-', ' ')}
                        </span>
                        <span className="text-xs text-zen-400 uppercase tracking-wider">
                          Featured
                        </span>
                      </div>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-light text-zen-50 mb-3">
                      {project.title}
                    </h3>

                    <p className="text-lg text-dharma-400 mb-4 font-medium">
                      {project.subtitle}
                    </p>

                    <p className="text-zen-300 mb-6 leading-relaxed">
                      {project.longDescription}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-xs bg-zen-800/50 text-zen-300 border border-zen-700/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {project.links.demo && (
                        <motion.a
                          href={project.links.demo}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 glass-card px-6 py-3 rounded-full text-blue-400 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
                        >
                          <Play size={16} />
                          Try Demo
                        </motion.a>
                      )}

                      {project.links.github && (
                        <motion.a
                          href={project.links.github}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 glass-card px-6 py-3 rounded-full text-zen-300 border border-zen-600/30 hover:border-zen-400/50 transition-all duration-300"
                        >
                          <Github size={16} />
                          Source
                        </motion.a>
                      )}
                    </div>
                  </div>

                  <div className="lg:w-80">
                    <div className="glass-card p-6 rounded-2xl bg-zen-800/30">
                      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl">
                        {project.previewImage ? (
                          <Image
                            src={project.previewImage}
                            alt={`${project.title} preview`}
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 320px, 100vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-zen-400 text-center">
                              <project.icon size={48} className="mx-auto mb-2" />
                              <p className="text-sm">Demo Preview</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Other projects */}
          <div className="grid md:grid-cols-2 gap-6">
            {projects.filter(p => !p.featured).map((project, index) => {
              const Icon = project.icon

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    id={`${project.id}-card`}
                    data-project-id={project.id}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`glass-card p-6 rounded-2xl h-full bg-gradient-to-br ${project.gradient} border border-zen-700/50 hover:border-zen-600/70 transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-zen-800/50">
                        <Icon size={24} className="text-rose-400" />
                      </div>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${project.status === 'live' ? 'bg-green-500/20 text-green-400' :
                          project.status === 'beta' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'}
                      `}>
                        {project.status.replace('-', ' ')}
                      </span>
                    </div>

                    <h3 className="text-xl font-medium text-zen-50 mb-2">
                      {project.title}
                    </h3>

                    <p className="text-sm text-dharma-400 mb-3 font-medium">
                      {project.subtitle}
                    </p>

                    <p className="text-sm text-zen-300 mb-4 leading-relaxed">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full text-xs bg-zen-800/50 text-zen-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-auto">
                      {project.links.subdomain && (
                        <motion.a
                          href={`https://${project.links.subdomain}`}
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <ExternalLink size={12} />
                          Visit
                        </motion.a>
                      )}

                      {project.links.details && (
                        <motion.a
                          href={project.links.details}
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-1 text-xs text-zen-400 hover:text-zen-300 transition-colors"
                        >
                          Learn more
                        </motion.a>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
