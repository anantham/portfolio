// Site configuration and environment variables

const primaryEmail =
  process.env.NEXT_PUBLIC_EMAIL_ADDRESS ||
  process.env.NEXT_PUBLIC_EMAIL ||
  'adityaarpitha@gmail.com'

const bookingLink =
  process.env.NEXT_PUBLIC_BOOKING_LINK ||
  'https://calendar.app.google/ZNwQV86wJBg5LaWdA'

const upiId =
  process.env.NEXT_PUBLIC_UPI_ID ||
  'adityaarpitha@okicici'

const ethAddress =
  process.env.NEXT_PUBLIC_ETH_ADDRESS ||
  'adityaarpitha.eth'

const patreonUrl =
  process.env.NEXT_PUBLIC_PATREON_URL ||
  'https://patreon.com/adityaarpitha'

const parseFeatureFlag = (value: string | undefined) => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_NAME || "Aditya Arpitha",
  email: primaryEmail,
  location: process.env.NEXT_PUBLIC_LOCATION || "Building bridges between communities",

  // SEO
  title: "Aditya Arpitha | Building Bridges to Niche Subcultures",
  description: "A crafted place to meet niche subcultures with care—tools, essays, and rituals for building culture on purpose.",
  url: "https://adityaarpitha.com",

  // Social links
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "",
    github: process.env.NEXT_PUBLIC_GITHUB_URL || "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
    substack: process.env.NEXT_PUBLIC_SUBSTACK_URL || "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || "",
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || "",
  },

  // Contact
  contact: {
    email: primaryEmail,
    dm: process.env.NEXT_PUBLIC_DM_URL || "",
    booking: bookingLink,
  },

  // Projects
  projects: {
    lexion: {
      url: process.env.NEXT_PUBLIC_LEXION_URL || "",
      github: process.env.NEXT_PUBLIC_LEXION_GITHUB || "",
    },
    customTales: {
      url: process.env.NEXT_PUBLIC_CUSTOMTALES_URL || "",
    },
  },

  // Support
  support: {
    upi: upiId,
    eth: ethAddress,
    patreon: patreonUrl,
  },

  // Feature flags
  features: {
    tinyVaithyaBeta: parseFeatureFlag(process.env.NEXT_PUBLIC_TINY_VAITHYA_BETA),
  },

  // Content
  content: {
    substackRss: process.env.SUBSTACK_RSS_URL || "",
    youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID || "",
  },

  // Analytics
  analytics: {
    plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "",
  },
}

// Helper functions
export const hasLink = (url: string) => Boolean(url && url !== "")

export const getShareText = (text: string) =>
  encodeURIComponent(`${text} - ${siteConfig.url}`)

export const getThanksEmailDraft = () => {
  const subject = encodeURIComponent("Thank you!")
  const body = encodeURIComponent(`Hi ${siteConfig.name},

I wanted to reach out and thank you for your work on [specific thing that resonated].

[Personal note about what was valuable]

Keep building bridges!

Best,
[Your name]`)

  return `mailto:${siteConfig.contact.email}?subject=${subject}&body=${body}`
}

export default siteConfig
