// app/how-to-contribute/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How to Contribute — Marapedia',
  description: 'Learn how to contribute articles, translations, and knowledge to Marapedia, the free Mara encyclopedia.',
}

export default function HowToContributePage() {
  return (
    <div className="min-h-screen bg-stone-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-50 to-amber-50 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-xs uppercase tracking-widest text-green-700 font-medium mb-3">
            Get Involved
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-green-950 mb-4 leading-tight">
            How to Contribute
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
            Marapedia is built by the community, for the community. Anyone can contribute — you do not need to be an expert.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-14">

        {/* Steps */}
        <section>
          <p className="text-gray-600 leading-relaxed mb-6">
            If you know something about Mara history, culture, a village, a person, a song, or a tradition, your knowledge is valuable here.
          </p>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Create an account', desc: 'Register for a free account to start contributing.', href: '/register', cta: 'Register now' },
              { step: '2', title: 'Write an article', desc: 'Use our editor to write about any topic related to the Mara people. You can write in any of our four supported languages.', href: '/articles/create', cta: 'Start writing' },
              { step: '3', title: 'Get reviewed', desc: 'New articles are reviewed by our editors before publishing to ensure quality and accuracy.' },
              { step: '4', title: 'Keep it growing', desc: 'Edit and improve existing articles, add translations, and help build the encyclopedia together.' },
            ].map(item => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  {item.href && (
                    <Link href={item.href} className="inline-block mt-2 text-xs text-green-700 font-medium hover:underline">
                      {item.cta} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 border-t border-gray-200">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">
            Ready to contribute?
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            Join the community and help preserve Mara heritage for future generations.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/register"
              className="px-6 py-3 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 active:scale-95 transition-all shadow-sm shadow-green-900/20">
              Create Account
            </Link>
            <Link href="/"
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 active:scale-95 transition-all">
              Browse Articles
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
