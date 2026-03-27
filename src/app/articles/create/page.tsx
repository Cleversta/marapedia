'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, LANGUAGES, createSlug, makeExcerpt } from '@/lib/utils'
import RichEditor from '@/components/RichEditor'
import ImageUpload from '@/components/ImageUpload'
import type { Language, Category } from '@/types'

interface LangContent { title: string; content: string }
type LangMap = Record<Language, LangContent>

const EMPTY: LangContent = { title: '', content: '' }

export default function CreateArticlePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentLang, setCurrentLang] = useState<Language>('english')
  const [category, setCategory] = useState<Category>('history')
  const [thumbnail, setThumbnail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [langs, setLangs] = useState<LangMap>({
    mara: { ...EMPTY },
    english: { ...EMPTY },
    myanmar: { ...EMPTY },
    mizo: { ...EMPTY },
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setUser(session.user)
    })
  }, [])

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
    const filled = getFilledLangs()
    if (filled.length === 0) {
      setError('Please write at least one language version with a title and content.')
      return
    }

    setSaving(true)
    setError('')

    // Generate slug from first available english title or any title
    const baseTitle = langs['english'].title || langs[filled[0]].title
    let slug = createSlug(baseTitle)
    // Ensure slug is unique
    const { data: existing } = await supabase.from('articles').select('id').eq('slug', slug).single()
    if (existing) slug = `${slug}-${Date.now()}`

    // Create article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert({ slug, category, status, author_id: user.id, thumbnail_url: thumbnail || null })
      .select()
      .single()

    if (articleError) {
      setError('Failed to create article: ' + articleError.message)
      setSaving(false)
      return
    }

    // Insert translations
    const translations = filled.map(lang => ({
      article_id: article.id,
      language: lang,
      title: langs[lang].title.trim(),
      content: langs[lang].content,
      excerpt: makeExcerpt(langs[lang].content, 150),
      updated_by: user.id,
    }))

    const { error: transError } = await supabase.from('article_translations').insert(translations)
    if (transError) {
      setError('Failed to save translations: ' + transError.message)
      setSaving(false)
      return
    }

    router.push(`/articles/${article.slug}`)
  }

  if (!user) return <div className="text-center py-16 text-gray-400">Loading...</div>

  const current = langs[currentLang]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Create New Article</h1>
        <div className="flex gap-2">
          <button onClick={() => handleSave('draft')} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
            Save as Draft
          </button>
          <button onClick={() => handleSave('published')} disabled={saving} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2">
          {/* Language tabs */}
          <div className="flex gap-0 border-b border-gray-200 mb-5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setCurrentLang(lang.value)}
                className={`px-4 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
                  currentLang === lang.value
                    ? 'border-green-700 text-green-700 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${hasContent(lang.value) ? 'bg-green-500' : 'bg-gray-300'}`} />
                {lang.label}
                {lang.value !== 'english' && <span className="text-xs text-gray-400">({lang.nativeLabel})</span>}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title in {LANGUAGES.find(l => l.value === currentLang)?.label}
              </label>
              <input
                type="text"
                value={current.title}
                onChange={e => updateLang(currentLang, 'title', e.target.value)}
                placeholder={`Article title in ${LANGUAGES.find(l => l.value === currentLang)?.label}...`}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content in {LANGUAGES.find(l => l.value === currentLang)?.label}
              </label>
              <RichEditor
                content={current.content}
                onChange={val => updateLang(currentLang, 'content', val)}
                placeholder={`Write article content in ${LANGUAGES.find(l => l.value === currentLang)?.label}...`}
              />
            </div>
          </div>

          {/* Language status */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Language completion</p>
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

        {/* Sidebar settings */}
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Category</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`text-left text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                    category === cat.value ? 'bg-green-50 border-green-300 text-green-800' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Thumbnail Image</h3>
            <ImageUpload onUpload={url => setThumbnail(url)} existingUrl={thumbnail} label="Upload thumbnail" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 leading-relaxed">
            <strong>Tip:</strong> You can write in one language now and add other languages later by editing the article.
          </div>
        </div>
      </div>
    </div>
  )
}
