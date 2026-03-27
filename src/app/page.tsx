import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'
import ArticleCard from '@/components/ArticleCard'
import type { Article } from '@/types'

async function getFeaturedArticle(): Promise<Article | null> {
  const { data } = await supabase
    .from('articles')
    .select('*, profiles(*), article_translations(*)')
    .eq('status', 'published')
    .eq('featured', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

async function getRecentArticles(): Promise<Article[]> {
  const { data } = await supabase
    .from('articles')
    .select('*, profiles(*), article_translations(*)')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(12)
  return data ?? []
}

async function getStats() {
  const [{ count: articleCount }, { count: userCount }] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])
  return { articles: articleCount ?? 0, users: userCount ?? 0 }
}

export default async function HomePage() {
  const [featured, recent, stats] = await Promise.all([
    getFeaturedArticle(),
    getRecentArticles(),
    getStats(),
  ])

  const featuredTranslation =
    featured?.article_translations?.find(t => t.language === 'english') ??
    featured?.article_translations?.[0]

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-50 to-amber-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-green-700 font-medium mb-3">
              The Free Mara Encyclopedia
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-green-950 mb-4 leading-tight">
              Preserving Mara<br />History & Culture
            </h1>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              A community-built encyclopedia for the Mara people — from Maraland to the world.
              Share history, songs, stories, and traditions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="px-5 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm font-medium transition-colors"
              >
                Browse Articles
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 border border-green-700 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium transition-colors"
              >
                Contribute
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-8">
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

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: articles */}
          <div className="lg:col-span-2">

            {/* Featured */}
            {featured && featuredTranslation && (
              <div className="mb-8">
                <h2 className="font-display text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                  Featured Article
                </h2>
                <Link href={`/articles/${featured.slug}`} className="block group">
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
                    <div className="p-5">
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Featured</span>
                      <h3 className="font-display text-xl font-bold mt-2 mb-2 group-hover:text-green-800 transition-colors">
                        {featuredTranslation.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                        {featuredTranslation.excerpt ?? (featuredTranslation.content ?? '').replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                      <div className="mt-3 text-xs text-gray-400 flex gap-4">
                        <span>By {featured.profiles?.username ?? 'Anonymous'}</span>
                        <span>{timeAgo(featured.updated_at ?? featured.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Recent articles */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recent.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Contribute box */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="font-display text-base font-semibold text-green-900 mb-2">
                Help build Marapedia
              </h3>
              <p className="text-sm text-green-800 leading-relaxed mb-4">
                Know something about Mara history, songs, places, or culture? Share it with the community.
              </p>
              <Link
                href="/articles/create"
                className="block text-center text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
              >
                + Create an article
              </Link>
            </div>

            {/* Did you know */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-display text-base font-semibold text-amber-900 mb-2">
                Did you know?
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                The Mara people have <strong>12 dialects</strong>, with Tlosai being the official language
                used in schools, churches, and official communication.
              </p>
            </div>

            {/* Languages */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-display text-base font-semibold mb-3">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {['Mara', 'English', 'Myanmar', 'Mizo'].map(lang => (
                  <span key={lang} className="text-xs px-3 py-1 border border-gray-200 rounded-full text-gray-600 bg-gray-50">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}