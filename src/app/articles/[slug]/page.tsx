'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCategoryInfo, formatDate, LANGUAGES } from '@/lib/utils'
import type { Article, Language, ArticleRevision } from '@/types'

export default function ArticlePage() {
  const { slug } = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [currentLang, setCurrentLang] = useState<Language>('english')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [revisions, setRevisions] = useState<ArticleRevision[]>([])
  const [showRevisions, setShowRevisions] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data))
      }
    })
    fetchArticle()
  }, [slug])

  async function fetchArticle() {
    const { data } = await supabase
      .from('articles')
      .select('*, profiles(*), article_translations(*)')
      .eq('slug', slug)
      .single()

    if (!data) { router.push('/'); return }
    setArticle(data)

    // increment view count
    await supabase.from('articles').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', data.id)

    // set default lang to first available translation
    const available = data.article_translations?.map((t: any) => t.language) ?? []
    if (available.includes('english')) setCurrentLang('english')
    else if (available.length > 0) setCurrentLang(available[0])

    setLoading(false)
  }

  async function fetchRevisions() {
    if (!article) return
    const { data } = await supabase
      .from('article_revisions')
      .select('*, profiles(username)')
      .eq('article_id', article.id)
      .eq('language', currentLang)
      .order('edited_at', { ascending: false })
      .limit(20)
    setRevisions(data ?? [])
    setShowRevisions(true)
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  if (!article) return null

  const translation = article.article_translations?.find(t => t.language === currentLang)
  const availableLangs = article.article_translations?.map(t => t.language) ?? []
  const cat = getCategoryInfo(article.category)
  const canEdit = user && (profile?.role === 'admin' || article.author_id === user.id)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <span>/</span>
        <Link href={`/category/${article.category}`} className="hover:text-green-700">{cat.label}</Link>
        <span>/</span>
        <span className="text-gray-600">{translation?.title ?? slug}</span>
      </nav>

      {/* Category badge */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.color}`}>
          {cat.icon} {cat.label}
        </span>
        {canEdit && (
          <Link href={`/articles/edit/${article.slug}`} className="text-xs px-3 py-0.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600">
            ✏️ Edit
          </Link>
        )}
      </div>

      {/* Language tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {LANGUAGES.map(lang => {
          const hasContent = availableLangs.includes(lang.value)
          const isActive = currentLang === lang.value
          return (
            <button
              key={lang.value}
              onClick={() => hasContent && setCurrentLang(lang.value)}
              className={`px-4 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
                isActive
                  ? 'border-green-700 text-green-700 font-medium'
                  : hasContent
                  ? 'border-transparent text-gray-500 hover:text-gray-800'
                  : 'border-transparent text-gray-300 cursor-not-allowed'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hasContent ? 'bg-green-500' : 'bg-gray-300'}`} />
              {lang.label}
              {!hasContent && <span className="text-xs text-gray-300">(empty)</span>}
            </button>
          )
        })}
      </div>

      {/* Thumbnail */}
      {article.thumbnail_url && (
        <div className="mb-6 rounded-xl overflow-hidden">
          <img src={article.thumbnail_url} alt={translation?.title} className="w-full max-h-80 object-cover" />
        </div>
      )}

      {/* Title & meta */}
      {translation ? (
        <>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{translation.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 pb-4 border-b border-gray-100">
            <span>By <strong className="text-gray-600">{article.profiles?.username ?? 'Anonymous'}</strong></span>
            <span>Updated {formatDate(article.updated_at)}</span>
            <span>{article.view_count} views</span>
            <button onClick={fetchRevisions} className="text-green-700 hover:underline text-xs">View history</button>
          </div>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: translation.content }} />
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 mb-2">This article has not been written in {LANGUAGES.find(l => l.value === currentLang)?.label} yet.</p>
          {user && (
            <Link href={`/articles/edit/${article.slug}?lang=${currentLang}`} className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
              Write {LANGUAGES.find(l => l.value === currentLang)?.label} version
            </Link>
          )}
        </div>
      )}

      {/* Revision history modal */}
      {showRevisions && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-lg font-semibold">Edit History ({LANGUAGES.find(l => l.value === currentLang)?.label})</h3>
              <button onClick={() => setShowRevisions(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            {revisions.length === 0 ? (
              <p className="text-gray-400 text-sm">No edit history yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {revisions.map(rev => (
                  <div key={rev.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{(rev as any).profiles?.username ?? 'Unknown'}</span>
                      <span className="text-gray-400 text-xs">{formatDate(rev.edited_at)}</span>
                    </div>
                    <p className="text-gray-500 mt-1 line-clamp-2">{rev.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
