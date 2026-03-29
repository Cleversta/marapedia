'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCategoryInfo, formatDate, timeAgo } from '@/lib/utils'
import type { Article } from '@/types'

interface PhotoImage {
  id: string
  url: string
  caption: string | null
  sort_order: number
}

interface PhotoGroup {
  id: string
  title: string
  is_public: boolean
  created_at: string
  thumbnail_url: string | null
  photo_images?: PhotoImage[]
}

// ─── Album Edit Modal ─────────────────────────────────────────────────────────
function AlbumEditModal({ album, onClose, onSave }: {
  album: PhotoGroup
  onClose: () => void
  onSave: (id: string, title: string, removedImageIds: string[]) => void
}) {
  const [title, setTitle] = useState(album.title)
  const [images, setImages] = useState<PhotoImage[]>(
    [...(album.photo_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [saving, setSaving] = useState(false)
  const [removedIds, setRemovedIds] = useState<string[]>([])

  function removeImage(id: string) {
    setImages(prev => prev.filter(img => img.id !== id))
    setRemovedIds(prev => [...prev, id])
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await supabase.from('photo_groups').update({ title: title.trim() }).eq('id', album.id)
    if (removedIds.length > 0) {
      await supabase.from('photo_images').delete().in('id', removedIds)
    }
    if (images.length > 0) {
      await supabase.from('photo_groups').update({ thumbnail_url: images[0].url }).eq('id', album.id)
    }
    onSave(album.id, title.trim(), removedIds)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-display text-base font-bold text-gray-900">Edit Album</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Album Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={200}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Photos ({images.length}) — hover to remove
            </label>
            {images.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No photos remaining.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                    <div className="h-20 relative">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-green-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-full uppercase">
                          Cover
                        </span>
                      )}
                      <button type="button" onClick={() => removeImage(img.id)}
                        className="absolute inset-0 bg-red-500/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 shrink-0 flex justify-end gap-2 bg-gray-50/60">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className="px-5 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-40 active:scale-95 transition-all">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [albums, setAlbums] = useState<PhotoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [articleFilter, setArticleFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [mainTab, setMainTab] = useState<'articles' | 'photos'>('articles')
  const [editingAlbum, setEditingAlbum] = useState<PhotoGroup | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/login'); return }
      setUser(session.user)
      fetchMyArticles(session.user.id)
      fetchMyAlbums(session.user.id)
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

  async function fetchMyAlbums(userId: string) {
    const { data } = await supabase
      .from('photo_groups')
      .select('*, photo_images(id, url, caption, sort_order)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
    setAlbums(data ?? [])
  }

  async function handleDeleteArticle(id: string) {
    if (!confirm('Are you sure you want to delete this article?')) return
    await supabase.from('articles').delete().eq('id', id)
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  async function handleDeleteAlbum(id: string) {
    if (!confirm('Delete this album and all its photos?')) return
    await supabase.from('photo_groups').delete().eq('id', id)
    setAlbums(prev => prev.filter(a => a.id !== id))
  }

  function handleAlbumSaved(id: string, newTitle: string, removedImageIds: string[]) {
    setAlbums(prev => prev.map(a => {
      if (a.id !== id) return a
      return {
        ...a,
        title: newTitle,
        photo_images: (a.photo_images ?? []).filter(img => !removedImageIds.includes(img.id)),
      }
    }))
  }

  const filteredArticles = articles.filter(a => {
    if (articleFilter === 'published') return a.status === 'published'
    if (articleFilter === 'draft') return a.status === 'draft'
    return true
  })

  const totalPhotos = albums.reduce((s, a) => s + (a.photo_images?.length ?? 0), 0)

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    views: articles.reduce((sum, a) => sum + (a.view_count ?? 0), 0),
    albums: albums.length,
    photos: totalPhotos,
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">My Contributions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your articles and photo albums</p>
        </div>
        <Link href="/articles/create"
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-green-700 text-white
            rounded-lg hover:bg-green-800 active:scale-95 transition-all duration-150 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Articles',   value: stats.total,                    color: 'text-gray-800' },
          { label: 'Published',  value: stats.published,                color: 'text-green-700' },
          { label: 'Draft',      value: stats.draft,                    color: 'text-amber-600' },
          { label: 'Views',      value: stats.views.toLocaleString(),   color: 'text-blue-600' },
          { label: 'Albums',     value: stats.albums,                   color: 'text-pink-600' },
          { label: 'Photos',     value: stats.photos,                   color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-5">
        {([
          { key: 'articles', label: `Articles (${stats.total})` },
          { key: 'photos',   label: `Photo Albums (${stats.albums})` },
        ] as { key: typeof mainTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              mainTab === t.key ? 'border-green-700 text-green-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Articles tab */}
      {mainTab === 'articles' && (
        <div>
          {/* Article filter sub-tabs */}
          <div className="flex gap-1 mb-4">
            {(['all', 'published', 'draft'] as const).map(f => (
              <button key={f} onClick={() => setArticleFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  articleFilter === f ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}>
                {f === 'all' ? `All (${stats.total})` : f === 'published' ? `Published (${stats.published})` : `Draft (${stats.draft})`}
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-sm mb-3">
                {articleFilter === 'all' ? "You haven't written any articles yet." : `No ${articleFilter} articles.`}
              </p>
              <Link href="/articles/create"
                className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors">
                Write your first article
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredArticles.map(article => {
                const cat = getCategoryInfo(article.category)
                const title =
                  article.article_translations?.find((t: any) => t.language === 'mara')?.title ||
                  article.article_translations?.find((t: any) => t.language === 'en')?.title ||
                  article.article_translations?.[0]?.title ||
                  article.slug
                const langs = article.article_translations?.map((t: any) => t.language) ?? []
                return (
                  <div key={article.id}
                    className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                    {article.thumbnail_url ? (
                      <img src={article.thumbnail_url} alt={title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0">{cat.icon}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <h2 className="text-sm font-semibold text-gray-900 truncate">{title}</h2>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${cat.color}`}>{cat.icon} {cat.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              article.status === 'published' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {article.status === 'published' ? '● Published' : '○ Draft'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link href={`/articles/${article.slug}`}
                            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">View</Link>
                          <Link href={`/articles/edit/${article.slug}`}
                            className="text-xs px-2.5 py-1.5 border border-green-200 rounded-lg text-green-700 hover:bg-green-50">✏️ Edit</Link>
                          <button onClick={() => handleDeleteArticle(article.id)}
                            className="text-xs px-2.5 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50">Delete</button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>Updated {formatDate(article.updated_at ?? article.created_at)}</span>
                        <span>{article.view_count ?? 0} views</span>
                        {langs.length > 0 && (
                          <span className="flex items-center gap-1">
                            {langs.map((lang: string) => (
                              <span key={lang} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] uppercase">{lang}</span>
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
      )}

      {/* Photos tab */}
      {mainTab === 'photos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{albums.length} album{albums.length !== 1 ? 's' : ''} · {totalPhotos} photos</p>
            <Link href="/photos" className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800">
              + Upload Photos
            </Link>
          </div>

          {albums.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <div className="text-4xl mb-3">📷</div>
              <p className="text-gray-400 text-sm mb-3">You haven't uploaded any photo albums yet.</p>
              <Link href="/photos"
                className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors">
                Upload your first photos
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {albums.map(album => {
                const images = [...(album.photo_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
                const cover = images[0]
                return (
                  <div key={album.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-3 hover:border-gray-300 hover:shadow-sm transition-all">
                    {/* Cover */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {cover
                        ? <img src={cover.url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📷</div>
                      }
                    </div>

                    {/* Strip */}
                    {images.length > 1 && (
                      <div className="hidden sm:flex gap-1 shrink-0">
                        {images.slice(1, 4).map(img => (
                          <div key={img.id} className="w-10 h-16 rounded overflow-hidden bg-gray-100">
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {images.length > 4 && (
                          <div className="w-10 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-medium">
                            +{images.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{album.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {images.length} photo{images.length !== 1 ? 's' : ''} · {timeAgo(album.created_at)}
                      </p>
                      <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                        album.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {album.is_public ? '● Public' : '○ Hidden'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setEditingAlbum(album)}
                        className="text-xs px-2.5 py-1.5 border border-green-200 text-green-700 rounded-lg hover:bg-green-50">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDeleteAlbum(album.id)}
                        className="text-xs px-2.5 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Album edit modal */}
      {editingAlbum && (
        <AlbumEditModal
          album={editingAlbum}
          onClose={() => setEditingAlbum(null)}
          onSave={handleAlbumSaved}
        />
      )}
    </div>
  )
}