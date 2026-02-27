import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import journeyEvents from '@/data/journeyEvents.json';

const CesiumJourneyExperience = dynamic(
  () => import('@/components/journey/CesiumJourneyExperience'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Journey (Cesium) | Aditya Arpitha',
  description: '3D globe-to-terrain journey visualization with Cesium.',
};

export default function JourneyCesiumPage() {
  return (
    <div className="h-screen w-screen">
      <Suspense fallback={<div className="h-full w-full bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading 3D Globe...</div>
      </div>}>
        <CesiumJourneyExperience events={journeyEvents} />
      </Suspense>
    </div>
  );
}
