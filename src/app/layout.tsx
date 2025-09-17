import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'
import WanderingDharmaWheel from '@/components/WanderingDharmaWheel'

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
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#202124',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zen-900 text-zen-50 antialiased`}>
        <div className="min-h-screen zen-gradient">
          {/* Wandering dharma wheel in background */}
          <WanderingDharmaWheel />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  )
}