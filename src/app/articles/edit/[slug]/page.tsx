'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, LANGUAGES, makeExcerpt } from '@/lib/utils'
import RichEditor from '@/components/RichEditor'
import ImageUpload from '@/components/ImageUpload'
import type { Language, Category, Article } from '@/types'

export default function EditArticlePage() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [currentLang, setCurrentLang] = useState<Language>((searchParams.get('lang') as Language) ?? 'english')
  const [category, setCategory] = useState<Category>('history')
  const [thumbnail, setThumbnail] = useState('')
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [langs, setLangs] = useState<Record<Language, { title: string; content: string }>>({
    mara: { title: '', content: '' },
    english: { title: '', content: '' },
    myanmar: { title: '', content: '' },
    mizo: { title: '', content: '' },
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data))
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
    setCategory(data.category)
    setThumbnail(data.thumbnail_url ?? '')
    setFeatured(data.featured ?? false)

    const newLangs = { mara: { title: '', content: '' }, english: { title: '', content: '' }, myanmar: { title: '', content: '' }, mizo: { title: '', content: '' } }
    data.article_translations?.forEach((t: any) => {
      newLangs[t.language as Language] = { title: t.title, content: t.content }
    })
    setLangs(newLangs)
  }

  function updateLang(lang: Language, field: 'title' | 'content', value: string) {
    setLangs(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }))
  }

  function hasContent(lang: Language) {
    return langs[lang].title.trim() !== '' || langs[lang].content.trim() !== ''
  }

  async function handleSave() {
    if (!article || !user) return
    setSaving(true)
    setError('')
    setSuccess('')

    // Check permission
    const canEdit = profile?.role === 'admin' || article.author_id === user.id
    if (!canEdit) { setError('You do not have permission to edit this article.'); setSaving(false); return }

    // Save revision for current lang if has content
    const existing = article.article_translations?.find(t => t.language === currentLang)
    if (existing && langs[currentLang].title) {
      await supabase.from('article_revisions').insert({
        article_id: article.id,
        language: currentLang,
        title: existing.title,
        content: existing.content,
        edited_by: user.id,
      })
    }

    // Update article meta
    await supabase.from('articles').update({
      category,
      thumbnail_url: thumbnail || null,
      featured,
      updated_at: new Date().toISOString(),
    }).eq('id', article.id)

    // Upsert all filled translations
    const filled = (Object.keys(langs) as Language[]).filter(l => langs[l].title.trim() && langs[l].content.trim())
    for (const lang of filled) {
      await supabase.from('article_translations').upsert({
        article_id: article.id,
        language: lang,
        title: langs[lang].title.trim(),
        content: langs[lang].content,
        excerpt: makeExcerpt(langs[lang].content, 150),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'article_id,language' })
    }

    setSuccess('Article saved successfully!')
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  if (!article) return <div className="text-center py-16 text-gray-400">Loading...</div>

  const current = langs[currentLang]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Edit Article</h1>
        <div className="flex gap-2 items-center">
          {success && <span className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">{success}</span>}
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Language tabs */}
          <div className="flex gap-0 border-b border-gray-200 mb-5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setCurrentLang(lang.value)}
                className={`px-4 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
                  currentLang === lang.value ? 'border-green-700 text-green-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${hasContent(lang.value) ? 'bg-green-500' : 'bg-gray-300'}`} />
                {lang.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title in {LANGUAGES.find(l => l.value === currentLang)?.label}</label>
              <input
                type="text"
                value={current.title}
                onChange={e => updateLang(currentLang, 'title', e.target.value)}
                placeholder={`Title in ${LANGUAGES.find(l => l.value === currentLang)?.label}...`}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <RichEditor
                content={current.content}
                onChange={val => updateLang(currentLang, 'content', val)}
                placeholder="Write content here..."
              />
            </div>
          </div>

          {/* Language status */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-2 font-medium">Language completion</p>
            <div className="grid grid-cols-4 gap-2">
              {LANGUAGES.map(lang => (
                <div key={lang.value} className={`text-center p-2 rounded-lg border text-xs ${hasContent(lang.value) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-400'}`}>
                  <div className="font-medium">{lang.label}</div>
                  <div>{hasContent(lang.value) ? '✓ Done' : 'Empty'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Category</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                  className={`text-left text-xs px-2 py-1.5 rounded-lg border transition-colors ${category === cat.value ? 'bg-green-50 border-green-300 text-green-800' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Thumbnail</h3>
            <ImageUpload onUpload={url => setThumbnail(url)} existingUrl={thumbnail} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="w-4 h-4 accent-green-700" />
              <span className="text-sm font-medium">Featured article</span>
            </label>
            <p className="text-xs text-gray-400 mt-1">Featured articles appear on the homepage.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
