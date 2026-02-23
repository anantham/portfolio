import type { Metadata } from 'next'
import { Inter, Fraunces, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import RouteChrome from '@/components/RouteChrome'
import { LensProvider } from '@/contexts/LensContext'
import { AtmosphereProvider } from '@/contexts/AtmosphereContext'
import { OrientationProvider } from '@/contexts/OrientationContext'

const inter = Inter({ subsets: ['latin'] })

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Aditya Arpitha | Building Bridges between Niche Subcultures',
  description: 'A crafted place to meet niche subcultures with care—tools, essays, and rituals for building culture on purpose.',
  keywords: ['portfolio', 'design', 'philosophy', 'dharma', 'culture', 'tools'],
  authors: [{ name: 'Aditya Arpitha' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Aditya Arpitha | Building Bridges between Niche Subcultures',
    description: 'A crafted place to meet niche subcultures with care—tools, essays, and rituals for building culture on purpose.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aditya Arpitha | Building Bridges between Niche Subcultures',
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
      <body className={`${inter.className} ${fraunces.variable} ${cormorant.variable} bg-zen-900 text-zen-50 antialiased`}>
        <AtmosphereProvider>
          <LensProvider>
            <OrientationProvider>
              <div className="min-h-screen relative">
                <RouteChrome>{children}</RouteChrome>
              </div>
            </OrientationProvider>
          </LensProvider>
        </AtmosphereProvider>
      </body>
    </html>
  )
}
