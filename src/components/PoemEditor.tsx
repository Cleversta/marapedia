'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import {TextStyle} from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { Extension } from '@tiptap/core'
import { useEffect, useState, useRef } from 'react'

// ── Inline font-size extension ────────────────────────────────────────────────
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as any
  },
})

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

const FONT_SIZES = [
  { label: 'Small', value: '0.8rem' },
  { label: 'Normal', value: '1rem' },
  { label: 'Large', value: '1.25rem' },
  { label: 'X-Large', value: '1.6rem' },
]

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Yellow', value: '#ca8a04' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Gray', value: '#6b7280' },
]

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'None', value: '' },
]

type Dropdown = 'color' | 'highlight' | 'fontSize' | null

export default function RichEditor({ content, onChange, placeholder = 'Write here...' }: Props) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [appliedLink, setAppliedLink] = useState('')
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null)
  const [openDropdown, setOpenDropdown] = useState<Dropdown>(null)
  const [wordCount, setWordCount] = useState(0)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'prose-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      const text = editor.getText()
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
    },
    editorProps: {
      attributes: { class: 'ProseMirror' },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content)
      const text = editor.getText()
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
    }
  }, [content, editor])

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  function toggleDropdown(name: Dropdown) {
    setOpenDropdown(prev => prev === name ? null : name)
  }

  function openLinkInput() {
    if (!editor) return
    const { from, to } = editor.state.selection
    setSavedSelection({ from, to })
    const existing = editor.getAttributes('link').href ?? ''
    setLinkUrl(existing)
    setAppliedLink(existing)
    setShowLinkInput(v => !v)
  }

  function applyLink() {
    if (!editor) return
    const url = linkUrl.trim()
    let chain = editor.chain().focus()
    if (savedSelection && savedSelection.from !== savedSelection.to) {
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

  const Divider = () => <div className="w-px self-stretch bg-stone-200 mx-0.5" />

  const Btn = ({ onClick, active, title, children }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`h-7 px-2 text-sm rounded flex items-center justify-center transition-colors
        ${active
          ? 'bg-green-100 text-green-700 font-semibold'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
        }`}
    >
      {children}
    </button>
  )

  const isLinkActive = editor.isActive('link')
  const displayUrl = appliedLink.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 40)
  const currentColor = editor.getAttributes('textStyle').color || '#44403c'
  const hasContent = editor.getText().trim().length > 0

  return (
    <div className="rich-editor-wrap space-y-3">
      <style>{`
        .rich-editor-wrap .ProseMirror {
          outline: none;
          min-height: 460px;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 16px;
          line-height: 1.85;
          color: #292524;
          padding: 28px 32px 24px;
        }
        .rich-editor-wrap .ProseMirror p { margin: 0 0 1em; }
        .rich-editor-wrap .ProseMirror p:last-child { margin-bottom: 0; }
        .rich-editor-wrap .ProseMirror h1 { font-size: 1.7rem; font-weight: 700; margin: 1.4rem 0 0.5rem; color: #1c1917; font-family: Georgia, serif; }
        .rich-editor-wrap .ProseMirror h2 { font-size: 1.3rem; font-weight: 700; margin: 1.2rem 0 0.4rem; color: #1c1917; border-bottom: 1px solid #e7e5e4; padding-bottom: 0.3em; }
        .rich-editor-wrap .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.35rem; color: #1c1917; }
        .rich-editor-wrap .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 1em; }
        .rich-editor-wrap .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 1em; }
        .rich-editor-wrap .ProseMirror li { margin-bottom: 0.3em; line-height: 1.7; }
        .rich-editor-wrap .ProseMirror blockquote { border-left: 3px solid #a8d5b5; padding: 0.5rem 1rem; margin: 1em 0; color: #78716c; font-style: italic; background: #f0fdf4; border-radius: 0 6px 6px 0; }
        .rich-editor-wrap .ProseMirror a { color: #15803d; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
        .rich-editor-wrap .ProseMirror a:hover { color: #166534; }
        .rich-editor-wrap .ProseMirror hr { border: none; border-top: 2px solid #e7e5e4; margin: 1.75rem 0; }
        .rich-editor-wrap .ProseMirror strong { font-weight: 700; }
        .rich-editor-wrap .ProseMirror em { font-style: italic; }
        .rich-editor-wrap .ProseMirror s { text-decoration: line-through; }
        .rich-editor-wrap .ProseMirror mark { border-radius: 2px; padding: 0 2px; }
        .rich-editor-wrap .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #c8b8b0;
          pointer-events: none;
          float: left;
          height: 0;
          font-style: italic;
        }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-stone-600">✍️ Article Editor</span>
        <div className="flex items-center gap-3 text-[11px] text-stone-400">
          {wordCount > 0 && <span>{wordCount} words</span>}
        </div>
      </div>

      {/* ── Main card ────────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-xl overflow-visible border border-stone-200 shadow-sm"
        style={{ background: 'linear-gradient(to bottom right, #FDFCF9, #FAF8F5)' }}
      >
        {/* Top accent */}
        <div className="h-0.5 w-full rounded-t-xl" style={{ background: 'linear-gradient(to right, #86efac, #6ee7b7, #a5f3fc)' }} />

        {/* Watermark */}
        <div className="absolute right-6 top-6 text-[80px] leading-none select-none pointer-events-none opacity-[0.03] rotate-12">
          ✍
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────────────── */}
        <div
          ref={toolbarRef}
          className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-stone-200/80 bg-stone-50/60"
        >
          {/* Bold / Italic / Strike */}
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
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <path d="M16 6C16 6 14.5 4 12 4C9.5 4 8 5.5 8 7C8 9 10 10 12 10"/>
              <path d="M8 18C8 18 9.5 20 12 20C14.5 20 16 18.5 16 17C16 15 14 14 12 14"/>
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

          {/* Font size */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); toggleDropdown('fontSize') }}
              title="Font size"
              className="h-7 px-2 text-sm rounded flex items-center gap-0.5 text-stone-500 hover:bg-stone-100 transition-colors"
            >
              <span className="text-xs font-medium">Aa</span>
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openDropdown === 'fontSize' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-50 py-1 min-w-[110px]">
                {FONT_SIZES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault()
                      editor.chain().focus().setFontSize(s.value).run()
                      setOpenDropdown(null)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-50 transition-colors"
                  >
                    <span style={{ fontSize: s.value }} className="text-stone-700">{s.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault()
                    editor.chain().focus().unsetFontSize().run()
                    setOpenDropdown(null)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-stone-400 hover:bg-stone-50 border-t border-stone-100 transition-colors"
                >
                  Reset size
                </button>
              </div>
            )}
          </div>

          <Divider />

          {/* Text color */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); toggleDropdown('color') }}
              title="Text color"
              className="h-7 px-2 rounded flex flex-col items-center justify-center gap-0.5 text-stone-500 hover:bg-stone-100 transition-colors"
            >
              <span className="text-xs font-bold leading-none" style={{ color: currentColor }}>A</span>
              <div className="w-4 h-1 rounded-sm" style={{ background: currentColor }} />
            </button>
            {openDropdown === 'color' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-50 p-2 flex flex-wrap gap-1.5 w-[120px]">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onMouseDown={e => {
                      e.preventDefault()
                      if (!c.value) editor.chain().focus().unsetColor().run()
                      else editor.chain().focus().setColor(c.value).run()
                      setOpenDropdown(null)
                    }}
                    className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                    style={{ background: c.value || '#44403c' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); toggleDropdown('highlight') }}
              title="Highlight text"
              className={`h-7 px-2 rounded flex flex-col items-center justify-center gap-0.5 transition-colors
                ${editor.isActive('highlight') ? 'bg-green-100 text-green-700' : 'text-stone-500 hover:bg-stone-100'}`}
            >
              <span className="text-xs font-bold leading-none">A</span>
              <div className="w-4 h-1 rounded-sm bg-yellow-300" />
            </button>
            {openDropdown === 'highlight' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-50 p-2 flex flex-wrap gap-1.5 w-[100px]">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onMouseDown={e => {
                      e.preventDefault()
                      if (!c.value) editor.chain().focus().unsetHighlight().run()
                      else editor.chain().focus().setHighlight({ color: c.value }).run()
                      setOpenDropdown(null)
                    }}
                    className="w-6 h-6 rounded border-2 border-stone-200 shadow-sm hover:scale-110 transition-transform"
                    style={{ background: c.value || '#ffffff' }}
                  />
                ))}
              </div>
            )}
          </div>

          <Divider />

          {/* Alignment */}
          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="12" x2="15" y2="12" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" strokeLinecap="round"/>
              <line x1="4" y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="9" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
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

          {/* Horizontal rule */}
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Horizontal divider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Btn>

          {/* Link */}
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

        {/* ── Link input bar ──────────────────────────────────────────────────── */}
        {showLinkInput && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/80 border-b border-blue-100">
            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              autoFocus
              type="url"
              value={linkUrl}
              onChange={e => { setLinkUrl(e.target.value); setAppliedLink('') }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink() }
                if (e.key === 'Escape') {
                  setShowLinkInput(false); setLinkUrl(''); setAppliedLink(''); setSavedSelection(null)
                }
              }}
              placeholder="https://example.com"
              className="flex-1 text-sm bg-transparent outline-none text-blue-900 placeholder:text-blue-300 min-w-0"
            />
            {!appliedLink && (
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); applyLink() }}
                className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex-shrink-0"
              >
                Apply
              </button>
            )}
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
            {isLinkActive && (
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); removeLink() }}
                className="text-xs px-2.5 py-1 border border-red-200 text-red-500 rounded-md hover:bg-red-50 transition-colors flex-shrink-0"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault()
                setShowLinkInput(false); setLinkUrl(''); setAppliedLink(''); setSavedSelection(null)
              }}
              className="text-stone-400 hover:text-stone-600 transition-colors ml-1 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Editor area ─────────────────────────────────────────────────────── */}
        <EditorContent editor={editor} />

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div className="border-t border-stone-200/80 px-4 py-2.5 flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-b-xl">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{ background: hasContent ? '#4ade80' : '#d6d3d1' }}
            />
            <span className="text-[11px] text-stone-400 font-medium">
              {hasContent ? 'Draft' : 'Empty'}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 italic hidden sm:block">
            Select text to apply formatting
          </p>
        </div>
      </div>
    </div>
  )
}