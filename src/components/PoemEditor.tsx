'use client'
import { useRef, useCallback } from 'react'
import type { Language } from '@/types'

interface Props {
  content: string
  onChange: (html: string) => void
  language: Language
}

const LANG_PLACEHOLDERS: Record<Language, string[]> = {
  english: [
    'The mountains stand in silence...',
    'Where rivers meet the ancient stone,',
    'Our people walked these paths before,',
    'And left their songs in wind alone.',
  ],
  mara: ['ကြိုင်ႈ ကညီႈ ပိင်းဆုင်ႈ...'],
  myanmar: ['တောင်တန်းများ တိတ်ဆိတ်စွာ ရပ်နေ...'],
  mizo: ['Tlang tluang zawng zawng...'],
}

// We store poem as HTML but with a simple pre-formatted structure.
// Internally we work with plain text and convert on save.
function htmlToText(html: string): string {
  if (!html || html === '<p></p>') return ''
  // Convert <br> and </p><p> to newlines, strip all other tags
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
  // Split into stanzas by double newline
  const stanzas = text.split(/\n\n+/)
  return stanzas
    .map(stanza => {
      const lines = stanza.split('\n')
      return `<p>${lines.join('<br />')}</p>`
    })
    .join('\n')
}

export default function PoemEditor({ content, onChange, language }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const placeholders = LANG_PLACEHOLDERS[language] ?? LANG_PLACEHOLDERS['english']
  const placeholderText = placeholders.join('\n')

  const text = htmlToText(content)

  const lineCount = text ? text.split('\n').length : 0
  const stanzaCount = text ? text.split(/\n\n+/).filter(s => s.trim()).length : 0

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    onChange(textToHtml(val))
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  return (
    <div className="poem-editor-wrap">
      {/* Poem writing area */}
      <div className="relative bg-[#FDFCF8] border border-gray-200 rounded-xl overflow-hidden">
        {/* Decorative left rule — like a notebook */}
        <div className="absolute left-12 top-0 bottom-0 w-px bg-rose-100 pointer-events-none" />

        <div className="flex">
          {/* Line numbers */}
          <div className="w-12 pt-6 pb-4 flex flex-col items-end pr-2 select-none shrink-0">
            {(text || ' ').split('\n').map((_, i) => (
              <span key={i} className="text-xs text-rose-200 leading-[1.9rem] font-mono">
                {i + 1}
              </span>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            placeholder={placeholderText}
            rows={12}
            spellCheck
            className="flex-1 pt-6 pb-6 pr-6 pl-3 bg-transparent resize-none focus:outline-none font-display text-lg leading-[1.9rem] text-gray-800 placeholder-gray-300 min-h-[300px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          />
        </div>

        {/* Footer stats */}
        <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between bg-white">
          <div className="flex gap-4 text-xs text-gray-400">
            <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
            <span>{stanzaCount} {stanzaCount === 1 ? 'stanza' : 'stanzas'}</span>
          </div>
          <p className="text-xs text-gray-400 italic">
            Press Enter for new line · Blank line for new stanza
          </p>
        </div>
      </div>

      <style jsx>{`
        textarea::placeholder {
          color: #d1d5db;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}