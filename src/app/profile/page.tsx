'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { timeAgo, getCategoryInfo } from '@/lib/utils'
import type { Profile, Article } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      fetchProfile(session.user.id)
      fetchMyArticles(session.user.id)
    })
  }, [])

  async function fetchProfile(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
    setForm({ full_name: data?.full_name ?? '', bio: data?.bio ?? '' })
  }

  async function fetchMyArticles(id: string) {
    const { data } = await supabase
      .from('articles')
      .select('*, article_translations(*)')
      .eq('author_id', id)
      .order('created_at', { ascending: false })
    setArticles(data ?? [])
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: form.full_name.trim(),
      bio: form.bio.trim(),
    }).eq('id', profile.id)
    await fetchProfile(profile.id)
    setSaving(false)
    setEditing(false)
    setSuccess('Profile updated!')
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDelete(articleId: string) {
    if (!confirm('Delete this article? This cannot be undone.')) return
    await supabase.from('articles').delete().eq('id', articleId)
    setArticles(prev => prev.filter(a => a.id !== articleId))
  }

  if (!profile) return <div className="text-center py-16 text-gray-400">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">My Profile</h1>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-5">{success}</div>}

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-2xl font-bold">
              {profile.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">{profile.username}</h2>
              {profile.full_name && <p className="text-gray-500 text-sm">{profile.full_name}</p>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                {profile.role}
              </span>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
            {editing ? 'Cancel' : 'Edit profile'}
          </button>
        </div>

        {profile.bio && !editing && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
        )}

        {editing && (
          <div className="mt-5 flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="Tell the community about yourself..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600 resize-none"
              />
            </div>
            <button onClick={handleSave} disabled={saving} className="self-start px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}
      </div>

      {/* My articles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">My Articles ({articles.length})</h2>
          <Link href="/articles/create" className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800">
            + New article
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400 mb-3">You haven't written any articles yet.</p>
            <Link href="/articles/create" className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
              Write your first article
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {articles.map(article => {
              const t = article.article_translations?.find(t => t.language === 'english') ?? article.article_translations?.[0]
              const cat = getCategoryInfo(article.category)
              return (
                <div key={article.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg">{cat.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{t?.title ?? 'Untitled'}</p>
                      <p className="text-xs text-gray-400">{cat.label} · {timeAgo(article.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {article.status}
                    </span>
                    <Link href={`/articles/edit/${article.slug}`} className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</Link>
                    <button onClick={() => handleDelete(article.id)} className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
