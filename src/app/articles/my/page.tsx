'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCategoryInfo, formatDate } from '@/lib/utils'
import type { Article } from '@/types'

export default function MyArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/login'); return }
      setUser(session.user)
      fetchMyArticles(session.user.id)
    })
  }, [])

  async function fetchMyArticles(userId: string) {
    const { data } = await supabase
      .from('articles')
      .select('*, article_translations(*)')
      .eq('author_id', userId)
      .order('updated_at', { ascending: false })

    setArticles(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this article?')) return
    await supabase.from('articles').delete().eq('id', id)
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  const filtered = articles.filter(a => {
    if (filter === 'published') return a.status === 'published'
    if (filter === 'draft') return a.status === 'draft'
    return true
  })

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    views: articles.reduce((sum, a) => sum + (a.view_count ?? 0), 0),
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">Loading your articles...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">My Articles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track your contributions</p>
        </div>
        <Link
          href="/articles/create"
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-green-700 text-white
            rounded-lg hover:bg-green-800 active:scale-95 transition-all duration-150 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Article
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-800' },
          { label: 'Published', value: stats.published, color: 'text-green-700' },
          { label: 'Draft', value: stats.draft, color: 'text-amber-600' },
          { label: 'Total Views', value: stats.views.toLocaleString(), color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-5">
        {(['all', 'published', 'draft'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${
              filter === f
                ? 'border-green-700 text-green-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {f === 'all' ? `All (${stats.total})` : f === 'published' ? `Published (${stats.published})` : `Draft (${stats.draft})`}
          </button>
        ))}
      </div>

      {/* Articles list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 text-sm mb-3">
            {filter === 'all' ? "You haven't written any articles yet." : `No ${filter} articles.`}
          </p>
          <Link
            href="/articles/create"
            className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
          >
            Write your first article
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(article => {
            const cat = getCategoryInfo(article.category)
            const title =
              article.article_translations?.find((t: any) => t.language === 'mara')?.title ||
              article.article_translations?.find((t: any) => t.language === 'en')?.title ||
              article.article_translations?.[0]?.title ||
              article.slug

            const langs = article.article_translations?.map((t: any) => t.language) ?? []

            return (
              // ✅ FIX: Entire card navigates to article on tap
              <div
                key={article.id}
                onClick={() => router.push(`/articles/${article.slug}`)}
                className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4
                  hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer"
              >
                {/* Thumbnail */}
                {article.thumbnail_url ? (
                  <img
                    src={article.thumbnail_url}
                    alt={title}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {cat.icon}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-gray-900 truncate leading-tight">
                        {title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${cat.color}`}>
                          {cat.icon} {cat.label}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          article.status === 'published'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {article.status === 'published' ? '● Published' : '○ Draft'}
                        </span>
                      </div>
                    </div>

                    {/* ✅ FIX: stopPropagation so buttons don't also trigger card navigation */}
                    <div
                      className="flex items-center gap-1.5 flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <Link
                        href={`/articles/${article.slug}`}
                        className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg
                          text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/articles/edit/${article.slug}`}
                        className="text-xs px-2.5 py-1.5 border border-green-200 rounded-lg
                          text-green-700 hover:bg-green-50 transition-colors"
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-xs px-2.5 py-1.5 border border-red-200 rounded-lg
                          text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>Updated {formatDate(article.updated_at ?? article.created_at)}</span>
                    <span>{article.view_count ?? 0} views</span>
                    {langs.length > 0 && (
                      <span className="flex items-center gap-1">
                        {langs.map((lang: string) => (
                          <span key={lang} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] uppercase">
                            {lang}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}