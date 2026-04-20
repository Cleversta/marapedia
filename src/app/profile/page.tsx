'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { timeAgo, getCategoryInfo } from '@/lib/utils'
import type { Profile, Article } from '@/types'

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

// ─── Delete Account Modal ─────────────────────────────────────────────────────
function DeleteAccountModal({ onClose, onConfirm, deleting }: {
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  const [typed, setTyped] = useState('')
  const confirmed = typed === 'DELETE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-display text-base font-bold text-red-600">Delete Account</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-1">
            <p className="font-semibold">⚠️ This cannot be undone.</p>
            <p>Your account will be permanently deleted. Your articles will remain but will be anonymized (shown as deleted user).</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              Type <span className="font-mono font-bold text-gray-900">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-400 font-mono"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || deleting}
            className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-40 active:scale-95 transition-all"
          >
            {deleting ? 'Deleting…' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Album Edit Modal ─────────────────────────────────────────────────────────
function AlbumEditModal({ album, onClose, onSave }: {
  album: PhotoGroup
  onClose: () => void
  onSave: (id: string, title: string, removedImageIds: string[], isPublic: boolean) => void
}) {
  const [title, setTitle] = useState(album.title)
  const [images, setImages] = useState<PhotoImage[]>(album.photo_images ?? [])
  const [saving, setSaving] = useState(false)
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(album.is_public)

  function removeImage(id: string) {
    setImages(prev => prev.filter(img => img.id !== id))
    setRemovedIds(prev => [...prev, id])
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await supabase.from('photo_groups').update({ title: title.trim(), is_public: isPublic }).eq('id', album.id)
    if (removedIds.length > 0) {
      await supabase.from('photo_images').delete().in('id', removedIds)
    }
    if (images.length > 0) {
      const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)
      await supabase.from('photo_groups').update({ thumbnail_url: sorted[0].url }).eq('id', album.id)
    }
    onSave(album.id, title.trim(), removedIds, isPublic)
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
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium text-gray-500">Visibility</p>
              <p className="text-xs text-gray-400 mt-0.5">{isPublic ? 'Visible to everyone' : 'Hidden from public'}</p>
            </div>
            <button type="button" onClick={() => setIsPublic(p => !p)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-green-600' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Photos ({images.length}) — hover to remove</label>
            {images.length === 0 ? (
              <p className="text-xs text-gray-400 italic">All photos removed.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[...images].sort((a, b) => a.sort_order - b.sort_order).map((img, i) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                    <div className="h-20 relative">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-green-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-full uppercase">Cover</span>
                      )}
                      <button type="button" onClick={() => removeImage(img.id)}
                        className="absolute inset-0 bg-red-500/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium">
                        Remove
                      </button>
                    </div>
                    {img.caption && <p className="px-1.5 py-1 text-[9px] text-gray-500 truncate">{img.caption}</p>}
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

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [albums, setAlbums] = useState<PhotoGroup[]>([])
  const [favorites, setFavorites] = useState<Article[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [editingAlbum, setEditingAlbum] = useState<PhotoGroup | null>(null)
  const [activeTab, setActiveTab] = useState<'articles' | 'photos' | 'favorites'>('articles')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      fetchProfile(session.user.id)
      fetchMyArticles(session.user.id)
      fetchMyAlbums(session.user.id)
      fetchMyFavorites(session.user.id)
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

  async function fetchMyAlbums(id: string) {
    const { data } = await supabase
      .from('photo_groups')
      .select('*, photo_images(id, url, caption, sort_order)')
      .eq('author_id', id)
      .order('created_at', { ascending: false })
    setAlbums(data ?? [])
  }

  async function fetchMyFavorites(userId: string) {
    const { data } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        article:articles(
          id, slug, category, status, featured, thumbnail_url, view_count,
          created_at, updated_at,
          profiles(id, username, avatar_url),
          article_translations(id, article_id, language, title, excerpt, content)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const articles = (data ?? [])
      .map((row: any) => row.article)
      .filter(Boolean) as Article[]

    setFavorites(articles)
  }

  async function handleUnfavorite(articleId: string) {
    if (!profile) return
    await supabase.from('favorites').delete().eq('user_id', profile.id).eq('article_id', articleId)
    setFavorites(prev => prev.filter(a => a.id !== articleId))
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 5 * 1024 * 1024) { setAvatarError('Image must be under 5MB.'); return }
    if (!file.type.startsWith('image/')) { setAvatarError('Please select an image file.'); return }
    setAvatarUploading(true); setAvatarError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      await supabase.from('profiles').update({ avatar_url: data.url }).eq('id', profile.id)
      await fetchProfile(profile.id)
      setSuccess('Profile picture updated!'); setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setAvatarError(err.message)
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveAvatar() {
    if (!profile) return
    if (!confirm('Remove your profile picture?')) return
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)
    await fetchProfile(profile.id)
    setSuccess('Profile picture removed.'); setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDeleteAccount() {
    if (!profile) return
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ targetUserId: profile.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete account')
      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch (err: any) {
      alert(err.message)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  async function handleToggleArticleStatus(e: React.MouseEvent, article: Article) {
    e.stopPropagation()
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    await supabase.from('articles').update({ status: newStatus }).eq('id', article.id)
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, status: newStatus as any } : a))
  }

  async function handleDeleteArticle(articleId: string) {
    if (!confirm('Delete this article? This cannot be undone.')) return
    await supabase.from('articles').delete().eq('id', articleId)
    setArticles(prev => prev.filter(a => a.id !== articleId))
  }

  async function handleToggleAlbumPublic(e: React.MouseEvent, album: PhotoGroup) {
    e.stopPropagation()
    await supabase.from('photo_groups').update({ is_public: !album.is_public }).eq('id', album.id)
    setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, is_public: !album.is_public } : a))
  }

  async function handleDeleteAlbum(id: string) {
    if (!confirm('Delete this album and all its photos?')) return
    await supabase.from('photo_groups').delete().eq('id', id)
    setAlbums(prev => prev.filter(a => a.id !== id))
  }

  function handleAlbumSaved(id: string, newTitle: string, removedImageIds: string[], isPublic: boolean) {
    setAlbums(prev => prev.map(a => {
      if (a.id !== id) return a
      return {
        ...a,
        title: newTitle,
        is_public: isPublic,
        photo_images: (a.photo_images ?? []).filter(img => !removedImageIds.includes(img.id)),
      }
    }))
  }

  function roleBadgeClass(role: string) {
    if (role === 'admin') return 'bg-purple-100 text-purple-700'
    if (role === 'editor') return 'bg-blue-100 text-blue-700'
    return 'bg-green-100 text-green-700'
  }

  if (!profile) return <div className="text-center py-16 text-gray-400">Loading...</div>

  const totalPhotos = albums.reduce((s, a) => s + (a.photo_images?.length ?? 0), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">My Profile</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-5">
          ✅ {success}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group" style={{ width: 64, height: 64 }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-2xl font-bold">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                className="absolute inset-0 rounded-full flex items-center justify-center group-hover:bg-black/40 transition-all">
                {avatarUploading
                  ? <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  : <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">{profile.username}</h2>
              {profile.full_name && <p className="text-gray-500 text-sm">{profile.full_name}</p>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeClass(profile.role)}`}>{profile.role}</span>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
            {editing ? 'Cancel' : 'Edit profile'}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 ml-20">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
            className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50">
            {avatarUploading ? 'Uploading...' : '📷 Change photo'}
          </button>
          {profile.avatar_url && (
            <button type="button" onClick={handleRemoveAvatar}
              className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
              Remove photo
            </button>
          )}
        </div>
        {avatarError && <p className="text-xs text-red-500 mt-1 ml-20">{avatarError}</p>}

        {profile.bio && !editing && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
        )}

        {editing && (
          <div className="mt-5 flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3} placeholder="Tell the community about yourself..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600 resize-none" />
            </div>
            <button onClick={handleSave} disabled={saving}
              className="self-start px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}

        {/* ─── Danger zone ──────────────────────────────────────────────────── */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Danger zone</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
          >
            🗑️ Delete my account
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Articles',     value: articles.length,                                       color: 'text-gray-800' },
          { label: 'Published',    value: articles.filter(a => a.status === 'published').length, color: 'text-green-700' },
          { label: 'Photo Albums', value: albums.length,                                         color: 'text-pink-600' },
          { label: 'Saved',        value: favorites.length,                                      color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-5">
        {([
          { key: 'articles',  label: `Articles (${articles.length})` },
          { key: 'photos',    label: `Photo Albums (${albums.length})` },
          { key: 'favorites', label: `Saved (${favorites.length})` },
        ] as { key: typeof activeTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === t.key ? 'border-green-700 text-green-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Articles tab */}
      {activeTab === 'articles' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
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
                const t = article.article_translations?.find((t: any) => t.language === 'english') ?? article.article_translations?.[0]
                const cat = getCategoryInfo(article.category)
                return (
                  <div key={article.id}
                    onClick={() => router.push(`/articles/${article.slug}`)}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg">{cat.icon}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate text-gray-900">{t?.title ?? 'Untitled'}</p>
                        <p className="text-xs text-gray-400">{cat.label} · {timeAgo(article.updated_at ?? article.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>{article.status}</span>
                      <button onClick={e => handleToggleArticleStatus(e, article)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                          article.status === 'published'
                            ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                            : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}>
                        {article.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <Link href={`/articles/edit/${article.slug}`}
                        className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</Link>
                      <button onClick={() => handleDeleteArticle(article.id)}
                        className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Photos tab */}
      {activeTab === 'photos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{albums.length} album{albums.length !== 1 ? 's' : ''} · {totalPhotos} photos total</p>
            <Link href="/photos" className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800">
              + Upload Photos
            </Link>
          </div>
          {albums.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400 mb-3">You haven't uploaded any photos yet.</p>
              <Link href="/photos" className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
                Upload your first photos
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {albums.map(album => {
                const images = [...(album.photo_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
                const cover = images[0]
                return (
                  <div key={album.id}
                    onClick={() => router.push(`/photos/${album.id}`)}
                    className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {cover ? <img src={cover.url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📷</div>}
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-1 shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{album.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{images.length} photo{images.length !== 1 ? 's' : ''} · {timeAgo(album.created_at)}</p>
                      <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                        album.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>{album.is_public ? 'Public' : 'Hidden'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={e => handleToggleAlbumPublic(e, album)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                          album.is_public ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}>
                        {album.is_public ? 'Hide' : 'Make Public'}
                      </button>
                      <button onClick={e => { e.stopPropagation(); setEditingAlbum(album) }}
                        className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">✏️ Edit</button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteAlbum(album.id) }}
                        className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Favorites tab */}
      {activeTab === 'favorites' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {favorites.length} saved article{favorites.length !== 1 ? 's' : ''}
          </p>
          {favorites.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-2xl mb-2">🤍</p>
              <p className="text-gray-400 mb-3">No saved articles yet.</p>
              <Link href="/" className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
                Browse articles
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {favorites.map(article => {
                const t = article.article_translations?.find((t: any) => t.language === 'english')
                       ?? article.article_translations?.[0]
                const cat = getCategoryInfo(article.category)
                return (
                  <div key={article.id}
                    onClick={() => router.push(`/articles/${article.slug}`)}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg">{cat.icon}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate text-gray-900">{t?.title ?? 'Untitled'}</p>
                        <p className="text-xs text-gray-400">
                          {cat.label} · by {article.profiles?.username ?? 'Anonymous'} · {timeAgo(article.updated_at ?? article.created_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleUnfavorite(article.id) }}
                      title="Remove from saved"
                      className="shrink-0 text-xs px-2 py-1 border border-red-200 text-red-400 rounded-lg hover:bg-red-50 transition-colors">
                      Remove
                    </button>
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

      {/* Delete account modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          deleting={deleting}
        />
      )}
    </div>
  )
}