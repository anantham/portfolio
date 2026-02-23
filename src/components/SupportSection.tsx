'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2,
  Heart,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  MessageCircle
} from 'lucide-react'
import { siteConfig, hasLink } from '@/lib/config'

type SupportMethod = 'share' | 'thank' | 'donate' | 'book' | 'boost'

interface SupportOption {
  id: SupportMethod
  title: string
  subtitle: string
  description: string
  icon: React.ComponentType<any>
  color: string
  gradient: string
  actions: Array<{
    label: string
    type: 'link' | 'copy' | 'email'
    value: string
    icon?: React.ComponentType<any>
  }>
}

const supportOptions: SupportOption[] = [
  {
    id: 'share',
    title: 'Share',
    subtitle: 'Spread the word',
    description: 'Help others discover this work by sharing with your network.',
    icon: Share2,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    actions: [
      {
        label: 'Copy link',
        type: 'copy',
        value: siteConfig.url
      }
    ]
  },
  {
    id: 'thank',
    title: 'Thank Me',
    subtitle: 'Send gratitude',
    description: 'A simple thank you message can make a big difference.',
    icon: Heart,
    color: 'text-rose-400',
    gradient: 'from-rose-500/20 to-pink-500/20',
    actions: [
      {
        label: 'DM on Telegram',
        type: 'link',
        value: 'https://t.me/everythingisrelative',
        icon: MessageCircle
      }
    ]
  },
  {
    id: 'donate',
    title: 'Donate',
    subtitle: 'Financial support',
    description: 'Help sustain this work through direct financial support.',
    icon: ExternalLink,
    color: 'text-dharma-400',
    gradient: 'from-dharma-500/20 to-yellow-500/20',
    actions: [
      ...(hasLink(siteConfig.support.patreon) ? [{
        label: 'Patreon',
        type: 'link' as const,
        value: siteConfig.support.patreon,
        icon: ExternalLink
      }] : [])
    ]
  },
  {
    id: 'book',
    title: 'Book Time',
    subtitle: 'Meet directly',
    description: 'Book time with me. Come with a question, a project, or nothing at all.',
    icon: Calendar,
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
    actions: [
      {
        label: 'Book time',
        type: 'link',
        value: siteConfig.contact.booking,
        icon: Calendar
      }
    ]
  }
]

function SupportCard({
  option,
  copiedValue,
  onAction
}: {
  option: SupportOption
  copiedValue: string | null
  onAction: (action: SupportOption['actions'][0]) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const Icon = option.icon

  const handleHoverStart = () => {
    timerRef.current = setTimeout(() => setIsHovered(true), 350)
  }

  const handleHoverEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsHovered(false)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <motion.div
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      className={`
        glass-card p-6 rounded-2xl h-full
        bg-gradient-to-br ${option.gradient}
        border border-zen-700/50 hover:border-zen-600/70
        transition-colors duration-300 cursor-default
      `}
    >
      <div className="flex flex-col items-center">
        <div className={`p-4 rounded-xl bg-zen-800/50 inline-block mb-4 ${option.color}`}>
          <Icon size={28} />
        </div>

        <h3 className="text-xl font-medium text-zen-50 mb-4">
          {option.title}
        </h3>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="overflow-hidden w-full text-center"
            >
              <p className="text-sm text-zen-400 mb-2 font-medium">
                {option.subtitle}
              </p>
              <p className="text-sm text-zen-300 leading-relaxed mb-4">
                {option.description}
              </p>

              {option.actions.map((action, actionIndex) => {
                const ActionIcon = action.icon || ExternalLink
                const isCopied = copiedValue === action.value

                return (
                  <motion.button
                    key={actionIndex}
                    onClick={() => onAction(action)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                      text-sm font-medium transition-all duration-200
                      ${action.type === 'copy'
                        ? 'glass-card border border-zen-600/30 hover:border-zen-500/50 text-zen-300'
                        : `glass-card border border-zen-600/30 hover:border-${option.color.split('-')[1]}-500/50 ${option.color}`
                      }
                    `}
                  >
                    {action.type === 'copy' && isCopied ? (
                      <><Check size={16} />Copied!</>
                    ) : (
                      <><ActionIcon size={16} />{action.label}</>
                    )}
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function SupportSection() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      setTimeout(() => setCopiedValue(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleAction = (action: SupportOption['actions'][0]) => {
    switch (action.type) {
      case 'link':
        if (action.value.startsWith('upi:')) {
          window.location.href = action.value
          break
        }
        window.open(action.value, '_blank', 'noopener,noreferrer')
        break
      case 'copy':
        handleCopy(action.value)
        break
      case 'email':
        // Use a temporary anchor to open mailto in new context without replacing current page
        const emailLink = document.createElement('a')
        emailLink.href = action.value
        emailLink.target = '_blank'
        emailLink.rel = 'noopener noreferrer'
        emailLink.click()
        break
    }
  }

  return (
    <section id="support-section" className="py-20 px-4 bg-gradient-to-b from-transparent to-zen-900/50">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-zen-50">
            <span className="text-dharma-400">Dana</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <SupportCard
                option={option}
                copiedValue={copiedValue}
                onAction={handleAction}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
        </motion.div>
      </div>
    </section>
  )
}
