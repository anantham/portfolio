'use client'

import dynamic from 'next/dynamic'
import { forwardRef } from 'react'

const GlobeImpl = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-black/80 animate-pulse rounded-2xl border border-white/10" />
  ),
}) as any

const GlobeClient = forwardRef<any, Record<string, unknown>>((props, ref) => {
  return <GlobeImpl {...props} ref={ref as any} />
})

GlobeClient.displayName = 'GlobeClient'

export default GlobeClient
