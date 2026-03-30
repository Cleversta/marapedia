'use client'
import { useState } from 'react'
import type { Language } from '@/types'

interface Section {
  id: string
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus' | 'custom'
  label: string
  content: string
  chords: string
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
  { type: 'verse',      label: 'Verse',      accent: '#3b82f6', bg: '#eff6ff', badge: 'bg-blue-100 text-blue-700' },
  { type: 'chorus',     label: 'Chorus',     accent: '#16a34a', bg: '#f0fdf4', badge: 'bg-green-100 text-green-700' },
  { type: 'bridge',     label: 'Bridge',     accent: '#9333ea', bg: '#faf5ff', badge: 'bg-purple-100 text-purple-700' },
  { type: 'intro',      label: 'Intro',      accent: '#d97706', bg: '#fffbeb', badge: 'bg-amber-100 text-amber-700' },
  { type: 'outro',      label: 'Outro',      accent: '#ea580c', bg: '#fff7ed', badge: 'bg-orange-100 text-orange-700' },
  { type: 'pre-chorus', label: 'Pre-Chorus', accent: '#0d9488', bg: '#f0fdfa', badge: 'bg-teal-100 text-teal-700' },
] as const

const MUSICAL_KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4', '12/8']

function getSectionConfig(type: string) {
  return SECTION_TYPES.find(s => s.type === type) ?? SECTION_TYPES[0]
}

// ✅ removed encodeURIComponent
function serialize(sections: Section[], meta: SongMeta): string {
  const metaComment = `<!--meta:${JSON.stringify(meta)}-->`
  const sectionsHtml = sections
    .filter(s => s.content.trim() || s.chords.trim())
    .map(s =>
      `<div class="song-section" data-type="${s.type}" data-label="${s.label}" data-chords="${s.chords}"><h4>[${s.label}]</h4>${
        s.content.split('\n').map(l => `<p>${l || '&nbsp;'}</p>`).join('')
      }</div>`
    )
    .join('\n')
  return metaComment + '\n' + sectionsHtml
}

// ✅ removed decodeURIComponent
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
      const chords = div.getAttribute('data-chords') ?? ''
      const paragraphs = Array.from(div.querySelectorAll('p'))
      const content = paragraphs.map(p => p.textContent === '\u00a0' ? '' : (p.textContent ?? '')).join('\n')
      return { id: String(i), type, label, content, chords }
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
  mara:    '',
  myanmar: 'သီချင်းသားများ ရေးပါ...',
  mizo:    '',
}

export default function SongEditor({ content, onChange, language }: Props) {
  const [sections, setSections] = useState<Section[]>(() => {
    const parsed = typeof window !== 'undefined' ? htmlToSections(content) : []
    return parsed.length > 0 ? parsed : [
      { id: makeId(), type: 'verse',  label: 'Verse 1', content: '', chords: '' },
      { id: makeId(), type: 'chorus', label: 'Chorus',  content: '', chords: '' },
    ]
  })

  const [meta, setMeta] = useState<SongMeta>(() =>
    typeof window !== 'undefined'
      ? htmlToMeta(content)
      : { key: '', writer: '', singer: '', reference: '', timeSignature: '', songNumber: '' }
  )

  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const [showChords, setShowChords] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(sections.map(s => s.id))
  )

  function toggleSection(id: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function updateMeta(field: keyof SongMeta, value: string) {
    const next = { ...meta, [field]: value }
    setMeta(next)
    onChange(serialize(sections, next))
  }

  function updateSection(id: string, field: 'content' | 'chords', value: string) {
    setSections(prev => {
      const next = prev.map(s => s.id === id ? { ...s, [field]: value } : s)
      onChange(serialize(next, meta))
      return next
    })
  }

  function addSection(type: string) {
    setSections(prev => {
      const label = makeLabel(prev, type)
      const id = makeId()
      const next = [...prev, { id, type: type as Section['type'], label, content: '', chords: '' }]
      setExpandedSections(e => new Set([...Array.from(e), id]))
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
  const totalLines = sections.reduce((a, s) => a + s.content.split('\n').filter(l => l.trim()).length, 0)
  const hasChords = sections.some(s => s.chords.trim())

  return (
    <div className="song-editor space-y-3">
      <style>{`
        .song-editor textarea { font-family: 'ui-monospace', 'SFMono-Regular', 'Menlo', monospace; }
        .chord-row { background: repeating-linear-gradient(
          90deg, transparent, transparent 3ch, rgba(0,0,0,0.015) 3ch, rgba(0,0,0,0.015) 6ch
        ); }
        .section-card { transition: box-shadow 0.15s ease; }
        .section-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .meta-enter { animation: metaIn 0.18s ease forwards; }
        @keyframes metaIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">🎵 Song Editor</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400">{sections.length} sections · {totalLines} lines</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChords(!showChords)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-150
              ${showChords
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            {showChords ? 'Chords on' : 'Chords off'}
          </button>

          <button
            type="button"
            onClick={() => setShowMeta(!showMeta)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-150
              ${showMeta
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600'
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Song details
            {(meta.key || meta.writer || meta.songNumber) && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Song metadata panel ───────────────────────────────────────────────── */}
      {showMeta && (
        <div className="meta-enter bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center gap-2">
            <span className="text-blue-600 text-sm">🎼</span>
            <span className="text-sm font-semibold text-blue-800">Song Information</span>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <span>🔢</span> Song No.
              </label>
              <input type="text" value={meta.songNumber}
                onChange={e => updateMeta('songNumber', e.target.value)}
                placeholder="e.g. 541"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <span>🎹</span> Key (Doh is...)
              </label>
              <select value={meta.key} onChange={e => updateMeta('key', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 focus:bg-white transition-all">
                <option value="">Select key</option>
                {MUSICAL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <span>⏱️</span> Time
              </label>
              <select value={meta.timeSignature} onChange={e => updateMeta('timeSignature', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 focus:bg-white transition-all">
                <option value="">Select time</option>
                {TIME_SIGNATURES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <span>✍️</span> Written by
              </label>
              <input type="text" value={meta.writer}
                onChange={e => updateMeta('writer', e.target.value)}
                placeholder="Songwriter name"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <span>🎤</span> Sung by
              </label>
              <input type="text" value={meta.singer}
                onChange={e => updateMeta('singer', e.target.value)}
                placeholder="Artist or group"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <span>📖</span> Reference
              </label>
              <input type="text" value={meta.reference}
                onChange={e => updateMeta('reference', e.target.value)}
                placeholder="e.g. Psalm 23:1"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
          </div>
        </div>
      )}

      {/* ── Sections ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        {sections.map((section, idx) => {
          const cfg = getSectionConfig(section.type)
          const isExpanded = expandedSections.has(section.id)

          return (
            <div
              key={section.id}
              className="section-card bg-white border border-gray-200 rounded-xl overflow-hidden"
              style={{ borderLeft: `3px solid ${cfg.accent}` }}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/80 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left group"
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cfg.badge}`}>
                    {section.label}
                  </span>
                  {section.chords.trim() && showChords && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">
                      chords
                    </span>
                  )}
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ml-auto mr-1 ${isExpanded ? '' : '-rotate-90'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button type="button" onClick={() => moveSection(section.id, 'up')}
                    disabled={idx === 0}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-25 transition-colors text-xs">
                    ↑
                  </button>
                  <button type="button" onClick={() => moveSection(section.id, 'down')}
                    disabled={idx === sections.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-25 transition-colors text-xs">
                    ↓
                  </button>
                  <button type="button" onClick={() => removeSection(section.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div>
                  {showChords && (
                    <div className="border-b border-dashed border-amber-200 bg-amber-50/40">
                      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Chords</span>
                        <div className="flex-1 h-px bg-amber-200/60" />
                      </div>
                      <textarea
                        value={section.chords}
                        onChange={e => updateSection(section.id, 'chords', e.target.value)}
                        placeholder="Am  G  C  F  |  G  Em  Am..."
                        rows={2}
                        className="chord-row w-full px-3 pb-2.5 pt-0.5 bg-transparent resize-none focus:outline-none text-[13px] leading-relaxed text-amber-800 placeholder-amber-300 tracking-wide"
                        style={{ fontFamily: "'ui-monospace', 'SFMono-Regular', monospace" }}
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lyrics</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <textarea
                      value={section.content}
                      onChange={e => updateSection(section.id, 'content', e.target.value)}
                      placeholder={placeholder}
                      rows={5}
                      className="w-full px-3 pb-3 pt-0.5 bg-white resize-none focus:outline-none text-sm leading-[1.9] text-gray-700 placeholder-gray-300"
                      style={{ fontFamily: "'ui-monospace', 'SFMono-Regular', monospace" }}
                    />
                  </div>
                  <div className="px-3 pb-2 flex justify-end">
                    <span className="text-[10px] text-gray-300 tabular-nums">
                      {section.content.split('\n').filter(l => l.trim()).length} lines
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Add section ───────────────────────────────────────────────────────── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400
            hover:border-green-300 hover:text-green-600 hover:bg-green-50/50
            active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add section
        </button>

        {showAddMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200/80 p-3 z-20">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">Choose section type</p>
            <div className="flex flex-wrap gap-2">
              {SECTION_TYPES.map(s => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => addSection(s.type)}
                  className={`text-xs px-3.5 py-2 rounded-full border font-semibold transition-all duration-150 hover:shadow-sm active:scale-95 ${s.badge} border-current/20`}
                  style={{ borderColor: `${s.accent}33` }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer stats ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 text-[11px] text-gray-400">
        <div className="flex items-center gap-3">
          <span>{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{totalLines} lines</span>
          {meta.key && (
            <>
              <span>·</span>
              <span className="text-amber-600 font-semibold">Key of {meta.key}</span>
            </>
          )}
          {meta.timeSignature && (
            <>
              <span>·</span>
              <span>{meta.timeSignature}</span>
            </>
          )}
        </div>
        {hasChords && (
          <span className="text-amber-500">♪ chords added</span>
        )}
      </div>
    </div>
  )
}