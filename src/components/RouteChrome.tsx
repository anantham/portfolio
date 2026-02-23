'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import Footer from '@/components/Footer'
import WanderingDharmaWheel from '@/components/WanderingDharmaWheel'
import CircadianBackground from '@/components/CircadianBackground'
import AtmosphereDebugPanel from '@/components/AtmosphereDebugPanel'
import TinyVaithya from '@/components/TinyVaithya'
import { siteConfig } from '@/lib/config'

const immersivePrefixes = ['/journey']

export default function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isImmersive = immersivePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  return (
    <>
      {!isImmersive && siteConfig.features.circadianBackgroundBeta ? <CircadianBackground /> : null}
      {!isImmersive ? <WanderingDharmaWheel /> : null}
      {!isImmersive && siteConfig.features.tinyVaithyaBeta ? <TinyVaithya /> : null}
      {children}
      {!isImmersive ? <Footer /> : null}
      {!isImmersive && siteConfig.features.atmosphereDebugPanelBeta ? (
        <AtmosphereDebugPanel />
      ) : null}
    </>
  )
}
