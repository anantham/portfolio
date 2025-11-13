import bioData from '@/data/bioCards.json'
import bioLinksData from '@/data/bioLinks.json'
import type { LensId } from '@/lib/content'

export interface BioCard {
  id: string
  title: string
  summary: string
  image: string
}

interface BioDataset {
  defaultOrder: LensId[]
  cards: Record<LensId, BioCard[]>
}

const typedData = bioData as BioDataset

export const bioCards = typedData.cards
export const defaultBioOrder = typedData.defaultOrder
export const bioLinks: Array<{ phrase: string; href: string }> = bioLinksData

export function getRandomBioCard(lens: LensId): BioCard {
  const options = bioCards[lens]
  const index = Math.floor(Math.random() * options.length)
  return options[index]
}
