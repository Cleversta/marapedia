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

  // Extract meta from first comment or data attribute if present
  const meta: SongMeta = {}
  const metaMatch = html.match(/<!--meta:(.*?)-->/)
  if (metaMatch) {
    try { Object.assign(meta, JSON.parse(metaMatch[1])) } catch {}
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const divs = doc.querySelectorAll('.song-section')

  const sections: Section[] = Array.from(divs).map(div => {
    const type = div.getAttribute('data-type') ?? 'verse'
    const label = div.getAttribute('data-label') ?? 'Verse'
    const paragraphs = Array.from(div.querySelectorAll('p'))
    const lines = paragraphs.map(p =>
      p.textContent === '\u00a0' ? '' : (p.textContent ?? '')
    )
    return { type, label, lines }
  })

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
    return <div className="text-gray-400 italic">No lyrics available.</div>
  }

  return (
    <div className="song-viewer max-w-2xl mx-auto font-serif">

      {/* Song meta row — key, reference, time sig */}
      {(combined.key || combined.reference || combined.timeSignature) && (
        <div className="flex items-center justify-between text-sm italic text-gray-500 mb-8 pb-3 border-b border-gray-200">
          <span>{combined.key ? `Doh is ${combined.key}` : ''}</span>
          <span>{combined.reference ?? ''}</span>
          <span>{combined.timeSignature ?? ''}</span>
        </div>
      )}

      {/* Writer / Singer */}
      {(combined.writer || combined.singer) && (
        <div className="flex gap-6 text-xs text-gray-400 mb-6">
          {combined.writer && <span>Words: <span className="text-gray-600">{combined.writer}</span></span>}
          {combined.singer && <span>Music: <span className="text-gray-600">{combined.singer}</span></span>}
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-6">
        {sections.map((section, idx) => {
          const verseNum = getVerseNumber(section.label)
          const isChorus = section.type === 'chorus'
          const isBridge = section.type === 'bridge'
          const isVerse = section.type === 'verse'

          return (
            <div key={idx} className={isChorus || isBridge ? 'pl-8' : ''}>
              <div className="flex gap-3">
                {/* Verse number */}
                {isVerse && (
                  <span className="text-sm font-semibold text-gray-700 shrink-0 w-5 pt-0.5">
                    {verseNum}.
                  </span>
                )}
                {/* Chorus / Bridge label */}
                {(isChorus || isBridge) && (
                  <span className="text-xs italic text-gray-400 shrink-0 pt-1 w-12">
                    {section.label}:
                  </span>
                )}

                {/* Lines */}
                <div className="flex flex-col gap-0.5">
                  {section.lines.map((line, lineIdx) => (
                    <p
                      key={lineIdx}
                      className={`leading-relaxed ${
                        line === ''
                          ? 'h-2'
                          : isChorus
                          ? 'text-gray-700 italic text-base'
                          : 'text-gray-800 text-base'
                      }`}
                    >
                      {line || ''}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}