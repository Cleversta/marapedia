'use client'
// app/category/[name]/page.tsx
// ─── NOTE: Convert to client component so tabs can filter without a full reload.
// Keep the data fetch as a server action or use SWR/fetch in useEffect if you
// prefer to keep it as a server component — but for simplicity this shows the
// full client-side approach matching the existing code style.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCategoryInfo, CATEGORIES, ARTICLE_TYPES } from '@/lib/utils'
import ArticleCard from '@/components/ArticleCard'
import type { Category, Article } from '@/types'

export default function CategoryPage() {
  const params = useParams()
  const name = params.name as string
  const category = name as Category
  const cat = getCategoryInfo(category)

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<string>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('articles')
        .select('*, profiles(*), article_translations(*)')
        .eq('status', 'published')
        .eq('category', category)
        .order('updated_at', { ascending: false })
      setArticles(data ?? [])
      setLoading(false)
    }
    load()
  }, [category])

  // ─── Build type tabs with counts ─────────────────────────────────────────────
  const typeOptions = ARTICLE_TYPES[category] ?? []

  // Count how many articles belong to each type
  // article_type is stored directly on the article row
  const countByType: Record<string, number> = {}
  for (const art of articles) {
    const t = (art as any).article_type ?? 'other'
    countByType[t] = (countByType[t] ?? 0) + 1
  }

  // Only show type tabs that have at least one article, plus an "All" tab
  const typeTabs = typeOptions.filter(t => (countByType[t.value] ?? 0) > 0)

  // Filtered list for current tab
  const filtered =
    activeType === 'all'
      ? articles
      : articles.filter(a => (a as any).article_type === activeType)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <nav className="text-sm text-gray-400 mb-3 flex items-center gap-1.5">
          <Link href="/" className="hover:text-green-700">Home</Link>
          <span>/</span>
          <span className="text-gray-600">{cat.label}</span>
        </nav>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{cat.icon}</span>
            <div>
              <h1 className="font-display text-3xl font-bold">{cat.label}</h1>
              <p className="text-gray-500 text-sm">
                {articles.length} article{articles.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link
            href={`/articles/create?category=${category}`}
            className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
          >
            + Add {cat.label} article
          </Link>
        </div>
      </div>

      {/* ── Type tabs ─────────────────────────────────────────────────────────── */}
      {typeTabs.length > 0 && (
        <div className="mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-0 border-b border-gray-200 min-w-max">
            {/* All tab */}
            <button
              onClick={() => setActiveType('all')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap
                border-b-2 -mb-px transition-colors duration-150 font-medium
                ${activeType === 'all'
                  ? 'border-green-700 text-green-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
            >
              All
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-normal
                ${activeType === 'all' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {articles.length}
              </span>
            </button>

            {/* One tab per type that has articles */}
            {typeTabs.map(t => (
              <button
                key={t.value}
                onClick={() => setActiveType(t.value)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap
                  border-b-2 -mb-px transition-colors duration-150
                  ${activeType === t.value
                    ? 'border-green-700 text-green-800 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
              >
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full
                  ${activeType === t.value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {countByType[t.value] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main layout ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Article grid ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400 mb-3">
                {activeType === 'all'
                  ? `No ${cat.label.toLowerCase()} articles yet.`
                  : `No articles of this type yet.`}
              </p>
              <Link
                href={`/articles/create?category=${category}${activeType !== 'all' ? `&type=${activeType}` : ''}`}
                className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
              >
                Be the first to contribute
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Type breakdown — always visible in sidebar */}
          {typeOptions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-800">Browse by type</h3>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => setActiveType('all')}
                  className={`flex items-center justify-between text-sm px-2 py-1.5 rounded-lg transition-colors
                    ${activeType === 'all' ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span>All {cat.label}</span>
                  <span className="text-xs text-gray-400 tabular-nums">{articles.length}</span>
                </button>
                {typeOptions.map(t => {
                  const count = countByType[t.value] ?? 0
                  return (
                    <button
                      key={t.value}
                      onClick={() => count > 0 && setActiveType(t.value)}
                      className={`flex items-center justify-between text-sm px-2 py-1.5 rounded-lg transition-colors
                        ${count === 0 ? 'opacity-40 cursor-default' : ''}
                        ${activeType === t.value ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>{t.label}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Other categories */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Other categories</h3>
            <div className="flex flex-col gap-0.5">
              {CATEGORIES.filter(c => c.value !== category).map(c => (
                <Link
                  key={c.value}
                  href={`/category/${c.value}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}