import type { Metadata } from 'next'
import { Suspense } from 'react'
import JourneyExperience from '@/components/journey/JourneyExperience'

export const metadata: Metadata = {
  title: 'Journey | Aditya Arpitha',
  description: 'Scroll-driven globe timeline tracing lineage, movement, and milestones.',
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black" />}>
      <JourneyExperience />
    </Suspense>
  )
}
