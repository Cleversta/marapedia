'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ArticleCard from '@/components/ArticleCard'
import type { Article } from '@/types'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (q) { setQuery(q); doSearch(q) }
  }, [q])

  async function doSearch(term: string) {
    if (!term.trim()) return
    setLoading(true)
    setSearched(true)

    const { data } = await supabase
      .from('article_translations')
      .select('article_id, title, excerpt, language')
      .or(`title.ilike.%${term}%,content.ilike.%${term}%`)

    if (!data || data.length === 0) {
      setResults([])
      setLoading(false)
      return
    }

    const ids = [...new Set(data.map(d => d.article_id))]
    const { data: articles } = await supabase
      .from('articles')
      .select('*, profiles(*), article_translations(*)')
      .in('id', ids)
      .eq('status', 'published')

    setResults(articles ?? [])
    setLoading(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">Search Marapedia</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search articles, songs, people, places..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
          autoFocus
        />
        <button type="submit" className="px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800">
          Search
        </button>
      </form>

      {loading && <p className="text-gray-400 text-sm">Searching...</p>}

      {!loading && searched && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {results.length === 0
              ? `No results found for "${q}"`
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </>
      )}

      {!searched && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">Search Mara history, songs, people, and more</p>
          <p className="text-sm">Try searching: "Mara history", "Azao La", "Siaha", "Sawlakia"</p>
        </div>
      )}
    </div>
  )
}
