'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getCategoryInfo, ARTICLE_TYPES } from '@/lib/utils'
import ArticleCard from '@/components/ArticleCard'
import type { Category, Article } from '@/types'

interface Props {
  articles: Article[]
  category: Category
}

export default function CategoryPageClient({ articles, category }: Props) {
  const cat = getCategoryInfo(category)
  const [activeType, setActiveType] = useState<string>('all')
  const [sortAZ, setSortAZ] = useState(false)

  const typeOptions = ARTICLE_TYPES[category] ?? []

  const countByType: Record<string, number> = {}
  for (const art of articles) {
    const t = (art as any).article_type ?? 'other'
    countByType[t] = (countByType[t] ?? 0) + 1
  }

  const typeTabs = typeOptions.filter(t => (countByType[t.value] ?? 0) > 0)

  const filtered = useMemo(() => {
    let list = activeType === 'all'
      ? articles
      : articles.filter(a => {
          const t = (a as any).article_type ?? 'other'
          return t === activeType
        })

    if (sortAZ) {
      list = [...list].sort((a, b) => {
        const titleA = a.article_translations?.[0]?.title ?? ''
        const titleB = b.article_translations?.[0]?.title ?? ''
        return titleA.localeCompare(titleB)
      })
    }

    return list
  }, [articles, activeType, sortAZ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ── Page header ── */}
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

      {/* ── Type tabs + Sort toggle ── */}
      <div className="mb-6 flex items-end gap-2">
        {typeTabs.length > 0 && (
          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-0 border-b border-gray-200 min-w-max">
              <button
                onClick={() => setActiveType('all')}
                className={`flex items-center gap-1 px-2.5 py-1.5 md:px-4 md:py-2.5 text-xs md:text-sm whitespace-nowrap
                  border-b-2 -mb-px transition-colors duration-150 font-medium
                  ${activeType === 'all'
                    ? 'border-green-700 text-green-800'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
              >
                All
                <span className={`text-xs px-1 py-0.5 rounded-full font-normal
                  ${activeType === 'all' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {articles.length}
                </span>
              </button>

              {typeTabs.map(t => (
                <button
                  key={t.value}
                  onClick={() => setActiveType(t.value)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 md:px-4 md:py-2.5 text-xs md:text-sm whitespace-nowrap
                    border-b-2 -mb-px transition-colors duration-150
                    ${activeType === t.value
                      ? 'border-green-700 text-green-800 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                    }`}
                >
                  {t.label}
                  <span className={`text-xs px-1 py-0.5 rounded-full
                    ${activeType === t.value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {countByType[t.value] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sort button — pinned right */}
        <button
          onClick={() => setSortAZ(v => !v)}
          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-colors mb-px
            ${sortAZ
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
            }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          A–Z
        </button>
      </div>

      {/* ── Article grid ── */}
      {filtered.length === 0 ? (
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
            <ArticleCard
              key={article.id}
              article={article}
              hideImage={category === 'songs'}
            />
          ))}
        </div>
      )}
    </div>
  )
}