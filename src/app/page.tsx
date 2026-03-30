import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { timeAgo, getPreferredTranslation } from '@/lib/utils'
import ArticleCard from '@/components/ArticleCard'
import type { Article } from '@/types'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Marapedia — The Free Mara Encyclopedia',
  description: 'A community-built encyclopedia preserving the history, culture, language, songs, and traditions of the Mara people — from Maraland to the world.',
  openGraph: {
    title: 'Marapedia — The Free Mara Encyclopedia',
    description: 'A community-built encyclopedia for the Mara people.',
    url: 'https://marapedia.org',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

const ARTICLE_FIELDS = `
  id, slug, category, status, featured, thumbnail_url, view_count, created_at, updated_at,
  profiles(id, username, avatar_url, role, created_at),
  article_translations(id, article_id, language, title, excerpt, content)
`

async function getFeaturedArticle(): Promise<Article | null> {
  const { data } = await supabase
    .from('articles')
    .select(ARTICLE_FIELDS)
    .eq('status', 'published')
    .eq('featured', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  return data as unknown as Article | null
}

async function getRecentArticles(): Promise<Article[]> {
  const { data } = await supabase
    .from('articles')
    .select(ARTICLE_FIELDS)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(6)
  return (data ?? []) as unknown as Article[]
}

async function getMostViewedArticles(): Promise<Article[]> {
  const { data } = await supabase
    .from('articles')
    .select(ARTICLE_FIELDS)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(6)
  return (data ?? []) as unknown as Article[]
}

async function getStats() {
  const [{ count: articleCount }, { count: userCount }] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])
  return { articles: articleCount ?? 0, users: userCount ?? 0 }
}

export default async function HomePage() {
  const [featured, recent, mostViewed, stats] = await Promise.all([
    getFeaturedArticle(),
    getRecentArticles(),
    getMostViewedArticles(),
    getStats(),
  ])

  const featuredTranslation = getPreferredTranslation(featured?.article_translations)

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Marapedia',
            url: 'https://marapedia.org',
            description: 'A community-built encyclopedia for the Mara people.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://marapedia.org/search?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#0f2d1f] border-b border-green-900">
        {/* Subtle dot texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-green-400 font-semibold mb-4">
              The Free Mara Encyclopedia
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-5 leading-tight tracking-tight">
              Preserving Mara<br />History & Culture
            </h1>
            <p className="text-green-200/70 text-base md:text-lg mb-8 leading-relaxed max-w-lg mx-auto">
              A community-built encyclopedia for the Mara people — from Maraland to the world.
              Share history, songs, stories, and traditions.
            </p>
            <div className="flex justify-center flex-wrap gap-2 mb-10">
              {['Mara', 'English', 'Myanmar', 'Mizo'].map(lang => (
                <span key={lang} className="text-xs px-3.5 py-1.5 border border-green-700 rounded-full text-green-300 bg-green-950/60 font-medium">
                  {lang}
                </span>
              ))}
            </div>
            {/* Stats */}
            <div className="inline-flex divide-x divide-green-800 border border-green-800 rounded-2xl bg-green-950/60 overflow-hidden shadow-lg shadow-black/30">
              {[
                { value: stats.articles.toLocaleString(), label: 'Articles' },
                { value: stats.users.toLocaleString(), label: 'Contributors' },
                { value: '4', label: 'Languages' },
              ].map(({ value, label }) => (
                <div key={label} className="px-8 py-4">
                  <div className="font-display text-2xl font-bold text-green-400">{value}</div>
                  <div className="text-xs text-green-600 mt-0.5 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* ── Featured article ── */}
        {featured && featuredTranslation && (
          <div className="mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700 mb-5 text-center">
              Featured Article
            </h2>
            <Link href={`/articles/${featured.slug}`} className="block group max-w-2xl mx-auto">
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-300">
                {featured.thumbnail_url && (
                  <div className="h-64 overflow-hidden">
                    <img
                      src={featured.thumbnail_url}
                      alt={featuredTranslation.title ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-7 text-center">
                  <span className="inline-block text-xs px-3 py-1 bg-green-50 text-green-700 rounded-full font-semibold mb-4 border border-green-100">
                    ✦ Featured
                  </span>
                  <h3 className="font-display text-xl font-bold mb-3 group-hover:text-green-800 transition-colors leading-snug text-gray-900">
                    {featuredTranslation.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                    {featuredTranslation.excerpt ?? (featuredTranslation.content ?? '').replace(/<[^>]*>/g, '').substring(0, 200)}...
                  </p>
                  <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-center gap-3">
                    <span>By {featured.profiles?.username ?? 'Anonymous'}</span>
                    <span>·</span>
                    <span>{timeAgo(featured.updated_at ?? featured.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ── Two-column feeds ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-lg font-semibold mb-4 pb-2 border-b-2 border-green-700 text-green-900">
              Recent Articles
            </h2>
            {recent.length === 0 ? (
              <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 mb-4 text-sm">No articles yet. Be the first to contribute!</p>
                <Link
                  href="/articles/create"
                  className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors">
                  Write First Article
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recent.map(article => <ArticleCard key={article.id} article={article} />)}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold mb-4 pb-2 border-b-2 border-green-700 text-green-900">
              Most Viewed
            </h2>
            {mostViewed.length === 0 ? (
              <p className="text-sm text-gray-400">No articles yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {mostViewed.map(article => <ArticleCard key={article.id} article={article} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}