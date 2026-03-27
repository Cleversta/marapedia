'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { timeAgo, getCategoryInfo, getArticleTypeLabel } from '@/lib/utils'
import type { Profile, Article } from '@/types'

type Tab = 'articles' | 'users'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('articles')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, users: 0 })
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
    const [artRes, userRes] = await Promise.all([
      supabase.from('articles').select('*, profiles(*), article_translations(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ])
    const arts: Article[] = artRes.data ?? []
    const usrs: Profile[] = userRes.data ?? []
    setArticles(arts)
    setUsers(usrs)
    setStats({
      total: arts.length,
      published: arts.filter(a => a.status === 'published').length,
      drafts: arts.filter(a => a.status === 'draft').length,
      users: usrs.length,
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

  async function setUserRole(id: string, role: 'member' | 'admin') {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading admin panel...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
        <span className="text-sm text-gray-400">Logged in as <strong>{profile?.username}</strong></span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Articles', value: stats.total, color: 'bg-blue-50 text-blue-800' },
          { label: 'Published', value: stats.published, color: 'bg-green-50 text-green-800' },
          { label: 'Drafts', value: stats.drafts, color: 'bg-amber-50 text-amber-800' },
          { label: 'Users', value: stats.users, color: 'bg-purple-50 text-purple-800' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 border border-current border-opacity-20`}>
            <div className="font-display text-2xl font-bold">{s.value}</div>
            <div className="text-sm opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {(['articles', 'users'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm capitalize border-b-2 transition-colors ${
              tab === t ? 'border-green-700 text-green-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Articles tab */}
      {tab === 'articles' && (
        <div className="flex flex-col gap-2">
          {articles.map(article => {
            const t = article.article_translations?.find(t => t.language === 'english') ?? article.article_translations?.[0]
            const cat = getCategoryInfo(article.category)
            // ─── NEW: type label in admin list ────────────────────────────
            const typeLabel = getArticleTypeLabel(article.category, (article as any).article_type)
            return (
              <div key={article.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span>{cat.icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t?.title ?? 'Untitled'}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                      <span>By {(article as any).profiles?.username ?? 'Unknown'}</span>
                      <span>·</span>
                      <span>{timeAgo(article.created_at)}</span>
                      {/* ─── NEW: type shown inline ───────────────────── */}
                      {typeLabel && (
                        <>
                          <span>·</span>
                          <span className="text-gray-500">{typeLabel}</span>
                        </>
                      )}
                      {article.featured && <span className="text-amber-600">★ Featured</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    article.status === 'published' ? 'bg-green-100 text-green-700'
                    : article.status === 'draft' ? 'bg-gray-100 text-gray-500'
                    : 'bg-red-100 text-red-500'
                  }`}>
                    {article.status}
                  </span>
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
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                  {user.role}
                </span>
                {user.id !== profile?.id && (
                  user.role === 'admin'
                    ? <button onClick={() => setUserRole(user.id, 'member')} className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Remove admin</button>
                    : <button onClick={() => setUserRole(user.id, 'admin')} className="text-xs px-2 py-1 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50">Make admin</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}