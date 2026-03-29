'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { timeAgo, getCategoryInfo, getArticleTypeLabel } from '@/lib/utils'
import type { Profile, Article } from '@/types'

type Tab = 'drafts' | 'published' | 'photos'

interface PhotoGroup {
  id: string
  title: string
  is_public: boolean
  created_at: string
  thumbnail_url: string | null
  author_id: string
  profiles?: { username: string; avatar_url: string | null }
  photo_images?: { id: string }[]
}

export default function EditorPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [drafts, setDrafts] = useState<Article[]>([])
  const [published, setPublished] = useState<Article[]>([])
  const [photos, setPhotos] = useState<PhotoGroup[]>([])
  const [tab, setTab] = useState<Tab>('drafts')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
        if (!data || (data.role !== 'editor' && data.role !== 'admin')) {
          router.push('/'); return
        }
        setProfile(data)
        loadAll()
      })
    })
  }, [])

  async function loadAll() {
    const [artRes, photoRes] = await Promise.all([
      supabase.from('articles').select('*, profiles(*), article_translations(*)').order('created_at', { ascending: false }),
      supabase.from('photo_groups').select('*, profiles(username, avatar_url), photo_images(id)').order('created_at', { ascending: false }),
    ])
    const all: Article[] = artRes.data ?? []
    setDrafts(all.filter(a => a.status === 'draft'))
    setPublished(all.filter(a => a.status === 'published'))
    setPhotos(photoRes.data ?? [])
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

  async function togglePhotoPublic(id: string, current: boolean) {
    await supabase.from('photo_groups').update({ is_public: !current }).eq('id', id)
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, is_public: !current } : p))
  }

  async function deletePhotoGroup(id: string) {
    if (!confirm('Delete this album and all its photos permanently?')) return
    await supabase.from('photo_groups').delete().eq('id', id)
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading editor panel...</div>

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
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-4">
          <div className="font-display text-2xl font-bold">{drafts.length}</div>
          <div className="text-sm opacity-70">Pending Review</div>
        </div>
        <div className="bg-green-50 text-green-800 border border-green-200 rounded-xl p-4">
          <div className="font-display text-2xl font-bold">{published.length}</div>
          <div className="text-sm opacity-70">Published</div>
        </div>
        <div className="bg-pink-50 text-pink-800 border border-pink-200 rounded-xl p-4">
          <div className="font-display text-2xl font-bold">{photos.length}</div>
          <div className="text-sm opacity-70">Photo Albums</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {([
          { key: 'drafts',    label: `Pending Review (${drafts.length})` },
          { key: 'published', label: `Published (${published.length})` },
          { key: 'photos',    label: `Photos (${photos.length})` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
              tab === t.key ? 'border-green-700 text-green-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Articles — drafts */}
      {tab === 'drafts' && (
        <div className="flex flex-col gap-2">
          {drafts.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No articles pending review 🎉</div>
          )}
          {drafts.map(article => {
            const t = article.article_translations?.find(t => t.language === 'english') ?? article.article_translations?.[0]
            const cat = getCategoryInfo(article.category)
            const typeLabel = getArticleTypeLabel(article.category, (article as any).article_type)
            return (
              <div key={article.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg">{cat.icon}</span>
                  <div className="min-w-0">
                    <Link href={`/articles/${article.slug}`}
                      className="font-medium text-sm truncate block hover:text-green-700 hover:underline transition-colors">
                      {t?.title ?? 'Untitled'}
                    </Link>
                    <p className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                      <span>By {(article as any).profiles?.username ?? 'Unknown'}</span>
                      <span>·</span>
                      <span>{timeAgo(article.created_at)}</span>
                      {typeLabel && <><span>·</span><span>{typeLabel}</span></>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Draft</span>
                  <button onClick={() => publishArticle(article.id)}
                    className="text-xs px-2 py-1 bg-green-700 text-white rounded-lg hover:bg-green-800">Publish</button>
                  <Link href={`/articles/edit/${article.slug}`}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Articles — published */}
      {tab === 'published' && (
        <div className="flex flex-col gap-2">
          {published.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No published articles yet.</div>
          )}
          {published.map(article => {
            const t = article.article_translations?.find(t => t.language === 'english') ?? article.article_translations?.[0]
            const cat = getCategoryInfo(article.category)
            const typeLabel = getArticleTypeLabel(article.category, (article as any).article_type)
            return (
              <div key={article.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg">{cat.icon}</span>
                  <div className="min-w-0">
                    <Link href={`/articles/${article.slug}`}
                      className="font-medium text-sm truncate block hover:text-green-700 hover:underline transition-colors">
                      {t?.title ?? 'Untitled'}
                    </Link>
                    <p className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                      <span>By {(article as any).profiles?.username ?? 'Unknown'}</span>
                      <span>·</span>
                      <span>{timeAgo(article.created_at)}</span>
                      {typeLabel && <><span>·</span><span>{typeLabel}</span></>}
                      {article.featured && <span className="text-amber-600">★ Featured</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Published</span>
                  <button onClick={() => unpublishArticle(article.id)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Unpublish</button>
                  <button onClick={() => toggleFeatured(article.id, article.featured)}
                    className={`text-xs px-2 py-1 border rounded-lg ${
                      article.featured ? 'border-amber-300 text-amber-600 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                    {article.featured ? '★ Unfeature' : '☆ Feature'}
                  </button>
                  <Link href={`/articles/edit/${article.slug}`}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Photos tab */}
      {tab === 'photos' && (
        <div className="flex flex-col gap-2">
          {photos.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No photo albums yet.</div>
          )}
          {photos.map(album => (
            <div key={album.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {album.thumbnail_url
                    ? <img src={album.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📷</div>
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{album.title}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <span>By {album.profiles?.username ?? 'Unknown'}</span>
                    <span>·</span>
                    <span>{album.photo_images?.length ?? 0} photos</span>
                    <span>·</span>
                    <span>{timeAgo(album.created_at)}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  album.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {album.is_public ? 'Public' : 'Hidden'}
                </span>
                <button
                  onClick={() => togglePhotoPublic(album.id, album.is_public)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {album.is_public ? 'Hide' : 'Make Public'}
                </button>
                <button
                  onClick={() => deletePhotoGroup(album.id)}
                  className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}