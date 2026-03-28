'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { timeAgo, getCategoryInfo, getArticleTypeLabel } from '@/lib/utils'
import type { Profile, Article } from '@/types'

export default function EditorPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [drafts, setDrafts] = useState<Article[]>([])
  const [published, setPublished] = useState<Article[]>([])
  const [tab, setTab] = useState<'drafts' | 'published'>('drafts')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
        if (!data || (data.role !== 'editor' && data.role !== 'admin')) {
          router.push('/')
          return
        }
        setProfile(data)
        loadArticles()
      })
    })
  }, [])

  async function loadArticles() {
    const { data } = await supabase
      .from('articles')
      .select('*, profiles(*), article_translations(*)')
      .order('created_at', { ascending: false })
    const all: Article[] = data ?? []
    setDrafts(all.filter(a => a.status === 'draft'))
    setPublished(all.filter(a => a.status === 'published'))
    setLoading(false)
  }

  async function publishArticle(id: string) {
    await supabase.from('articles').update({ status: 'published' }).eq('id', id)
    const article = drafts.find(a => a.id === id)
    if (article) {
      setDrafts(prev => prev.filter(a => a.id !== id))
      setPublished(prev => [{ ...article, status: 'published' }, ...prev])
    }
  }

  async function unpublishArticle(id: string) {
    await supabase.from('articles').update({ status: 'draft' }).eq('id', id)
    const article = published.find(a => a.id === id)
    if (article) {
      setPublished(prev => prev.filter(a => a.id !== id))
      setDrafts(prev => [{ ...article, status: 'draft' }, ...prev])
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from('articles').update({ featured: !current }).eq('id', id)
    setPublished(prev => prev.map(a => a.id === id ? { ...a, featured: !current } : a))
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading editor panel...</div>

  const currentList = tab === 'drafts' ? drafts : published

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">✏️ Editor Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and publish member submissions</p>
        </div>
        <span className="text-sm text-gray-400">
          Logged in as <strong>{profile?.username}</strong>
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{profile?.role}</span>
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-4">
          <div className="font-display text-2xl font-bold">{drafts.length}</div>
          <div className="text-sm opacity-70">Pending Review</div>
        </div>
        <div className="bg-green-50 text-green-800 border border-green-200 rounded-xl p-4">
          <div className="font-display text-2xl font-bold">{published.length}</div>
          <div className="text-sm opacity-70">Published</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {(['drafts', 'published'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
              tab === t ? 'border-green-700 text-green-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'drafts' ? `Pending Review (${drafts.length})` : `Published (${published.length})`}
          </button>
        ))}
      </div>

      {/* Article list */}
      <div className="flex flex-col gap-2">
        {currentList.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {tab === 'drafts' ? 'No articles pending review 🎉' : 'No published articles yet'}
          </div>
        )}
        {currentList.map(article => {
          const t = article.article_translations?.find(t => t.language === 'english') ?? article.article_translations?.[0]
          const cat = getCategoryInfo(article.category)
          const typeLabel = getArticleTypeLabel(article.category, (article as any).article_type)
          return (
            <div key={article.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg">{cat.icon}</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{t?.title ?? 'Untitled'}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                    <span>By {(article as any).profiles?.username ?? 'Unknown'}</span>
                    <span>·</span>
                    <span>{timeAgo(article.created_at)}</span>
                    {typeLabel && <><span>·</span><span className="text-gray-500">{typeLabel}</span></>}
                    {article.featured && <span className="text-amber-600">★ Featured</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {article.status === 'published' ? 'Published' : 'Draft'}
                </span>
                {article.status !== 'published' && (
                  <button onClick={() => publishArticle(article.id)}
                    className="text-xs px-2 py-1 bg-green-700 text-white rounded-lg hover:bg-green-800">
                    Publish
                  </button>
                )}
                {article.status === 'published' && (
                  <button onClick={() => unpublishArticle(article.id)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                    Unpublish
                  </button>
                )}
                {article.status === 'published' && (
                  <button onClick={() => toggleFeatured(article.id, article.featured)}
                    className={`text-xs px-2 py-1 border rounded-lg ${
                      article.featured ? 'border-amber-300 text-amber-600 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                    {article.featured ? '★ Unfeature' : '☆ Feature'}
                  </button>
                )}
                <Link href={`/articles/edit/${article.slug}`}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</Link>
                {article.status === 'published' && (
                  <Link href={`/articles/${article.slug}`} target="_blank"
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">View ↗</Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}