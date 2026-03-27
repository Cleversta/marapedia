'use client'
import { useState } from 'react'
import type { Language } from '@/types'

interface Section {
  id: string
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus' | 'custom'
  label: string
  content: string
}

interface SongMeta {
  key: string
  writer: string
  singer: string
  reference: string
  timeSignature: string
  songNumber: string
}

interface Props {
  content: string
  onChange: (html: string) => void
  language: Language
}

const SECTION_TYPES = [
  { type: 'verse',      label: 'Verse',      color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { type: 'chorus',     label: 'Chorus',     color: 'bg-green-50 border-green-200 text-green-700' },
  { type: 'bridge',     label: 'Bridge',     color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { type: 'intro',      label: 'Intro',      color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { type: 'outro',      label: 'Outro',      color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { type: 'pre-chorus', label: 'Pre-Chorus', color: 'bg-teal-50 border-teal-200 text-teal-700' },
] as const

const MUSICAL_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'Db', 'Eb', 'F#', 'Gb', 'Ab', 'Bb']
const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4', '12/8']

function getSectionStyle(type: string) {
  return SECTION_TYPES.find(s => s.type === type)?.color ?? 'bg-gray-50 border-gray-200 text-gray-700'
}

function serialize(sections: Section[], meta: SongMeta): string {
  const metaComment = `<!--meta:${JSON.stringify(meta)}-->`
  const sectionsHtml = sections
    .filter(s => s.content.trim())
    .map(s =>
      `<div class="song-section" data-type="${s.type}" data-label="${s.label}"><h4>[${s.label}]</h4>${
        s.content.split('\n').map(l => `<p>${l || '&nbsp;'}</p>`).join('')
      }</div>`
    )
    .join('\n')
  return metaComment + '\n' + sectionsHtml
}

function htmlToSections(html: string): Section[] {
  if (!html || html === '<p></p>') return []
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const divs = doc.querySelectorAll('.song-section')
    if (divs.length === 0) return []
    return Array.from(divs).map((div, i) => {
      const type = (div.getAttribute('data-type') ?? 'verse') as Section['type']
      const label = div.getAttribute('data-label') ?? 'Verse'
      const paragraphs = Array.from(div.querySelectorAll('p'))
      const content = paragraphs.map(p => p.textContent === '\u00a0' ? '' : (p.textContent ?? '')).join('\n')
      return { id: String(i), type, label, content }
    })
  } catch { return [] }
}

function htmlToMeta(html: string): SongMeta {
  const empty: SongMeta = { key: '', writer: '', singer: '', reference: '', timeSignature: '', songNumber: '' }
  const match = html?.match(/<!--meta:(.*?)-->/)
  if (!match) return empty
  try { return { ...empty, ...JSON.parse(match[1]) } } catch { return empty }
}

function makeId() { return Math.random().toString(36).slice(2, 8) }

function makeLabel(sections: Section[], type: string) {
  const sameType = sections.filter(s => s.type === type)
  const base = SECTION_TYPES.find(s => s.type === type)?.label ?? 'Verse'
  if (['chorus', 'bridge', 'intro', 'outro'].includes(type)) return base
  return sameType.length === 0 ? base : `${base} ${sameType.length + 1}`
}

const LANG_PLACEHOLDERS: Record<Language, string> = {
  english: 'Write your lyrics here...',
  mara: 'ကြိုင်ႈ ကညီႈ...',
  myanmar: 'သီချင်းသားများ ရေးပါ...',
  mizo: 'Hla ziak rawh...',
}

export default function SongEditor({ content, onChange, language }: Props) {
  const [sections, setSections] = useState<Section[]>(() => {
    const parsed = typeof window !== 'undefined' ? htmlToSections(content) : []
    return parsed.length > 0 ? parsed : [
      { id: makeId(), type: 'verse', label: 'Verse 1', content: '' },
      { id: makeId(), type: 'chorus', label: 'Chorus', content: '' },
    ]
  })

  const [meta, setMeta] = useState<SongMeta>(() =>
    typeof window !== 'undefined' ? htmlToMeta(content) : { key: '', writer: '', singer: '', reference: '', timeSignature: '', songNumber: '' }
  )

  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showMeta, setShowMeta] = useState(false)

  function updateMeta(field: keyof SongMeta, value: string) {
    const next = { ...meta, [field]: value }
    setMeta(next)
    onChange(serialize(sections, next))
  }

  function updateSection(id: string, content: string) {
    setSections(prev => {
      const next = prev.map(s => s.id === id ? { ...s, content } : s)
      onChange(serialize(next, meta))
      return next
    })
  }

  function addSection(type: string) {
    setSections(prev => {
      const label = makeLabel(prev, type)
      const next = [...prev, { id: makeId(), type: type as Section['type'], label, content: '' }]
      onChange(serialize(next, meta))
      return next
    })
    setShowAddMenu(false)
  }

  function removeSection(id: string) {
    setSections(prev => {
      const next = prev.filter(s => s.id !== id)
      onChange(serialize(next, meta))
      return next
    })
  }

  function moveSection(id: string, direction: 'up' | 'down') {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (direction === 'up' && idx === 0) return prev
      if (direction === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = direction === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      onChange(serialize(next, meta))
      return next
    })
  }

  const placeholder = LANG_PLACEHOLDERS[language] ?? LANG_PLACEHOLDERS['english']

  return (
    <div className="song-editor">
      {/* Song metadata panel */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMeta(!showMeta)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-blue-800"
        >
          <span>🎵 Song details (key, writer, singer...)</span>
          <span className="text-blue-400">{showMeta ? '▲' : '▼'}</span>
        </button>

        {showMeta && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-blue-200 pt-3">
            <div>
              <label className="block text-xs text-blue-700 mb-1">Song Number</label>
              <input type="text" value={meta.songNumber} onChange={e => updateMeta('songNumber', e.target.value)}
                placeholder="e.g. 541"
                className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Key (Doh is...)</label>
              <select value={meta.key} onChange={e => updateMeta('key', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Select key</option>
                {MUSICAL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Time Signature</label>
              <select value={meta.timeSignature} onChange={e => updateMeta('timeSignature', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Select time</option>
                {TIME_SIGNATURES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Bible Reference</label>
              <input type="text" value={meta.reference} onChange={e => updateMeta('reference', e.target.value)}
                placeholder="e.g. Biepihuah 7:13"
                className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Written by</label>
              <input type="text" value={meta.writer} onChange={e => updateMeta('writer', e.target.value)}
                placeholder="Songwriter name"
                className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Sung by / Artist</label>
              <input type="text" value={meta.singer} onChange={e => updateMeta('singer', e.target.value)}
                placeholder="Artist or group name"
                className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
            </div>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {sections.map((section, idx) => {
          const style = getSectionStyle(section.type)
          const parts = style.split(' ')
          return (
            <div key={section.id} className={`rounded-xl border overflow-hidden ${parts[0]} ${parts[1]}`}>
              <div className={`flex items-center justify-between px-3 py-2 border-b ${parts[1]}`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${parts[2]}`}>
                  {section.label}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveSection(section.id, 'up')} disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveSection(section.id, 'down')} disabled={idx === sections.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removeSection(section.id)}
                    className="p-1 text-gray-300 hover:text-red-400 ml-1">×</button>
                </div>
              </div>
              <textarea
                value={section.content}
                onChange={e => updateSection(section.id, e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full px-4 py-3 bg-white resize-none focus:outline-none text-sm leading-relaxed text-gray-700 placeholder-gray-300 font-mono"
              />
            </div>
          )
        })}
      </div>

      {/* Add section */}
      <div className="relative mt-3">
        <button type="button" onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors flex items-center justify-center gap-2">
          <span className="text-lg leading-none">+</span> Add section
        </button>
        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-10">
            <div className="grid grid-cols-3 gap-1">
              {SECTION_TYPES.map(s => (
                <button key={s.type} type="button" onClick={() => addSection(s.type)}
                  className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${s.color}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-4 text-xs text-gray-400">
        <span>{sections.length} sections</span>
        <span>{sections.reduce((a, s) => a + s.content.split('\n').filter(l => l.trim()).length, 0)} lines</span>
      </div>
    </div>
  )
}