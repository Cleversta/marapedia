'use client'
import { useRef } from 'react'

interface SongMeta {
  key?: string
  writer?: string
  singer?: string
  reference?: string
  timeSignature?: string
  songNumber?: string
  youtubeUrl?: string  // ← NEW
}

interface Section {
  type: string
  label: string
  lines: string[]
}

// ── YouTube helper ────────────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function parseSongHtml(html: string): { sections: Section[]; meta: SongMeta } {
  if (!html) return { sections: [], meta: {} }

  const meta: SongMeta = {}
  const metaMatch = html.match(/<!--meta:(.*?)-->/)
  if (metaMatch) {
    try { Object.assign(meta, JSON.parse(metaMatch[1])) } catch {}
  }

  const sections: Section[] = []
  const divRegex = /<div[^>]*class="song-section"[^>]*>([\s\S]*?)<\/div>/g
  let match: RegExpExecArray | null

  while ((match = divRegex.exec(html)) !== null) {
    const divTag = match[0]
    const inner = match[1] ?? ''

    const typeMatch = divTag.match(/data-type="([^"]*)"/)
    const labelMatch = divTag.match(/data-label="([^"]*)"/)
    const type = typeMatch?.[1] ?? 'verse'
    const label = labelMatch?.[1] ?? 'Verse'

    const bodyHtml = inner.replace(/<h4[^>]*>[\s\S]*?<\/h4>/g, '')

    const lines: string[] = []
    const pRegex = /<p>([\s\S]*?)<\/p>/g
    let pMatch: RegExpExecArray | null
    while ((pMatch = pRegex.exec(bodyHtml)) !== null) {
      const text = pMatch[1]
        .replace(/&nbsp;/g, '\u00a0')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
      lines.push(text === '\u00a0' ? '' : text)
    }

    sections.push({ type, label, lines })
  }

  return { sections, meta }
}

function getVerseNumber(label: string): string | null {
  const match = label.match(/verse\s*(\d+)/i)
  return match ? match[1] : null
}

interface Props {
  content: string
  title: string
  songMeta?: SongMeta
}

export default function SongViewer({ content, title, songMeta = {} }: Props) {
  const { sections, meta } = parseSongHtml(content)
  const combined = { ...meta, ...songMeta }
  const printRef = useRef<HTMLDivElement>(null)

  // Resolve YouTube video ID from meta
  const videoId = combined.youtubeUrl ? extractYouTubeId(combined.youtubeUrl) : null

  async function handleSaveImage() {
    if (!printRef.current) return
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(printRef.current, {
      backgroundColor: '#fffef9',
      scale: 2,
      useCORS: true,
    })
    const link = document.createElement('a')
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (sections.length === 0) {
    return <div className="text-gray-400 italic text-sm">No lyrics available.</div>
  }

  return (
    <>
      <style>{`
        .song-viewer {
          font-family: 'Lora', Georgia, 'Times New Roman', serif;
        }
        .song-meta-row {
          font-style: italic;
          color: #555;
          font-size: 0.9rem;
        }
        .song-line {
          font-size: 1.05rem;
          line-height: 1.75;
          color: #1a1a1a;
          margin: 0;
        }
        .song-writer-row {
          font-size: 0.78rem;
          color: #888;
        }
        .yt-player-wrap {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
        }
        .yt-player-wrap iframe {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          border: none;
        }
      `}</style>

      <div className="max-w-xl mx-auto px-1">

        {/* ── YouTube player (if URL is set) ── */}
        {videoId && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Watch on YouTube</span>
            </div>
            <div className="yt-player-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* ── Save as Image button ── */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSaveImage}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Save as Image
          </button>
        </div>

        {/* ── Printable lyrics area ── */}
        <div
          ref={printRef}
          style={{
            background: '#fffef9',
            padding: '32px',
            borderRadius: '12px',
            fontFamily: "'Lora', Georgia, serif",
          }}
        >
          {/* Title */}
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1c1917', marginBottom: '4px' }}>
            {title}
          </h2>

          {/* Song number */}
          {combined.songNumber && (
            <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '12px' }}>
              #{combined.songNumber}
            </p>
          )}

          {/* Meta row */}
          {(combined.key || combined.reference || combined.timeSignature) && (
            <div className="song-meta-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e7e5e4' }}>
              <span>{combined.key ? `Doh is ${combined.key}` : ''}</span>
              <span>{combined.reference ?? ''}</span>
              <span>{combined.timeSignature ?? ''}</span>
            </div>
          )}

          {/* Writer / Singer */}
          {(combined.writer || combined.singer) && (
            <div className="song-writer-row" style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
              {combined.writer && <span>Words: <span style={{ color: '#555' }}>{combined.writer}</span></span>}
              {combined.singer && <span>Music: <span style={{ color: '#555' }}>{combined.singer}</span></span>}
            </div>
          )}

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {sections.map((section, idx) => {
              const verseNum = getVerseNumber(section.label)
              const isChorus = section.type === 'chorus'
              const isBridge = section.type === 'bridge'
              const isVerse = section.type === 'verse'

              const lines = [...section.lines]
              while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

              if (isVerse) {
                return (
                  <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0, fontWeight: 600, color: '#1c1917', fontSize: '1.05rem', lineHeight: '1.75', minWidth: '1.6rem' }}>
                      {verseNum}.
                    </span>
                    <div>
                      {lines.map((line, i) =>
                        line === ''
                          ? <div key={i} style={{ height: '12px' }} />
                          : <p key={i} className="song-line">{line}</p>
                      )}
                    </div>
                  </div>
                )
              }

              if (isChorus || isBridge) {
                return (
                  <div key={idx} style={{ paddingLeft: '40px' }}>
                    {lines.map((line, i) =>
                      line === ''
                        ? <div key={i} style={{ height: '12px' }} />
                        : <p key={i} className="song-line">{line}</p>
                    )}
                  </div>
                )
              }

              return (
                <div key={idx}>
                  <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', marginBottom: '8px', fontWeight: 500 }}>
                    {section.label}
                  </p>
                  {lines.map((line, i) =>
                    line === ''
                      ? <div key={i} style={{ height: '12px' }} />
                      : <p key={i} className="song-line">{line}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Watermark */}
          <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e7e5e4', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#ccc', letterSpacing: '0.05em' }}>
              marapedia.vercel.app
            </span>
          </div>
        </div>
      </div>
    </>
  )
}