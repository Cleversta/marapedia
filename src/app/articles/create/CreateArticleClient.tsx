'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, LANGUAGES, ARTICLE_TYPES, createSlug, makeExcerpt } from '@/lib/utils'
import RichEditor from '@/components/RichEditor'
import PoemEditor from '@/components/PoemEditor'
import SongEditor from '@/components/SongEditor'
import ImageUpload from '@/components/ImageUpload'
import type { Language, Category, Role } from '@/types'

interface LangContent { title: string; content: string }
type LangMap = Record<Language, LangContent>
interface UploadedImage { url: string; caption: string }

const EMPTY: LangContent = { title: '', content: '' }
const POEM_CATEGORIES: Category[] = ['poems']
const SONG_CATEGORIES: Category[] = ['songs']

function getEditorType(category: Category): 'rich' | 'poem' | 'song' {
  if (POEM_CATEGORIES.includes(category)) return 'poem'
  if (SONG_CATEGORIES.includes(category)) return 'song'
  return 'rich'
}

export default function CreateArticlePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<Role>('member')
  const [currentLang, setCurrentLang] = useState<Language>('mara')
  const [category, setCategory] = useState<Category>(
    (searchParams.get('category') as Category) ?? 'history'
  )
  const [articleType, setArticleType] = useState<string>('')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('') // ← NEW
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [langs, setLangs] = useState<LangMap>({
    mara: { ...EMPTY }, english: { ...EMPTY }, myanmar: { ...EMPTY }, mizo: { ...EMPTY },
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single()
      if (profile) setUserRole(profile.role as Role)
    })
  }, [])

  useEffect(() => { setArticleType('') }, [category])

  const canPublish = userRole === 'editor' || userRole === 'admin'

  function updateLang(lang: Language, field: 'title' | 'content', value: string) {
    setLangs(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }))
  }

  function hasContent(lang: Language) {
    return langs[lang].title.trim() !== '' || langs[lang].content.trim() !== ''
  }

  function getFilledLangs() {
    return (Object.keys(langs) as Language[]).filter(l => langs[l].title.trim() && langs[l].content.trim())
  }

  async function handleSave(status: 'draft' | 'published') {
    if (status === 'published' && !canPublish) {
      setError('Only editors and admins can publish articles directly.')
      return
    }
    const filled = getFilledLangs()
    if (filled.length === 0) {
      setError('Please write at least one language version with a title and content.')
      return
    }
    setSaving(true)
    setError('')

    const baseTitle = langs['english'].title || langs[filled[0]].title
    let slug = createSlug(baseTitle)
    const { data: existing } = await supabase.from('articles').select('id').eq('slug', slug).single()
    if (existing) slug = `${slug}-${Date.now()}`

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert({
        slug, category, status, author_id: user.id,
        thumbnail_url: images[0]?.url ?? null,
        article_type: articleType || null,
        source_url: sourceUrl.trim() || null, // ← NEW
      })
      .select().single()

    if (articleError) { setError('Failed to create article: ' + articleError.message); setSaving(false); return }

    if (images.length > 0) {
      await supabase.from('images').insert(
        images.map(img => ({ article_id: article.id, url: img.url, caption: img.caption || null, uploaded_by: user.id }))
      )
    }

    const translations = filled.map(lang => ({
      article_id: article.id, language: lang,
      title: langs[lang].title.trim(), content: langs[lang].content,
      excerpt: makeExcerpt(langs[lang].content, 150), updated_by: user.id,
    }))

    const { error: transError } = await supabase.from('article_translations').insert(translations)
    if (transError) { setError('Failed to save translations: ' + transError.message); setSaving(false); return }

    router.push(`/articles/${article.slug}`)
  }

  if (!user) return <div className="text-center py-16 text-gray-400">Loading...</div>

  const current = langs[currentLang]
  const editorType = getEditorType(category)
  const currentCat = CATEGORIES.find(c => c.value === category)
  const typeOptions = ARTICLE_TYPES[category] ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-5">
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
            New {currentCat?.label} Article
          </h1>
        </div>
      </div>

      {/* Reviewer notice */}
      {!canPublish && (
        <div className="mb-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          Your article will be reviewed by an editor before publishing.
        </div>
      )}

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
              <button onClick={() => setArticleType('')} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                × clear
              </button>
            )}
          </div>
        )}

        {/* ── Image strip ──────────────────────────────────────────────────── */}
        <div className={`px-5 py-2.5 border-b border-gray-100 ${images.length > 0 ? 'bg-gray-50/40' : ''}`}>
          <div className="flex items-center gap-2.5">
            {images.map((img, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img src={img.url} alt={img.caption || `Image ${i + 1}`} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                {i === 0 && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-green-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">C</span>
                )}
              </div>
            ))}
            <button onClick={() => setShowImageUpload(v => !v)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-700 transition-colors">
              <div className={`w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${showImageUpload ? 'border-green-400 text-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'}`}>
                {showImageUpload ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <span>
                {images.length > 0
                  ? `${images.length} image${images.length > 1 ? 's' : ''} · ${showImageUpload ? 'hide' : 'manage'}`
                  : showImageUpload ? 'Hide upload' : 'Add images'}
              </span>
              {images.length === 0 && <span className="text-gray-300 text-[10px]">first = cover</span>}
            </button>
          </div>
          {showImageUpload && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <ImageUpload
                onUpload={imgs => { setImages(imgs); if (imgs.length > 0) setShowImageUpload(false) }}
                existingImages={images}
                label="Upload images"
              />
            </div>
          )}
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
              {lang.value !== 'english' && <span className="text-xs text-gray-300 hidden sm:inline">({lang.nativeLabel})</span>}
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
          {editorType === 'rich' && (
            <div className="tall-editor">
              <RichEditor content={current.content} onChange={val => updateLang(currentLang, 'content', val)} />
            </div>
          )}
          {editorType === 'poem' && (
            <PoemEditor content={current.content} onChange={val => updateLang(currentLang, 'content', val)} language={currentLang} />
          )}
          {editorType === 'song' && (
            <SongEditor content={current.content} onChange={val => updateLang(currentLang, 'content', val)} language={currentLang} />
          )}
        </div>

        {/* ── Language completion ───────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Language completion</p>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setCurrentLang(lang.value)}
                className={`text-center py-2 px-1 rounded-xl border text-xs transition-all active:scale-95 ${
                  hasContent(lang.value) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                } ${currentLang === lang.value ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}
              >
                <div className="font-medium">{lang.label}</div>
                <div className="text-[9px] mt-0.5 opacity-70">{hasContent(lang.value) ? '✓ Done' : 'Empty'}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom actions ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-4">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Cancel
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 active:scale-95 transition-all"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(canPublish ? 'published' : 'draft')}
            disabled={saving}
            className="px-5 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving
              ? (canPublish ? 'Publishing...' : 'Submitting...')
              : (canPublish ? 'Publish Article' : 'Submit for Review')}
          </button>
        </div>
      </div>
    </div>
  )
}