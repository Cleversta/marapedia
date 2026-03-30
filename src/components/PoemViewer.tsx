'use client'

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

export default function PoemViewer({ content }: { content: string }) {
  const text = htmlToText(content)
  if (!text) return <div className="text-gray-400 italic">No poem content.</div>

  const stanzas = text.split(/\n\n+/).filter(s => s.trim())

  return (
    <div className="poem-viewer max-w-xl mx-auto">
      <div className="flex flex-col gap-6">
        {stanzas.map((stanza, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {stanza.split('\n').map((line, j) => (
              <p
                key={j}
                className="text-gray-800 leading-relaxed"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '17px',
                  lineHeight: '1.9rem',
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