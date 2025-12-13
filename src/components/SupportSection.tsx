'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Share2,
  Heart,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  IndianRupee,
  Coins,
  Twitter,
  MessageCircle
} from 'lucide-react'
import { siteConfig, getThanksEmailDraft, getShareText, hasLink } from '@/lib/config'

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
        label: 'Share on Twitter',
        type: 'link',
        value: `https://twitter.com/intent/tweet?text=${getShareText('Found this thoughtful portfolio exploring niche subcultures and contemplative practice')}`,
        icon: Twitter
      },
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
        label: 'Send thanks email',
        type: 'email',
        value: getThanksEmailDraft(),
        icon: Heart
      },
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
    icon: Coins,
    color: 'text-dharma-400',
    gradient: 'from-dharma-500/20 to-yellow-500/20',
    actions: [
      ...(hasLink(siteConfig.support.upi) ? [{
        label: 'Pay via UPI',
        type: 'link' as const,
        value: `upi://pay?pa=${encodeURIComponent(siteConfig.support.upi)}&pn=${encodeURIComponent(siteConfig.name)}&cu=INR`,
        icon: IndianRupee
      }, {
        label: 'Copy UPI ID',
        type: 'copy' as const,
        value: siteConfig.support.upi,
        icon: Copy
      }] : []),
      ...(hasLink(siteConfig.support.eth) ? [{
        label: 'ETH Address',
        type: 'copy' as const,
        value: siteConfig.support.eth,
        icon: Coins
      }] : []),
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
    description: 'Schedule a conversation about collaboration, life coaching, mentorship, or just to connect.',
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
          <h2 className="text-4xl md:text-5xl font-light text-zen-50 mb-6">
            Want to <span className="text-dharma-400">support</span> this work?
          </h2>
          <p className="text-xl text-zen-300 max-w-3xl mx-auto">
            Signal boost my creations in your network, send me a heartfelt message, support my financial slack, or jump on a call to chat. I appreciate all forms of assistance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportOptions.map((option, index) => {
            const Icon = option.icon

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`
                    glass-card p-6 rounded-2xl h-full
                    bg-gradient-to-br ${option.gradient}
                    border border-zen-700/50 hover:border-zen-600/70
                    transition-all duration-300
                  `}
                >
                  <div className="flex flex-col h-full">
                    <div className="text-center mb-6">
                      <div className={`p-4 rounded-xl bg-zen-800/50 inline-block mb-4 ${option.color}`}>
                        <Icon size={28} />
                      </div>

                      <h3 className="text-xl font-medium text-zen-50 mb-2">
                        {option.title}
                      </h3>

                      <p className="text-sm text-zen-400 mb-3 font-medium">
                        {option.subtitle}
                      </p>

                      <p className="text-sm text-zen-300 leading-relaxed">
                        {option.description}
                      </p>
                    </div>

                    <div className="mt-auto space-y-2">
                      {option.actions.map((action, actionIndex) => {
                        const ActionIcon = action.icon || ExternalLink
                        const isCopied = copiedValue === action.value

                        return (
                          <motion.button
                            key={actionIndex}
                            onClick={() => handleAction(action)}
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
                              <>
                                <Check size={16} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <ActionIcon size={16} />
                                {action.label}
                              </>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="glass-card p-8 rounded-2xl bg-gradient-to-r from-dharma-500/10 to-zen-600/10 border border-dharma-500/20">
            <h3 className="text-2xl font-light text-zen-50 mb-4">
              Building in the open
            </h3>
            <p className="text-zen-300 max-w-2xl mx-auto leading-relaxed">
              It is important that we co-create, hold each other responsible and stay in relation to each other. We are all in this together so I would love to cultivate a thriving community.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
