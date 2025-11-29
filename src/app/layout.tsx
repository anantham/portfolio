import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'
import WanderingDharmaWheel from '@/components/WanderingDharmaWheel'
import CircadianBackground from '@/components/CircadianBackground'
import AtmosphereDebugPanel from '@/components/AtmosphereDebugPanel'
import TinyVaithya from '@/components/TinyVaithya'
import { LensProvider } from '@/contexts/LensContext'
import { AtmosphereProvider } from '@/contexts/AtmosphereContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aditya Arpitha | Building Bridges to Niche Subcultures',
  description: 'A crafted place to meet niche subcultures with care—tools, essays, and rituals for building culture on purpose.',
  keywords: ['portfolio', 'design', 'philosophy', 'dharma', 'culture', 'tools'],
  authors: [{ name: 'Aditya Arpitha' }],
  openGraph: {
    title: 'Aditya Arpitha | Building Bridges to Niche Subcultures',
    description: 'A crafted place to meet niche subcultures with care—tools, essays, and rituals for building culture on purpose.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aditya Arpitha | Building Bridges to Niche Subcultures',
    description: 'A crafted place to meet niche subcultures with care—tools, essays, and rituals for building culture on purpose.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#202124',
}

// Force dynamic rendering to prevent SSG issues with client-side contexts
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zen-900 text-zen-50 antialiased`}>
        <AtmosphereProvider>
          <LensProvider>
            <div className="min-h-screen relative">
              {/* Time-aware atmospheric background */}
              <CircadianBackground />
              {/* Wandering dharma wheel in background */}
              <WanderingDharmaWheel />
              {/* Tiny Vaithya mascot - toggle with Alt+V */}
              <TinyVaithya />
              {children}
              <Footer />
              {/* Debug panel - toggle with Alt+D */}
              <AtmosphereDebugPanel />
            </div>
          </LensProvider>
        </AtmosphereProvider>
      </body>
    </html>
  )
}