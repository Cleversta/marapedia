// app/about-developer/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About the Founder — Marapedia',
  description: 'Meet Marason Tleitu, the founder and developer of Marapedia, and the story behind why it was built.',
}

export default function AboutDeveloperPage() {
  return (
    <div className="min-h-screen bg-stone-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-50 to-amber-50 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-xs uppercase tracking-widest text-green-700 font-medium mb-3">
            The Person Behind Marapedia
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-green-950 mb-4 leading-tight">
            About the Founder
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">

        <section className="bg-white border border-gray-200 rounded-2xl p-8">
          <div className="mb-1">
            <h3 className="font-display text-xl font-bold text-gray-900">Marason Tleitu</h3>
            <p className="text-sm text-green-700 font-medium mt-0.5">Founder &amp; Developer of Marapedia</p>
          </div>

          <hr className="my-6 border-gray-100" />

          {/* Personal introduction */}
          <div className="mb-6">
            <h4 className="font-display font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
              <span>👋</span> Introduction
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              My name is Marason Tleitu. I&apos;m 25 years old, from the Mara community,
              currently based in Malaysia. I&apos;m a self-taught developer, building apps
              and websites for the Mara people in whatever time I can find outside my
              day-to-day life abroad.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              Being away from home made me think more, not less, about where I come from.
              In 2023, I wrote <strong className="text-gray-800">Mara Hlabu</strong>, a book
              collecting Mara song lyrics, and later turned it into a mobile app so anyone
              could carry the songs with them and read the lyrics on the go.
            </p>
            
              href="https://play.google.com/store/apps/details?id=com.marahlabu.marahlaapp&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm text-green-700 hover:text-green-800 font-medium transition-colors"
            >
              📱 Mara Hlabu on Google Play
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              Marapedia grew out of that same motivation: Mara Hlabu preserved the songs,
              and Marapedia expands that mission to history, language, stories, and culture
              — making sure it all has a home online that anyone, anywhere, can reach.
            </p>
          </div>

          <hr className="my-6 border-gray-100" />

          <div className="space-y-6">
            {[
              {
                emoji: '💡',
                title: 'The Idea',
                body: 'Marapedia began with a simple but powerful idea — to gather everything about the Mara people in one place and make it freely accessible to the world. Looking around, Marason noticed something missing: while the world was moving fast with technology and information, the Mara people did not yet have a dedicated digital space to call their own.',
              },
              {
                emoji: '🤝',
                title: 'Why Community?',
                body: "Preserving an entire people's heritage is far too great a task for one person to carry alone. No single individual could document all the songs, histories, poems, stories, and traditions of the Mara people. So Marapedia was built in the spirit of Wikipedia — a community-driven encyclopedia where every Mara person, wherever they are in the world, can contribute, edit, and grow the knowledge together.",
              },
              {
                emoji: '🎵',
                title: 'What We Are Preserving',
                body: 'The Mara people have a rich and unique culture — beautiful songs and hymns, poetry, histories of villages and clans, stories of leaders and community figures, and traditions that define who we are. Much of this exists only in the memories of our elders. Marapedia exists to capture all of it before it fades and give it a permanent home.',
              },
              {
                emoji: '🌍',
                title: 'Open to the World',
                body: 'Marapedia is written in four languages — Mara, English, Myanmar, and Mizo — so that not only our own community but the wider world can discover and appreciate who the Mara people are. This openness is intentional. The Mara people have a story worth telling, and the world deserves to hear it.',
              },
              {
                emoji: '🌱',
                title: 'Building for the Future',
                body: 'The deepest motivation behind Marapedia is the future. If we do not preserve our heritage in the digital world today, the next generation may never find it. Marapedia is being built so that tomorrow, a young Mara child anywhere in the world can open this encyclopedia and discover exactly who they are and where they come from.',
              },
            ].map(item => (
              <div key={item.title}>
                <h4 className="font-display font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                  <span>{item.emoji}</span> {item.title}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="mt-8 bg-green-50 border border-green-100 rounded-xl p-6">
            <p className="text-3xl text-green-600 leading-none mb-3">❝</p>
            <p className="text-sm text-green-800 italic leading-relaxed font-medium">
              Technology is moving fast. The Mara people deserve to be part of that world too — with our own history, our own songs, and our own voice preserved for every generation to come.
            </p>
            <p className="text-xs text-gray-400 font-semibold mt-3">
              — Marason Tleitu, Founder of Marapedia
            </p>
          </div>

          {/* Personal contact */}
          <hr className="my-6 border-gray-100" />
          <h4 className="font-display font-bold text-gray-900 mb-4">Get in Touch</h4>
          <div className="space-y-3">
            <a href="mailto:cleverstar02@gmail.com"
              className="flex items-center gap-3 text-sm text-gray-600 hover:text-green-700 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              cleverstar02@gmail.com
            </a>
            <a href="tel:0182159223"
              className="flex items-center gap-3 text-sm text-gray-600 hover:text-green-700 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              0182159223
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}
