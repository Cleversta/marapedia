'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, LANGUAGES, ARTICLE_TYPES, makeExcerpt } from '@/lib/utils'
import RichEditor from '@/components/RichEditor'
import PoemEditor from '@/components/PoemEditor'
import SongEditor from '@/components/SongEditor'
import ImageUpload from '@/components/ImageUpload'
import type { Language, Category, Article } from '@/types'

interface UploadedImage { url: string; caption: string }

const POEM_CATEGORIES: Category[] = ['poems']
const SONG_CATEGORIES: Category[] = ['songs']

function getEditorType(category: Category): 'rich' | 'poem' | 'song' {
  if (POEM_CATEGORIES.includes(category)) return 'poem'
  if (SONG_CATEGORIES.includes(category)) return 'song'
  return 'rich'
}


export default function EditArticlePage() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>((searchParams.get('lang') as Language) ?? 'mara')
  const [category, setCategory] = useState<Category>('history')
  const [articleType, setArticleType] = useState<string>('')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [featured, setFeatured] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [langs, setLangs] = useState<Record<Language, { title: string; content: string }>>({
    mara: { title: '', content: '' }, english: { title: '', content: '' },
    myanmar: { title: '', content: '' }, mizo: { title: '', content: '' },
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setProfile(data))
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
    setFeatured(data.featured ?? false)
    setArticleType(data.article_type ?? '')
    setSourceUrl(data.source_url ?? '')

    const newLangs = {
      mara: { title: '', content: '' }, english: { title: '', content: '' },
      myanmar: { title: '', content: '' }, mizo: { title: '', content: '' },
    }
    data.article_translations?.forEach((t: any) => {
      newLangs[t.language as Language] = { title: t.title, content: t.content }
    })
    setLangs(newLangs)

    const { data: existingImages } = await supabase
      .from('images').select('url, caption').eq('article_id', data.id)
      .order('created_at', { ascending: true })
    setImages((existingImages ?? []).map(img => ({ url: img.url, caption: img.caption ?? '' })))

    setLoaded(true)
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

    const canEdit = profile?.role === 'admin' || article.author_id === user.id
    if (!canEdit) {
      setError('You do not have permission to edit this article.')
      setSaving(false)
      return
    }

    const existing = article.article_translations?.find(t => t.language === currentLang)
    if (existing && langs[currentLang].title) {
      await supabase.from('article_revisions').insert({
        article_id: article.id, language: currentLang,
        title: existing.title, content: existing.content, edited_by: user.id,
      })
    }

    await supabase.from('articles').update({
      category,
      article_type: articleType || null,
      thumbnail_url: images[0]?.url ?? null,
      featured,
      source_url: sourceUrl.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', article.id)

    // FIX: Check delete error before inserting to prevent silent-fail duplication.
    // If delete fails (e.g. RLS mismatch), we must NOT proceed with the insert —
    // otherwise images accumulate on every save (1 → 2 → 4 → …).
    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .eq('article_id', article.id)

    if (deleteError) {
      setError('Failed to update images: ' + deleteError.message)
      setSaving(false)
      return
    }

    if (images.length > 0) {
      const { error: insertError } = await supabase.from('images').insert(
        images.map(img => ({
          article_id: article.id,
          url: img.url,
          caption: img.caption || null,
          uploaded_by: user.id,
        }))
      )
      if (insertError) {
        setError('Failed to save images: ' + insertError.message)
        setSaving(false)
        return
      }
    }

    const filled = (Object.keys(langs) as Language[])
      .filter(l => langs[l].title.trim() && langs[l].content.trim())

    for (const lang of filled) {
      await supabase.from('article_translations').upsert({
        article_id: article.id, language: lang,
        title: langs[lang].title.trim(),
        content: langs[lang].content,
        excerpt: makeExcerpt(langs[lang].content, 150),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'article_id,language' })
    }

    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    setSaving(false)
    router.push(`/articles/${slug}`)
  }

  if (!article) return <div className="text-center py-16 text-gray-400">Loading...</div>

  const current = langs[currentLang]
  const editorType = getEditorType(category)
  const currentCat = CATEGORIES.find(c => c.value === category)
  const typeOptions = ARTICLE_TYPES[category] ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentCat?.icon}</span>
            <h1 className="font-display text-lg font-bold text-gray-900">
              Edit {currentCat?.label} Article
            </h1>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {success && (
            <span className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
              {success}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Main card ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        {/* ── Type selector ────────────────────────────────────────────────── */}
        {typeOptions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-5 pt-3 pb-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 shrink-0">Type:</span>
            {typeOptions.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setArticleType(prev => prev === t.value ? '' : t.value)}
                className={`text-xs px-3 py-1 rounded-full border transition-all active:scale-95 ${
                  articleType === t.value
                    ? 'bg-green-700 border-green-700 text-white font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
            {articleType && (
              <button
                onClick={() => setArticleType('')}
                className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              >
                × clear
              </button>
            )}
          </div>
        )}

        {/* ── Image strip ──────────────────────────────────────────────────── */}
        {/*
          FIX: Previously this section rendered images TWICE:
            1. As small thumbnails via {images.map(...)}
            2. Again as full preview cards inside <ImageUpload existingImages={images} />
          Both read from the same `images` state, so every image appeared twice in the UI.
          The fix is to render ImageUpload directly — it already handles its own previews.
        */}
        <div className={`px-5 py-3 border-b border-gray-100 ${images.length > 0 ? 'bg-gray-50/40' : ''}`}>
          <ImageUpload
            onUpload={imgs => setImages(imgs)}
            existingImages={images}
            label={images.length > 0
              ? `${images.length} image${images.length > 1 ? 's' : ''} · manage`
              : 'Add images'}
          />
        </div>

        {/* ── Source URL ───────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <input
            type="url"
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            placeholder="Source / related link (optional)  e.g. https://..."
            className="flex-1 text-sm text-gray-600 placeholder:text-gray-300 bg-transparent outline-none"
          />
          {sourceUrl && (
            <button
              type="button"
              onClick={() => setSourceUrl('')}
              className="text-gray-300 hover:text-red-400 transition-colors text-xs flex-shrink-0"
            >
              × clear
            </button>
          )}
        </div>

        {/* ── Language tabs ─────────────────────────────────────────────────── */}
        <div className="flex gap-0 border-b border-gray-100 px-5">
          {LANGUAGES.map(lang => (
            <button
              key={lang.value}
              onClick={() => setCurrentLang(lang.value)}
              className={`px-3 py-2.5 text-sm flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
                currentLang === lang.value
                  ? 'border-green-700 text-green-700 font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasContent(lang.value) ? 'bg-green-500' : 'bg-gray-300'}`} />
              {lang.label}
              {lang.value !== 'english' && (
                <span className="text-xs text-gray-300 hidden sm:inline">({lang.nativeLabel})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Title ─────────────────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-2">
          <input
            type="text"
            value={current.title}
            onChange={e => updateLang(currentLang, 'title', e.target.value)}
            placeholder={
              editorType === 'poem' ? 'Poem title...'
              : editorType === 'song' ? 'Song title...'
              : 'Article title...'
            }
            className="w-full border-0 focus:outline-none bg-transparent placeholder:text-gray-300 text-2xl font-display text-center py-2"
          />
        </div>

        <div className="mx-5 border-b border-gray-100 mb-1" />

        {/* ── Editor ────────────────────────────────────────────────────────── */}
        <div className="px-5 pb-5">
          <style>{`
            .tall-editor .ProseMirror { min-height: 500px !important; }
            .tall-editor .px-4.py-3 { min-height: 540px !important; }
          `}</style>

          {!loaded ? (
            <div className="flex items-center justify-center py-16 text-gray-300 text-sm">
              Loading content...
            </div>
          ) : (
            <>
              {editorType === 'rich' && (
                <div className="tall-editor">
                  <RichEditor
                    content={current.content}
                    onChange={val => updateLang(currentLang, 'content', val)}
                  />
                </div>
              )}
              {editorType === 'poem' && (
                <PoemEditor
                  content={current.content}
                  onChange={val => updateLang(currentLang, 'content', val)}
                />
              )}
              {editorType === 'song' && (
                <SongEditor
                  key={currentLang}
                  content={current.content}
                  onChange={val => updateLang(currentLang, 'content', val)}
                  language={currentLang}
                />
              )}
            </>
          )}
        </div>

        {/* ── Language completion ───────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">
            Language completion
          </p>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setCurrentLang(lang.value)}
                className={`text-center py-2 px-1 rounded-xl border text-xs transition-all active:scale-95 ${
                  hasContent(lang.value)
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                } ${currentLang === lang.value ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}
              >
                <div className="font-medium">{lang.label}</div>
                <div className="text-[9px] mt-0.5 opacity-70">
                  {hasContent(lang.value) ? '✓ Done' : 'Empty'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom actions ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Cancel
        </button>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 mr-2">
            <input
              type="checkbox"
              checked={featured}
              onChange={e => setFeatured(e.target.checked)}
              className="w-3.5 h-3.5 accent-green-700"
            />
            Featured
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}