'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useState } from 'react'

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichEditor({ content, onChange, placeholder = 'Write here...' }: Props) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [appliedLink, setAppliedLink] = useState('') // tracks the saved URL to show as pill
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
// AFTER
extensions: [
  StarterKit.configure({
    link: false,
  }),
  Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false, // FIX: was true — caused click to open URL instead of keeping cursor
        HTMLAttributes: {
          class: 'prose-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'ProseMirror' },
    },
  })

  useEffect(() => {
    if (!editor) return
    // Only reset editor from prop when not focused,
    // so unsaved links are not wiped on re-renders (e.g. language tab switch).
    if (content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  function openLinkInput() {
    if (!editor) return

    // Save selection BEFORE focus is lost to the input field
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    console.log('[RichEditor] openLinkInput — from:', from, 'to:', to, 'text:', selectedText)
    setSavedSelection({ from, to })

    const existing = editor.getAttributes('link').href ?? ''
    setLinkUrl(existing)
    setAppliedLink(existing) // pre-fill pill if editing existing link
    setShowLinkInput(v => !v)
  }

  function applyLink() {
    if (!editor) return

    // DEBUG: log selection state at apply time
    const currentSel = editor.state.selection
    const currentText = editor.state.doc.textBetween(currentSel.from, currentSel.to)
    console.log('[RichEditor] applyLink — currentSel empty:', currentSel.empty, 'text:', currentText)
    console.log('[RichEditor] applyLink — savedSelection:', savedSelection)

    const url = linkUrl.trim()

    // Build chain — start by restoring the saved selection so the link
    // is applied to the originally selected text, not wherever focus ended up
    let chain = editor.chain().focus()
    if (savedSelection && (savedSelection.from !== savedSelection.to)) {
      chain = (chain as any).setTextSelection(savedSelection)
    }

    if (!url) {
      chain.unsetLink().run()
      setAppliedLink('')
      setShowLinkInput(false)
      setLinkUrl('')
    } else {
      const href = url.startsWith('http') ? url : `https://${url}`
      chain.setLink({ href }).run()

      // DEBUG: log resulting HTML to confirm <a> tag was written
      console.log('[RichEditor] applyLink — HTML after setLink:', editor.getHTML().substring(0, 300))

      setLinkUrl(href)
      setAppliedLink(href)
    }

    setSavedSelection(null)
  }

  function removeLink() {
    editor?.chain().focus().unsetLink().run()
    setAppliedLink('')
    setShowLinkInput(false)
    setLinkUrl('')
    setSavedSelection(null)
  }

  if (!editor) return null

  const Divider = () => <div className="w-px self-stretch bg-gray-200 mx-0.5" />

  const Btn = ({ onClick, active, title, children }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode
  }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`h-7 px-2 text-sm rounded flex items-center justify-center transition-colors
        ${active
          ? 'bg-green-100 text-green-800 font-semibold'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
      {children}
    </button>
  )

  const isLinkActive = editor.isActive('link')

  // Shorten URL for display in the pill (strip https://, truncate)
  const displayUrl = appliedLink
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .slice(0, 40)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">

        {/* Text style */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Btn>

        <Divider />

        {/* Headings */}
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <span className="text-xs font-bold">H1</span>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <span className="text-xs font-bold">H2</span>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <span className="text-xs font-bold">H3</span>
        </Btn>

        <Divider />

        {/* Lists */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <line x1="9" y1="6" x2="20" y2="6" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
          </svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <line x1="10" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/>
            <line x1="10" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/>
            <line x1="10" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 6h1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M3 14h2a1 1 0 0 1 0 2H3.5a1 1 0 0 0 0 2H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>
        </Btn>

        <Divider />

        {/* Link button — toggles inline input */}
        <Btn onClick={openLinkInput} active={isLinkActive} title={isLinkActive ? 'Edit link' : 'Insert link'}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </Btn>

        <Divider />

        {/* Undo / Redo */}
        <Btn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </Btn>
      </div>

      {/* ── Link input bar — slides in below toolbar ─────────────────────────── */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100">
          {/* Link icon */}
          <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>

          {/* URL input */}
          <input
            autoFocus
            type="url"
            value={linkUrl}
            onChange={e => { setLinkUrl(e.target.value); setAppliedLink('') }}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink() }
              if (e.key === 'Escape') {
                setShowLinkInput(false)
                setLinkUrl('')
                setAppliedLink('')
                setSavedSelection(null)
              }
            }}
            placeholder="https://example.com"
            className="flex-1 text-sm bg-transparent outline-none text-blue-900 placeholder:text-blue-300 min-w-0"
          />

          {/* Apply button — hidden once link is applied */}
          {!appliedLink && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); applyLink() }}
              className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex-shrink-0"
            >
              Apply
            </button>
          )}

          {/* ✅ Applied pill — shows on the right after Apply is tapped */}
          {appliedLink && (
            <a
              href={appliedLink}
              target="_blank"
              rel="noopener noreferrer"
              onMouseDown={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full hover:bg-green-200 transition-colors flex-shrink-0 max-w-[180px]"
              title={appliedLink}
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="truncate">{displayUrl}</span>
            </a>
          )}

          {/* Remove button */}
          {isLinkActive && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); removeLink() }}
              className="text-xs px-2.5 py-1 border border-red-200 text-red-500 rounded-md hover:bg-red-50 transition-colors flex-shrink-0"
            >
              Remove
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onMouseDown={e => {
              e.preventDefault()
              setShowLinkInput(false)
              setLinkUrl('')
              setAppliedLink('')
              setSavedSelection(null)
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-1 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Editor area ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 min-h-[200px] bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Global styles for editor content */}
      <style>{`
        .ProseMirror { outline: none; min-height: 180px; }
        .ProseMirror p { margin: 0 0 0.75rem; line-height: 1.7; font-size: 0.9375rem; color: #374151; }
        .ProseMirror p:last-child { margin-bottom: 0; }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: #111827; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.4rem; color: #111827; }
        .ProseMirror h3 { font-size: 1.05rem; font-weight: 600; margin: 0.75rem 0 0.35rem; color: #111827; }
        .ProseMirror ul { list-style: disc; padding-left: 1.4rem; margin: 0 0 0.75rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.4rem; margin: 0 0 0.75rem; }
        .ProseMirror li { margin-bottom: 0.25rem; line-height: 1.6; font-size: 0.9375rem; color: #374151; }
        .ProseMirror blockquote { border-left: 3px solid #d1fae5; padding-left: 1rem; margin: 0.75rem 0; color: #6b7280; font-style: italic; }
        .ProseMirror a, .prose-link { color: #15803d; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
        .ProseMirror a:hover { color: #166534; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #d1d5db; pointer-events: none; float: left; height: 0; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
      `}</style>
    </div>
  )
}