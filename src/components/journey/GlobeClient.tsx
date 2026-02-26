'use client'

import dynamic from 'next/dynamic'
import { forwardRef, type ComponentType } from 'react'

type GlobeProps = Record<string, unknown>

const GlobeNoSSR = dynamic(
  () =>
    import('react-globe.gl').then((mod) => {
      const Globe = mod.default as ComponentType<any>
      const GlobeWithRef = forwardRef<any, GlobeProps>((props, ref) => <Globe {...props} ref={ref} />)
      GlobeWithRef.displayName = 'GlobeWithRef'
      return GlobeWithRef
    }),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-black" />,
  },
)

const GlobeClient = forwardRef<any, GlobeProps>((props, ref) => {
  return <GlobeNoSSR {...props} ref={ref} />
})

GlobeClient.displayName = 'GlobeClient'

export default GlobeClient
