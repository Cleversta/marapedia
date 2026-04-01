'use client'

import { useState } from 'react'
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

  const typeOptions = ARTICLE_TYPES[category] ?? []

  const countByType: Record<string, number> = {}
  for (const art of articles) {
    const t = (art as any).article_type ?? 'other'
    countByType[t] = (countByType[t] ?? 0) + 1
  }

  const typeTabs = typeOptions.filter(t => (countByType[t.value] ?? 0) > 0)

  const filtered =
    activeType === 'all'
      ? articles
      : articles.filter(a => {
          const t = (a as any).article_type ?? 'other'
          return t === activeType
        })

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

      {/* ── Article grid ──────────────────────────────────────────────────────── */}
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
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}