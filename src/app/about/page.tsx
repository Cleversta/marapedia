import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Marapedia — The Free Mara Encyclopedia',
  description: 'Learn about Marapedia, a community-built encyclopedia preserving the history, culture, language, and traditions of the Mara people.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-50 to-amber-50 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-xs uppercase tracking-widest text-green-700 font-medium mb-3">
            Since 2026
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-green-950 mb-4 leading-tight">
            About Mara<span className="text-green-700">pedia</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
            A free, community-built encyclopedia dedicated to preserving and sharing the rich heritage of the Mara people.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-14">

        {/* What is Marapedia */}
        <section>
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📖</span> What is Marapedia?
          </h2>
          <div className="prose prose-stone max-w-none text-gray-600 leading-relaxed space-y-4">
            <p>
              Marapedia is a free, open encyclopedia built by and for the Mara community. Like Wikipedia, it is written collaboratively by volunteers who care about preserving knowledge — but Marapedia focuses specifically on the Mara people: their history, culture, language, songs, poems, famous figures, villages, and traditions.
            </p>
            <p>
              The Mara people have a rich and unique heritage that deserves to be documented, celebrated, and passed on to future generations. Marapedia exists to make that possible — in our own languages, on our own terms.
            </p>
            <p>
              All content on Marapedia is available in four languages: <strong>Mara, English, Myanmar, and Mizo</strong> — so our community can read and contribute in the language they are most comfortable with.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-green-50 border border-green-100 rounded-2xl p-8">
          <h2 className="font-display text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
            <span>🌿</span> Our Mission
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
            {[
              { icon: '🏛️', title: 'Preserve', desc: 'Document Mara history, culture, and traditions before they are lost to time.' },
              { icon: '🌍', title: 'Share', desc: 'Make Mara knowledge accessible to the whole community, wherever they are in the world.' },
              { icon: '🤝', title: 'Connect', desc: 'Build a living archive that connects Mara people across generations and geographies.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-green-900 mb-1">{item.title}</h3>
                <p className="text-sm text-green-700 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to contribute */}
        <section id="contribute">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>✍️</span> How to Contribute
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Marapedia is built by the community, for the community. Anyone can contribute — you do not need to be an expert. If you know something about Mara history, culture, a village, a person, a song, or a tradition, your knowledge is valuable here.
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

        {/* Content policy */}
        <section className="bg-amber-50 border border-amber-100 rounded-2xl p-8">
          <h2 className="font-display text-xl font-bold text-amber-900 mb-3 flex items-center gap-2">
            <span>📋</span> Content Guidelines
          </h2>
          <ul className="space-y-2 text-sm text-amber-800">
            {[
              'Articles should be factual and respectful of the Mara community.',
              'Content should be relevant to Mara history, culture, people, places, language, or traditions.',
              'Do not copy content from other sources without permission.',
              'All contributors are responsible for the accuracy of what they write.',
              'Editors and admins may edit or remove content that does not meet our guidelines.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section id="contact">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📬</span> Contact Us
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Have questions, suggestions, or want to report an issue? We'd love to hear from you. Marapedia is a community project and your feedback helps make it better.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="mailto:contact@marapedia.org"
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
                📧
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">Email</p>
                <p className="text-xs text-gray-400">contact@marapedia.org</p>
              </div>
            </a>
            <a
              href="https://facebook.com/marapedia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
                📘
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Facebook</p>
                <p className="text-xs text-gray-400">facebook.com/marapedia</p>
              </div>
            </a>
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