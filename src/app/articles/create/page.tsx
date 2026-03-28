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

const CATEGORY_META: Record<string, { hint: string; titlePlaceholder: string }> = {
  history:  { hint: 'Write a detailed historical account with headings, dates, and key events.', titlePlaceholder: 'e.g. The Migration of the Mara People' },
  songs:    { hint: 'Add verses, chorus, and bridge sections. You can label each section.', titlePlaceholder: 'Song title / name of the tune' },
  poems:    { hint: 'Write one line per row. Use blank lines to separate stanzas.', titlePlaceholder: 'Poem title' },
  stories:  { hint: 'Share a traditional story, folktale, or narrative.', titlePlaceholder: 'Story title' },
  people:   { hint: 'Write a biography — early life, achievements, legacy.', titlePlaceholder: 'Full name of the person' },
  places:   { hint: 'Describe the village — location, history, notable features.', titlePlaceholder: 'Village or place name' },
  culture:  { hint: 'Document a cultural practice, festival, or tradition.', titlePlaceholder: 'e.g. Chapchar Kut Festival' },
  religion: { hint: 'Write about religious beliefs, practices, or history.', titlePlaceholder: 'e.g. Christianity among the Mara people' },
  language: { hint: 'Document language, dialects, vocabulary, or grammar.', titlePlaceholder: 'e.g. Tlosai Dialect Guide' },
  other:    { hint: 'Anything else worth preserving about the Mara people.', titlePlaceholder: 'Article title' },
}

export default function CreateArticlePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<Role>('member')
  const [currentLang, setCurrentLang] = useState<Language>('english')
  const [category, setCategory] = useState<Category>(
    (searchParams.get('category') as Category) ?? 'history'
  )
  const [articleType, setArticleType] = useState<string>('')
  const [images, setImages] = useState<UploadedImage[]>([])
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

  // Only editors and admins can publish directly
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
      .insert({ slug, category, status, author_id: user.id, thumbnail_url: images[0]?.url ?? null, article_type: articleType || null })
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
  const meta = CATEGORY_META[category] ?? CATEGORY_META['other']
  const currentCat = CATEGORIES.find(c => c.value === category)
  const typeOptions = ARTICLE_TYPES[category] ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{currentCat?.icon} New {currentCat?.label} Article</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.hint}</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Members see a notice */}
          {!canPublish && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hidden md:block">
              Your article will be reviewed by an editor before publishing.
            </p>
          )}
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
            Save Draft
          </button>
          {/* Editors/admins see Publish, members see Submit for Review */}
          {canPublish ? (
            <button onClick={() => handleSave('published')} disabled={saving}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50 transition-colors">
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          ) : (
            <button onClick={() => handleSave('draft')} disabled={saving}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50 transition-colors">
              {saving ? 'Submitting...' : 'Submit for Review'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile notice for members */}
      {!canPublish && (
        <div className="md:hidden mb-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          Your article will be reviewed by an editor before publishing.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Language tabs */}
          <div className="flex gap-0 border-b border-gray-200 mb-5">
            {LANGUAGES.map(lang => (
              <button key={lang.value} onClick={() => setCurrentLang(lang.value)}
                className={`px-4 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
                  currentLang === lang.value ? 'border-green-700 text-green-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasContent(lang.value) ? 'bg-green-500' : 'bg-gray-300'}`} />
                {lang.label}
                {lang.value !== 'english' && <span className="text-xs text-gray-400">({lang.nativeLabel})</span>}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="mb-4">
            <input type="text" value={current.title} onChange={e => updateLang(currentLang, 'title', e.target.value)}
              placeholder={meta.titlePlaceholder}
              className={`w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-green-600 focus:outline-none bg-transparent transition-colors
                ${editorType === 'poem' ? 'text-2xl font-display text-center' : 'text-xl font-display'}`} />
          </div>

          {editorType === 'rich' && <RichEditor content={current.content} onChange={val => updateLang(currentLang, 'content', val)}
            placeholder={`Write article content in ${LANGUAGES.find(l => l.value === currentLang)?.label}...`} />}
          {editorType === 'poem' && <PoemEditor content={current.content} onChange={val => updateLang(currentLang, 'content', val)} language={currentLang} />}
          {editorType === 'song' && <SongEditor content={current.content} onChange={val => updateLang(currentLang, 'content', val)} language={currentLang} />}

          {/* Language completion */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Language completion</p>
            <div className="grid grid-cols-4 gap-2">
              {LANGUAGES.map(lang => (
                <button key={lang.value} onClick={() => setCurrentLang(lang.value)}
                  className={`text-center p-2 rounded-lg border text-xs transition-colors ${
                    hasContent(lang.value) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}>
                  <div className="font-medium">{lang.label}</div>
                  <div>{hasContent(lang.value) ? '✓ Done' : 'Empty'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Category */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Category</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button" onClick={() => setCategory(cat.value as Category)}
                  className={`text-left text-xs px-2 py-2 rounded-lg border transition-colors ${
                    category === cat.value ? 'bg-green-50 border-green-300 text-green-800 font-medium' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Article type */}
          {typeOptions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-1">Type</h3>
              <p className="text-xs text-gray-400 mb-3">What kind of {currentCat?.label.toLowerCase()} is this?</p>
              <div className="flex flex-col gap-1">
                {typeOptions.map(t => (
                  <button key={t.value} type="button" onClick={() => setArticleType(t.value)}
                    className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                      articleType === t.value ? 'bg-green-50 border-green-300 text-green-800 font-medium' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {articleType && (
                <button onClick={() => setArticleType('')} className="mt-2 text-xs text-gray-400 hover:text-red-400 transition-colors">
                  × Clear selection
                </button>
              )}
            </div>
          )}

          {/* Images */}
          {editorType !== 'poem' && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-1">Images</h3>
              <p className="text-xs text-gray-400 mb-3">First image will be used as the article cover.</p>
              <ImageUpload onUpload={imgs => setImages(imgs)} existingImages={images} label="Upload images" />
            </div>
          )}

          {/* Hint */}
          <div className={`rounded-xl p-4 text-xs leading-relaxed border ${
            editorType === 'poem' ? 'bg-purple-50 border-purple-200 text-purple-700'
            : editorType === 'song' ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {editorType === 'poem' && <><strong>Writing a poem?</strong> Each line becomes a verse line. Press Enter for a new line, blank line for a new stanza.</>}
            {editorType === 'song' && <><strong>Writing song lyrics?</strong> Add sections like Verse, Chorus, and Bridge using the + button.</>}
            {editorType === 'rich' && <><strong>Tip:</strong> You can write in one language now and add other languages later by editing the article.</>}
          </div>
        </div>
      </div>
    </div>
  )
}