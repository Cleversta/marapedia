'use client'
import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  content: string
  onChange: (html: string) => void
  thumbnailUrl?: string
  onThumbnailChange?: (url: string) => void
}

function htmlToText(html: string): string {
  if (!html || html === '<p></p>') return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function textToHtml(text: string): string {
  if (!text.trim()) return ''
  return text
    .split(/\n\n+/)
    .map(stanza => `<p>${stanza.split('\n').join('<br />')}</p>`)
    .join('\n')
}

export default function PoemEditor({ content, onChange, thumbnailUrl, onThumbnailChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const text = htmlToText(content)
  const lineCount = text ? text.split('\n').length : 0
  const stanzaCount = text ? text.split(/\n\n+/).filter(s => s.trim()).length : 0
  const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    onChange(textToHtml(val))
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB.')
      return
    }
    setUploadError('')
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `poems/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('article-images').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(path)
      onThumbnailChange?.(publicUrl)
    } catch (e: any) {
      setUploadError(e.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadImage(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadImage(file)
  }

  function handleRemoveImage() {
    onThumbnailChange?.('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="poem-editor-wrap space-y-3">
      <style>{`
        .poem-textarea::placeholder {
          color: #d1b8b0;
          font-style: italic;
          opacity: 1;
        }
        .poem-textarea:focus::placeholder {
          opacity: 0.4;
          transition: opacity 0.2s ease;
        }
        .poem-line-num {
          font-family: 'ui-monospace', monospace;
          font-size: 11px;
          line-height: 1.9rem;
          color: #d8b4b4;
          text-align: right;
          padding-right: 10px;
          user-select: none;
        }
      `}</style>

      {/* ── Header bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-gray-600">✍️ Poem Editor</span>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          {wordCount > 0 && <span>{wordCount} words</span>}
          {lineCount > 0 && <span>{lineCount} lines</span>}
          {stanzaCount > 0 && <span>{stanzaCount} {stanzaCount === 1 ? 'stanza' : 'stanzas'}</span>}
        </div>
      </div>

      {/* ── Cover image ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-rose-100 overflow-hidden bg-white shadow-sm">
        <div className="px-4 py-2.5 border-b border-rose-100 flex items-center gap-2 bg-rose-50/40">
          <span className="text-sm">🖼️</span>
          <span className="text-sm font-semibold text-gray-600">Cover Image</span>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-auto">Optional</span>
        </div>

        <div className="p-4">
          {thumbnailUrl ? (
            /* Preview */
            <div className="relative group rounded-xl overflow-hidden border border-gray-200">
              <img
                src={thumbnailUrl}
                alt="Cover"
                className="w-full h-52 object-cover"
              />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            /* Drop zone */
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 h-44 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150
                ${dragOver
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-rose-200 bg-rose-50/30 hover:border-rose-300 hover:bg-rose-50/60'
                }`}
            >
              {uploading ? (
                <>
                  <div className="w-8 h-8 rounded-full border-2 border-rose-300 border-t-rose-500 animate-spin" />
                  <p className="text-sm text-rose-500 font-medium">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      Drop image here, or <span className="text-rose-500">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP · Max 5MB</p>
                  </div>
                </>
              )}
            </div>
          )}

          {uploadError && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {uploadError}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      {/* ── Main writing area ─────────────────────────────────────────────────── */}
      <div
        className="relative rounded-xl overflow-hidden border border-rose-100 shadow-sm"
        style={{ background: 'linear-gradient(to bottom right, #FDFCF9, #FDF8F5)' }}
      >
        {/* Top accent */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, #f9a8d4, #fca5a5, #fdba74)' }} />

        {/* Watermark */}
        <div className="absolute right-6 top-6 text-[80px] leading-none select-none pointer-events-none opacity-[0.03] rotate-12">
          ✍
        </div>

        <div className="flex min-h-[480px]">
          {/* Line numbers */}
          <div className="shrink-0 w-11 pt-7 pb-5 flex flex-col bg-rose-50/40 border-r border-rose-100/60">
            {(text || ' ').split('\n').map((_, i) => (
              <span key={i} className="poem-line-num">{i + 1}</span>
            ))}
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            {/* Ruled lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent calc(1.9rem - 1px), #f3e8e8 calc(1.9rem - 1px), #f3e8e8 1.9rem)',
              backgroundPositionY: '28px',
            }} />
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              placeholder={"Write your poem here...\n\nPress Enter for a new line.\nLeave a blank line to start a new stanza."}
              rows={18}
              spellCheck
              className="poem-textarea relative z-10 w-full pt-7 pb-6 pr-8 pl-5 bg-transparent resize-none focus:outline-none text-gray-800 min-h-[480px]"
              style={{
                fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
                fontSize: '17px',
                lineHeight: '1.9rem',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-rose-100 px-4 py-2.5 flex items-center justify-between bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{ background: text.trim() ? '#f87171' : '#d1d5db' }} />
            <span className="text-[11px] text-gray-400 font-medium">
              {text.trim() ? 'Draft' : 'Empty'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 italic hidden sm:block">
            ↵ new line &nbsp;·&nbsp; ↵↵ new stanza
          </p>
        </div>
      </div>
    </div>
  )
}