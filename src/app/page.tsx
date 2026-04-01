import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { timeAgo, getPreferredTranslation } from '@/lib/utils'
import ArticleCard from '@/components/ArticleCard'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/config'
import type { Article } from '@/types'

export const revalidate = 600

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
}

const ARTICLE_FIELDS = `
  id, slug, category, status, featured, thumbnail_url, view_count, created_at, updated_at,
  profiles(id, username, avatar_url, role, created_at),
  article_translations(id, article_id, language, title, excerpt, content)
`

const getFeaturedArticle = unstable_cache(
  async (): Promise<Article | null> => {
    const { data } = await supabase
      .from('articles')
      .select(ARTICLE_FIELDS)
      .eq('status', 'published')
      .eq('featured', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    return data as unknown as Article | null
  },
  ['home-featured'],
  { revalidate: 600, tags: ['article'] }
)

const getRecentArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const { data } = await supabase
      .from('articles')
      .select(ARTICLE_FIELDS)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(6)
    return (data ?? []) as unknown as Article[]
  },
  ['home-recent'],
  { revalidate: 600, tags: ['article'] }
)

const getMostViewedArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const { data } = await supabase
      .from('articles')
      .select(ARTICLE_FIELDS)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(6)
    return (data ?? []) as unknown as Article[]
  },
  ['home-most-viewed'],
  { revalidate: 600, tags: ['article'] }
)

const getStats = unstable_cache(
  async () => {
    const [{ count: articleCount }, { count: userCount }] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ])
    return { articles: articleCount ?? 0, users: userCount ?? 0 }
  },
  ['home-stats'],
  { revalidate: 600, tags: ['article'] }
)

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
            name: SITE_NAME,
            url: SITE_URL,
            description: SITE_DESCRIPTION,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <div className="bg-gradient-to-br from-green-50 to-amber-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-widest text-green-700 font-medium mb-3">
              The Free Mara People Encyclopedia
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-green-950 mb-4 leading-tight">
              Preserving Mara<br />History & Culture
            </h1>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              A community-built encyclopedia for the Mara people — from Maraland to the world.
              Share history, songs, stories, and traditions.
            </p>
            <div className="flex justify-center flex-wrap gap-2 mb-8">
              {['Mara', 'English', 'Myanmar', 'Mizo'].map(lang => (
                <span key={lang} className="text-xs px-3 py-1 border border-green-200 rounded-full text-green-700 bg-white">
                  {lang}
                </span>
              ))}
            </div>
            <div className="flex justify-center gap-8">
              <div>
                <div className="font-display text-2xl font-bold text-green-700">{stats.articles.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Articles</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-green-700">{stats.users.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Contributors</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-green-700">4</div>
                <div className="text-xs text-gray-500">Languages</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {featured && featuredTranslation && (
          <div className="mb-10">
            <h2 className="font-display text-lg font-semibold mb-4 pb-2 border-b border-gray-200 text-center">
              Featured Article
            </h2>
            <Link href={`/articles/${featured.slug}`} className="block group max-w-2xl mx-auto">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-green-300 hover:shadow-sm transition-all">
                {featured.thumbnail_url && (
                  <div className="h-56 overflow-hidden">
                    <img
                      src={featured.thumbnail_url}
                      alt={featuredTranslation.title ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5 text-center">
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Featured</span>
                  <h3 className="font-display text-xl font-bold mt-2 mb-2 group-hover:text-green-800 transition-colors">
                    {featuredTranslation.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                    {featuredTranslation.excerpt ?? (featuredTranslation.content ?? '').replace(/<[^>]*>/g, '').substring(0, 200)}...
                  </p>
                  <div className="mt-3 text-xs text-gray-400 flex justify-center gap-4">
                    <span>By {featured.profiles?.username ?? 'Anonymous'}</span>
                    <span>{timeAgo(featured.updated_at ?? featured.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
              Recent Articles
            </h2>
            {recent.length === 0 ? (
              <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
                <p className="text-gray-400 mb-3">No articles yet. Be the first to contribute!</p>
                <Link
                  href="/articles/create"
                  className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                >
                  Write First Article
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recent.map(article => <ArticleCard key={article.id} article={article} />)}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
              Most Viewed
            </h2>
            {mostViewed.length === 0 ? (
              <p className="text-sm text-gray-400">No articles yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {mostViewed.map(article => <ArticleCard key={article.id} article={article} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}