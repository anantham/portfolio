import bioData from '@/data/bioCards.json'
import bioLinksData from '@/data/bioLinks.json'
import type { LensId } from '@/lib/content'

export interface BioCard {
  id: string
  title: string
  summary: string
  images: string[]
}

interface RawBioCard {
  id: string
  title: string
  summary: string
  image?: string
  images?: string[]
}

interface BioDataset {
  defaultOrder: LensId[]
  cards: Record<LensId, RawBioCard[]>
}

const typedData = bioData as BioDataset

const FALLBACK_IMAGE = '/images/bio/speaker-events.jpg'

const normalizeBioCard = (card: RawBioCard): BioCard => {
  const images = [
    ...(Array.isArray(card.images) ? card.images : []),
    ...(card.image ? [card.image] : []),
  ]
    .map(value => value?.trim?.())
    .filter((value): value is string => Boolean(value))

  const uniqueImages = Array.from(new Set(images))

  return {
    id: card.id,
    title: card.title,
    summary: card.summary,
    images: uniqueImages.length > 0 ? uniqueImages : [FALLBACK_IMAGE],
  }
}

export const bioCards = Object.fromEntries(
  Object.entries(typedData.cards).map(([lens, cards]) => [
    lens,
    cards.map(normalizeBioCard),
  ])
) as Record<LensId, BioCard[]>
export const defaultBioOrder = typedData.defaultOrder
export const bioLinks: Array<{ phrase: string; href: string }> = bioLinksData

export function getRandomBioCard(lens: LensId): BioCard {
  const options = bioCards[lens]
  const index = Math.floor(Math.random() * options.length)
  return options[index]
}

export function getRandomBioCardImage(card: BioCard): string {
  const options = card.images.length > 0 ? card.images : [FALLBACK_IMAGE]
  const index = Math.floor(Math.random() * options.length)
  return options[index]
}
