import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Aditya Arpitha',
  description: 'Terms of service for adityaarpitha.com',
}

export default function TermsOfService() {
  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-zen-400 hover:text-zen-200 transition-colors text-sm mb-8 inline-block"
        >
          &larr; Back home
        </Link>

        <h1 className="text-4xl font-semibold text-zen-50 mb-8">Terms of Service</h1>

        <div className="space-y-6 text-zen-300 leading-relaxed">
          <p className="text-lg text-zen-200">
            By accessing or using this site, you agree to the following terms.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl text-zen-100 font-medium">Use at Your Own Risk</h2>
            <p>
              This site and all content, tools, and services provided are offered
              &ldquo;as is&rdquo; without warranties of any kind, either express or implied.
              You use this site at your own risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl text-zen-100 font-medium">Limitation of Liability</h2>
            <p>
              By using this site, you agree that the site owner shall not be held
              liable for any damages, losses, or issues arising from your use of
              the site, including but not limited to direct, indirect, incidental,
              consequential, or punitive damages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl text-zen-100 font-medium">Assumption of Risk</h2>
            <p>
              You acknowledge and agree that you assume full responsibility for
              your use of this site and any actions taken based on information
              or tools provided here.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl text-zen-100 font-medium">No Guarantees</h2>
            <p>
              We make no guarantees regarding the accuracy, completeness, or
              reliability of any content. The site may contain errors or become
              unavailable at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl text-zen-100 font-medium">Changes to Terms</h2>
            <p>
              These terms may be updated at any time without notice. Continued
              use of the site constitutes acceptance of any changes.
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
