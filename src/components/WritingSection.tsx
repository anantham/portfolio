'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Clock, Tag, ArrowRight, BookOpen } from 'lucide-react'
import { SubstackPost, fetchSubstackPosts, formatDate, getTimeAgo, truncateText } from '@/lib/substack'
import { siteConfig, hasLink } from '@/lib/config'

export default function WritingSection() {
  const [posts, setPosts] = useState<SubstackPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<SubstackPost | null>(null)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const fetchedPosts = await fetchSubstackPosts()
        setPosts(fetchedPosts)
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  if (!hasLink(siteConfig.social.substack)) {
    return null
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-transparent to-zen-900/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-zen-50 mb-6">
            Recent{' '}
            <span className="text-dharma-400">Writing</span>
          </h2>
          <p className="text-xl text-zen-300 max-w-3xl mx-auto mb-8">
            Essays exploring the intersection of technology, community, and contemplative practice.
            Thoughts on building bridges between different ways of knowing.
          </p>

          {hasLink(siteConfig.social.substack) && (
            <motion.a
              href={siteConfig.social.substack}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 glass-card px-6 py-3 rounded-full text-orange-400 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300"
            >
              <BookOpen size={18} />
              Read on Substack
              <ExternalLink size={16} />
            </motion.a>
          )}
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse">
                <div className="h-4 bg-zen-700 rounded mb-4"></div>
                <div className="h-3 bg-zen-800 rounded mb-2"></div>
                <div className="h-3 bg-zen-800 rounded mb-4"></div>
                <div className="h-2 bg-zen-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Featured post */}
            {posts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <div className="glass-card p-8 md:p-12 rounded-3xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                          Latest
                        </span>
                        <span className="text-sm text-zen-400">
                          {getTimeAgo(posts[0].pubDate)}
                        </span>
                      </div>

                      <h3 className="text-2xl md:text-3xl font-light text-zen-50 mb-4">
                        {posts[0].title}
                      </h3>

                      <p className="text-zen-300 leading-relaxed mb-6">
                        {posts[0].description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        {posts[0].categories && posts[0].categories.slice(0, 3).map(category => (
                          <span
                            key={category}
                            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-zen-800/50 text-zen-300"
                          >
                            <Tag size={10} />
                            {category}
                          </span>
                        ))}
                        {posts[0].readTime && (
                          <span className="flex items-center gap-1 text-xs text-zen-400">
                            <Clock size={12} />
                            {posts[0].readTime}
                          </span>
                        )}
                      </div>

                      <motion.a
                        href={posts[0].link}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-2 glass-card px-6 py-3 rounded-full text-orange-400 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300"
                      >
                        Read full essay
                        <ArrowRight size={16} />
                      </motion.a>
                    </div>

                    <div className="lg:w-80">
                      <div className="glass-card p-6 rounded-2xl bg-zen-800/30">
                        <div className="aspect-square bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl flex items-center justify-center">
                          <div className="text-center text-zen-400">
                            <BookOpen size={48} className="mx-auto mb-2 text-orange-400" />
                            <p className="text-sm">Featured Essay</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other posts */}
            {posts.length > 1 && (
              <div className="grid md:grid-cols-2 gap-6">
                {posts.slice(1).map((post, index) => (
                  <motion.div
                    key={post.guid}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <motion.a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="block glass-card p-6 rounded-2xl h-full bg-gradient-to-br from-zen-800/20 to-zen-700/20 border border-zen-700/50 hover:border-zen-600/70 transition-all duration-300"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-zen-400">
                            {formatDate(post.pubDate)}
                          </span>
                          {post.readTime && (
                            <>
                              <span className="text-zen-600">•</span>
                              <span className="text-xs text-zen-400">
                                {post.readTime}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-lg font-medium text-zen-50 mb-3 leading-tight">
                          {post.title}
                        </h3>

                        <p className="text-sm text-zen-300 mb-4 leading-relaxed flex-1">
                          {truncateText(post.excerpt || post.description, 120)}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.categories && post.categories.slice(0, 2).map(category => (
                            <span
                              key={category}
                              className="px-2 py-1 rounded-full text-xs bg-zen-800/50 text-zen-400"
                            >
                              {category}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-orange-400 mt-auto">
                          <span>Read more</span>
                          <ArrowRight size={12} />
                        </div>
                      </div>
                    </motion.a>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {posts.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen size={48} className="mx-auto mb-4 text-zen-500" />
            <p className="text-zen-400">No posts found. Check back soon for new writing!</p>
          </motion.div>
        )}
      </div>
    </section>
  )
}