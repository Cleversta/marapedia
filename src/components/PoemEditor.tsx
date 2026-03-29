'use client'
import { useRef } from 'react'
import type { Language } from '@/types'

interface Props {
  content: string
  onChange: (html: string) => void
  thumbnailUrl?: string
  language?: Language
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

export default function PoemEditor({ content, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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