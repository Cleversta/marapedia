// app/about/page.tsx
import type { Metadata } from 'next'

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
          <div className="text-gray-600 leading-relaxed space-y-4">
            <p>
              Marapedia is a free, open encyclopedia built by and for the Mara community. Like Wikipedia, it is written collaboratively by volunteers who care about preserving knowledge — but Marapedia focuses specifically on the Mara people: their history, culture, language, songs, poems, famous figures, villages, and traditions.
            </p>
            <p>
              The Mara people have a rich and unique heritage that deserves to be documented, celebrated, and passed on to future generations. Marapedia exists to make that possible — in our own languages, on our own terms.
            </p>
            <p>
              All content on Marapedia is available in four languages:{' '}
              <strong className="text-gray-900">Mara, English, Myanmar, and Mizo</strong>{' '}
              — so our community can read and contribute in the language they are most comfortable with.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-green-50 border border-green-100 rounded-2xl p-8">
          <h2 className="font-display text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
            <span>🌿</span> Our Mission
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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

        {/* How It Works */}
        <section>
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>⚙️</span> How It Works
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Marapedia works just like Wikipedia — anyone can read, and registered members can write and edit. Here is a simple overview of how everything works.
          </p>
          <div className="space-y-4">
            {[
              {
                icon: '👁️',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                iconColor: 'text-blue-500',
                title: 'Reading Articles',
                points: [
                  'No account is needed to read any article on Marapedia.',
                  'All articles are freely accessible to anyone in the world.',
                  'Browse by category — History, Songs, Poems, People, Places, Culture, and more.',
                  'Use the search bar to find any topic quickly.',
                  'Switch between Mara, English, Myanmar, and Mizo on any article.',
                ],
              },
              {
                icon: '✍️',
                bg: 'bg-green-50',
                border: 'border-green-100',
                iconColor: 'text-green-600',
                title: 'Writing & Contributing',
                points: [
                  'Create a free account to start contributing.',
                  'Write new articles using our simple editor — no technical skills needed.',
                  'Choose the category and language for your article.',
                  'Add a title, content, images, and a source link if available.',
                  'Submit for review. Once approved by an editor, it goes live for everyone.',
                ],
              },
              {
                icon: '🌐',
                bg: 'bg-amber-50',
                border: 'border-amber-100',
                iconColor: 'text-amber-500',
                title: 'Multilingual Support',
                points: [
                  'Every article can have translations in Mara, English, Myanmar, and Mizo.',
                  'If an article exists in one language, you can add a translation in another.',
                  'Readers can switch languages on any article with a single click.',
                  'This ensures the Mara community anywhere in the world can read in their preferred language.',
                ],
              },
              {
                icon: '✅',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
                iconColor: 'text-emerald-600',
                title: 'Review & Quality',
                points: [
                  'All new articles go through a review process before being published.',
                  'Editors check that content is accurate, respectful, and relevant to the Mara community.',
                  'Once approved, articles are published and visible to all readers.',
                  'Existing articles can be improved and updated by the community at any time.',
                ],
              },
              {
                icon: '🎵',
                bg: 'bg-purple-50',
                border: 'border-purple-100',
                iconColor: 'text-purple-500',
                title: 'Songs, Poems & Special Content',
                points: [
                  'Marapedia has dedicated formats for songs and poems.',
                  'Song lyrics are displayed verse-by-verse with singer and songwriter credit.',
                  'You can tag song type — Worship, Hymn, Love Song, and more.',
                  'Poems are displayed with elegant typography suited for reading.',
                  'Together, these make Marapedia a living archive of Mara oral tradition.',
                ],
              },
            ].map(card => (
              <div key={card.title} className={`${card.bg} border ${card.border} rounded-xl p-5`}>
                <h3 className="font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>{card.icon}</span> {card.title}
                </h3>
                <ul className="space-y-2">
                  {card.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                      <span className={`${card.iconColor} mt-0.5 flex-shrink-0`}>✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Content Guidelines */}
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
            <a href="mailto:marasontleitu@gmail.com"
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl flex-shrink-0">📧</div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">Email</p>
                <p className="text-xs text-gray-400">marasontleitu@gmail.com</p>
              </div>
            </a>
            <a href="https://www.facebook.com/profile.php?id=100092171450260" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">📘</div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Facebook</p>
                <p className="text-xs text-gray-400">facebook.com/Marapedia</p>
              </div>
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}