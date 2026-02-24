'use client'

import { forwardRef, useEffect, useState } from 'react'

const GlobeClient = forwardRef<any, Record<string, unknown>>((props, ref) => {
  const [Globe, setGlobe] = useState<any>(null)

  useEffect(() => {
    import('react-globe.gl').then((mod) => setGlobe(() => mod.default))
  }, [])

  if (!Globe) {
    return <div className="h-full w-full bg-black" />
  }

  return <Globe {...props} ref={ref} />
})

GlobeClient.displayName = 'GlobeClient'

export default GlobeClient
