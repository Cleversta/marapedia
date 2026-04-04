'use client'
import { useState } from 'react'

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
    .trim()
}

const MIN = 13
const MAX = 24
const DEFAULT = 17

export default function PoemViewer({ content }: { content: string }) {
  const [fontSize, setFontSize] = useState(DEFAULT)

  const text = htmlToText(content)
  if (!text) return <div className="text-gray-400 italic">No poem content.</div>

  const stanzas = text.split(/\n\n+/).filter(s => s.trim())

  return (
    <div className="poem-viewer max-w-xl mx-auto">
      {/* Font size control */}
      <div className="flex justify-end items-center gap-2 mb-4">
        <button
          onClick={() => setFontSize(v => Math.max(MIN, v - 1))}
          disabled={fontSize <= MIN}
          className="w-7 h-7 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Decrease font size"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="text-xs font-semibold text-gray-400 w-6 text-center tabular-nums">{fontSize}</span>
        <button
          onClick={() => setFontSize(v => Math.min(MAX, v + 1))}
          disabled={fontSize >= MAX}
          className="w-7 h-7 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Increase font size"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Poem */}
      <div className="flex flex-col gap-6">
        {stanzas.map((stanza, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {stanza.split('\n').map((line, j) => (
              <p
                key={j}
                className="text-gray-800"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.9',
                }}
              >
                {line || '\u00a0'}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}