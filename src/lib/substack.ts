// Substack RSS feed utilities

export interface SubstackPost {
  title: string
  link: string
  description: string
  pubDate: string
  guid: string
  author?: string
  categories?: string[]
  excerpt: string
  readTime?: string
}

// For development/demo purposes, let's create some sample posts
// In production, you would fetch these from your actual Substack RSS feed
export const samplePosts: SubstackPost[] = [
  {
    title: "The Noble Truths in Software Development",
    link: "https://adityasdao.substack.com/p/noble-truths-software",
    description: "Exploring how the Four Noble Truths apply to our relationship with technology and building software that serves rather than enslaves.",
    pubDate: "2024-09-15T10:00:00.000Z",
    guid: "post-1",
    author: "Aditya Arpitha",
    categories: ["Buddhism", "Technology", "Philosophy"],
    excerpt: "The First Noble Truth tells us that suffering exists. In software development, this manifests as technical debt, feature creep, and the endless cycle of build-ship-fix...",
    readTime: "8 min read"
  },
  {
    title: "Building Bridges Between LessWrong and Buddhist Communities",
    link: "https://adityasdao.substack.com/p/bridges-rationalist-buddhist",
    description: "On finding common ground between rationalist epistemology and contemplative wisdom traditions.",
    pubDate: "2024-09-08T14:30:00.000Z",
    guid: "post-2",
    author: "Aditya Arpitha",
    categories: ["Rationality", "Buddhism", "Community"],
    excerpt: "Both traditions share a commitment to seeing reality clearly, though they approach this goal through different methods. The rationalist asks 'What is true?' while the Buddhist asks 'What is the nature of mind?'",
    readTime: "12 min read"
  },
  {
    title: "The Art of Crafting Digital Rituals",
    link: "https://adityasdao.substack.com/p/digital-rituals",
    description: "How we can create meaningful, embodied practices in our increasingly digital lives.",
    pubDate: "2024-09-01T09:15:00.000Z",
    guid: "post-3",
    author: "Aditya Arpitha",
    categories: ["Ritual", "Technology", "Embodiment"],
    excerpt: "A ritual is a container for transformation. In the digital realm, we need new containers—interfaces, interactions, and experiences that honor both efficiency and the sacred...",
    readTime: "6 min read"
  }
]

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

// In a real implementation, you would fetch from the RSS feed
export async function fetchSubstackPosts(): Promise<SubstackPost[]> {
  // For now, return sample data
  // In production, you would implement RSS parsing here
  return new Promise((resolve) => {
    setTimeout(() => resolve(samplePosts), 100)
  })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}