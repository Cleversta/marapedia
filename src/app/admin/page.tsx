'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { timeAgo, getCategoryInfo, getArticleTypeLabel } from '@/lib/utils'
import type { Profile, Article, Role } from '@/types'

type Tab = 'articles' | 'photos' | 'users'

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

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('articles')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [photos, setPhotos] = useState<PhotoGroup[]>([])
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, editors: 0, users: 0, albums: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
        if (!data || data.role !== 'admin') { router.push('/'); return }
        setProfile(data)
        loadAll()
      })
    })
  }, [])

  async function loadAll() {
    const [artRes, userRes, photoRes] = await Promise.all([
      supabase.from('articles').select('*, profiles(*), article_translations(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('photo_groups').select('*, profiles(username, avatar_url), photo_images(id)').order('created_at', { ascending: false }),
    ])
    const arts: Article[] = artRes.data ?? []
    const usrs: Profile[] = userRes.data ?? []
    const phs: PhotoGroup[] = photoRes.data ?? []
    setArticles(arts)
    setUsers(usrs)
    setPhotos(phs)
    setStats({
      total: arts.length,
      published: arts.filter(a => a.status === 'published').length,
      drafts: arts.filter(a => a.status === 'draft').length,
      editors: usrs.filter(u => u.role === 'editor').length,
      users: usrs.length,
      albums: phs.length,
    })
    setLoading(false)
  }

  async function setArticleStatus(id: string, status: string) {
    await supabase.from('articles').update({ status }).eq('id', id)
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a))
  }

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from('articles').update({ featured: !current }).eq('id', id)
    setArticles(prev => prev.map(a => a.id === id ? { ...a, featured: !current } : a))
  }

  async function deleteArticle(id: string) {
    if (!confirm('Delete this article permanently?')) return
    await supabase.from('articles').delete().eq('id', id)
    setArticles(prev => prev.filter(a => a.id !== id))
    setStats(s => ({ ...s, total: s.total - 1 }))
  }

  async function setUserRole(id: string, role: Role) {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  async function togglePhotoPublic(id: string, current: boolean) {
    await supabase.from('photo_groups').update({ is_public: !current }).eq('id', id)
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, is_public: !current } : p))
  }

  async function deletePhotoGroup(id: string) {
    if (!confirm('Delete this album and all its photos permanently?')) return
    await supabase.from('photo_groups').delete().eq('id', id)
    setPhotos(prev => prev.filter(p => p.id !== id))
    setStats(s => ({ ...s, albums: s.albums - 1 }))
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading admin panel...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">⚙️ Admin Panel</h1>
        <span className="text-sm text-gray-400">Logged in as <strong>{profile?.username}</strong></span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Articles', value: stats.total,     color: 'bg-blue-50 text-blue-800 border-blue-200' },
          { label: 'Published',      value: stats.published, color: 'bg-green-50 text-green-800 border-green-200' },
          { label: 'Drafts',         value: stats.drafts,    color: 'bg-amber-50 text-amber-800 border-amber-200' },
          { label: 'Albums',         value: stats.albums,    color: 'bg-pink-50 text-pink-800 border-pink-200' },
          { label: 'Editors',        value: stats.editors,   color: 'bg-blue-50 text-blue-800 border-blue-200' },
          { label: 'Total Users',    value: stats.users,     color: 'bg-purple-50 text-purple-800 border-purple-200' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 border`}>
            <div className="font-display text-2xl font-bold">{s.value}</div>
            <div className="text-sm opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {(['articles', 'photos', 'users'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm capitalize border-b-2 transition-colors ${
              tab === t ? 'border-green-700 text-green-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t}{t === 'photos' && ` (${photos.length})`}
          </button>
        ))}
      </div>

      {/* Articles tab */}
      {tab === 'articles' && (
        <div className="flex flex-col gap-2">
          {articles.map(article => {
            const t = article.article_translations?.find(t => t.language === 'english') ?? article.article_translations?.[0]
            const cat = getCategoryInfo(article.category)
            const typeLabel = getArticleTypeLabel(article.category, (article as any).article_type)
            return (
              <div key={article.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span>{cat.icon}</span>
                  <div className="min-w-0">
                    <Link href={`/articles/${article.slug}`}
                      className="font-medium text-sm truncate block hover:text-green-700 hover:underline transition-colors">
                      {t?.title ?? 'Untitled'}
                    </Link>
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
                    article.status === 'published' ? 'bg-green-100 text-green-700'
                    : article.status === 'draft' ? 'bg-gray-100 text-gray-500'
                    : 'bg-red-100 text-red-500'
                  }`}>{article.status}</span>
                  {article.status !== 'published' && (
                    <button onClick={() => setArticleStatus(article.id, 'published')}
                      className="text-xs px-2 py-1 bg-green-700 text-white rounded-lg hover:bg-green-800">Publish</button>
                  )}
                  {article.status === 'published' && (
                    <button onClick={() => setArticleStatus(article.id, 'draft')}
                      className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Unpublish</button>
                  )}
                  <button onClick={() => toggleFeatured(article.id, article.featured)}
                    className={`text-xs px-2 py-1 border rounded-lg ${article.featured ? 'border-amber-300 text-amber-600 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    {article.featured ? '★ Unfeature' : '☆ Feature'}
                  </button>
                  <Link href={`/articles/edit/${article.slug}`}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</Link>
                  <button onClick={() => deleteArticle(article.id)}
                    className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
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
            <div className="text-center py-12 text-gray-400 text-sm">No albums yet.</div>
          )}
          {photos.map(album => (
            <div key={album.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Thumbnail */}
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

      {/* Users tab */}
      {tab === 'users' && (
        <div className="flex flex-col gap-2">
          {users.map(user => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.full_name ?? ''} · Joined {timeAgo(user.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  user.role === 'admin'  ? 'bg-purple-100 text-purple-700' :
                  user.role === 'editor' ? 'bg-blue-100 text-blue-700' :
                                           'bg-gray-100 text-gray-500'
                }`}>{user.role}</span>
                {user.id !== profile?.id && (
                  <div className="flex items-center gap-1">
                    {user.role === 'member' && (
                      <button onClick={() => setUserRole(user.id, 'editor')}
                        className="text-xs px-2 py-1 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50">
                        Make Editor
                      </button>
                    )}
                    {user.role === 'editor' && (
                      <>
                        <button onClick={() => setUserRole(user.id, 'member')}
                          className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                          Remove Editor
                        </button>
                        <button onClick={() => setUserRole(user.id, 'admin')}
                          className="text-xs px-2 py-1 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50">
                          Make Admin
                        </button>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <button onClick={() => setUserRole(user.id, 'member')}
                        className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                        Remove Admin
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}