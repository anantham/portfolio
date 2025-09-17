// Site configuration and environment variables

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_NAME || "Aditya Arpitha",
  email: process.env.NEXT_PUBLIC_EMAIL_ADDRESS || "hello@adityaarpitha.com",
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
    email: process.env.NEXT_PUBLIC_EMAIL_ADDRESS || "",
    dm: process.env.NEXT_PUBLIC_DM_URL || "",
    booking: process.env.NEXT_PUBLIC_BOOKING_LINK || "",
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
    upi: process.env.NEXT_PUBLIC_UPI_ID || "",
    eth: process.env.NEXT_PUBLIC_ETH_ADDRESS || "",
    patreon: process.env.NEXT_PUBLIC_PATREON_URL || "",
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