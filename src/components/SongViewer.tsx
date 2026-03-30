'use client'

interface SongMeta {
  key?: string
  writer?: string
  singer?: string
  reference?: string
  timeSignature?: string
  songNumber?: string
}

interface Section {
  type: string
  label: string
  lines: string[]
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

    // Strip h4 label tag
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
      `}</style>

      <div className="song-viewer max-w-xl mx-auto px-1">

        {/* ── Meta row: Doh is X · Reference · Time sig ── */}
        {(combined.key || combined.reference || combined.timeSignature) && (
          <div className="song-meta-row flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <span>{combined.key ? `Doh is ${combined.key}` : ''}</span>
            <span>{combined.reference ?? ''}</span>
            <span>{combined.timeSignature ?? ''}</span>
          </div>
        )}

        {/* ── Writer / Singer ── */}
        {(combined.writer || combined.singer) && (
          <div className="song-writer-row flex gap-6 mb-5">
            {combined.writer && (
              <span>Words: <span className="text-gray-600">{combined.writer}</span></span>
            )}
            {combined.singer && (
              <span>Music: <span className="text-gray-600">{combined.singer}</span></span>
            )}
          </div>
        )}

        {/* ── Sections ── */}
        <div className="flex flex-col gap-7">
          {sections.map((section, idx) => {
            const verseNum = getVerseNumber(section.label)
            const isChorus = section.type === 'chorus'
            const isBridge = section.type === 'bridge'
            const isVerse = section.type === 'verse'

            // Trim trailing empty lines
            const lines = [...section.lines]
            while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

            if (isVerse) {
              return (
                <div key={idx} className="flex gap-2">
                  {/* Verse number */}
                  <span
                    className="shrink-0 font-semibold text-gray-800 tabular-nums select-none"
                    style={{ fontSize: '1.05rem', lineHeight: '1.75', minWidth: '1.6rem' }}
                  >
                    {verseNum}.
                  </span>
                  {/* Lines */}
                  <div>
                    {lines.map((line, i) =>
                      line === ''
                        ? <div key={i} className="h-3" />
                        : <p key={i} className="song-line">{line}</p>
                    )}
                  </div>
                </div>
              )
            }

            if (isChorus || isBridge) {
              // Chorus: indented block, no label shown, same font weight
              return (
                <div key={idx} className="pl-10">
                  {lines.map((line, i) =>
                    line === ''
                      ? <div key={i} className="h-3" />
                      : <p key={i} className="song-line">{line}</p>
                  )}
                </div>
              )
            }

            // Intro / Outro / Pre-chorus / Custom — show label
            return (
              <div key={idx}>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-medium">
                  {section.label}
                </p>
                {lines.map((line, i) =>
                  line === ''
                    ? <div key={i} className="h-3" />
                    : <p key={i} className="song-line">{line}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}