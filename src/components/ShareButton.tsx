'use client'

import { useState } from 'react'

interface ShareButtonProps {
  url: string
  title: string
}

export default function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    // Stop the parent <Link> from navigating
    e.preventDefault()
    e.stopPropagation()

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled — ignore
      }
    } else {
      // Fallback: copy link to clipboard
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share this article"
      className="inline-flex items-center gap-1.5 text-xs text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 px-2.5 py-1 rounded-full transition-colors font-medium"
    >
      {copied ? (
        <>
          {/* Checkmark icon */}
          <svg
            className="w-3 h-3"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8l3.5 3.5L13 4" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          {/* Share icon */}
          <svg
            className="w-3 h-3"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="3" r="1.5" />
            <circle cx="12" cy="13" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <path d="M10.5 3.75L4.5 7.25M10.5 12.25L4.5 8.75" />
          </svg>
          Share
        </>
      )}
    </button>
  )
}