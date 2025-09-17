import contentData from '@/data/content.json'
import writingData from '@/data/writing.json'

export type LensId = 'lw-math' | 'engineer' | 'embodied' | 'buddhist'

// Content types
export interface SiteContent {
  site: {
    tagline: string
    description: string
    quote: {
      text: string
      attribution: string | null
    }
  }
  hero: {
    title: {
      main: string
      highlight: string
    }
    buttons: {
      primary: {
        text: string
        action: string
      }
      secondary: {
        text: string
        action: string
      }
    }
  }
  lenses: {
    title: string
    subtitle: string
    archetypes: Array<{
      id: LensId
      title: string
      subtitle: string
      description: string
      tags: string[]
    }>
  }
  projects: {
    title: string
    subtitle: string
  }
  writing: {
    title: string
    subtitle: string
  }
  support: {
    title: string
    highlight: string
    subtitle: string
    closing: {
      title: string
      text: string
    }
  }
  physics: {
    dharmaWheel: {
      baseSpeed: number
      avoidanceDistance: number
      avoidanceStrength: number
      wanderStrength: number
      boundaryPadding: number
      opacity: number
      size: number
    }
  }
  lensMapping: Record<LensId, {
    projectOrder: string[]
    writingTags: string[]
    emphasize: string
  }>
}

export interface WritingPost {
  id: string
  title: string
  description: string
  pubDate: string
  author: string
  tags: string[]
  excerpt: string
  readTime: string
  featured: boolean
  lensRelevance: Record<LensId, number>
}

export interface WritingData {
  posts: WritingPost[]
}

// Content accessors
export const content: SiteContent = contentData as SiteContent
export const writing: WritingData = writingData as WritingData

// Lens-aware content functions
export function getWritingForLens(lensId: LensId | null, limit?: number): WritingPost[] {
  let posts = [...writing.posts]

  if (lensId) {
    // Sort by lens relevance score (higher = more relevant)
    posts.sort((a, b) => (b.lensRelevance[lensId] || 0) - (a.lensRelevance[lensId] || 0))
  } else {
    // Default: sort by date, featured first
    posts.sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1
      }
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    })
  }

  return limit ? posts.slice(0, limit) : posts
}

export function getProjectOrderForLens(lensId: LensId | null): string[] {
  if (!lensId) {
    return ['lexion', 'customtales', 'mapping-tpot'] // default order
  }
  return content.lensMapping[lensId]?.projectOrder || ['lexion', 'customtales', 'mapping-tpot']
}

export function getPhysicsConfig() {
  return content.physics.dharmaWheel
}

// Utility functions
export function hasTag(post: WritingPost, tags: string[]): boolean {
  return tags.some(tag => post.tags.includes(tag))
}

export function getLensEmphasis(lensId: LensId | null): string | null {
  if (!lensId) return null
  return content.lensMapping[lensId]?.emphasize || null
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}