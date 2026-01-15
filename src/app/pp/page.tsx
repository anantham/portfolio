import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Aditya Arpitha',
  description: 'Privacy policy for adityaarpitha.com - your data stays on your device.',
}

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-zen-400 hover:text-zen-200 transition-colors text-sm mb-8 inline-block"
        >
          &larr; Back home
        </Link>

        <h1 className="text-4xl font-semibold text-zen-50 mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-zen-300 leading-relaxed">
          <p className="text-lg text-zen-200">
            Your privacy matters. This site is built with a local-first philosophy.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl text-zen-100 font-medium">Your Data Stays Yours</h2>
            <p>
              All data collected by this site is stored locally on your device.
              Nothing is sent to third-party servers. Your information remains
              under your control at all times.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl text-zen-100 font-medium">No Tracking</h2>
            <p>
              We do not use analytics services, tracking pixels, or any other
              mechanisms to monitor your behavior. Your visit here is private.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl text-zen-100 font-medium">Third-Party AI Services</h2>
            <p>
              If you choose to use AI features, you may optionally connect services
              like OpenRouter or OpenAI by providing your own API key. This is
              entirely opt-in. By default, the system is designed to work with
              local models that run on your device.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl text-zen-100 font-medium">No Commercial Use</h2>
            <p>
              This is a personal site with no commercial purpose. Your data is
              never sold, shared, or monetized in any way.
            </p>
          </section>

          <div className="pt-8 border-t border-zen-800 text-zen-500 text-sm">
            <p>Last updated: January 2025</p>
          </div>
        </div>
      </div>
    </main>
  )
}
