'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

// ─── Fingerprint (anon device ID) ─────────────────────────────────────────────
function getFingerprint(): string {
  try {
    let fp = localStorage.getItem('mp_fp')
    if (!fp) {
      fp =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('mp_fp', fp)
    }
    return fp
  } catch {
    return 'anon-' + Math.random().toString(36).slice(2)
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Comment {
  id: string
  display_name: string
  body: string
  created_at: string
  user_id: string | null
  avatar_url?: string | null
}

interface Props {
  articleId: string
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function CommentAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl?: string | null
  displayName: string
}) {
  return (
    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[11px] font-semibold text-stone-500 ring-1 ring-stone-200 shrink-0 mt-0.5 overflow-hidden">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        displayName.charAt(0).toUpperCase()
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CommentsSection({ articleId }: Props) {
  // Auth
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Likes
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Get session on mount ────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      setCurrentUserId(session.user.id)
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single()
      if (data?.username) setUsername(data.username)
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    })
  }, [])

  // ── Load likes & comments ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    const fp = getFingerprint()

    const [{ count }, { data: myLike }, { data: cmts }] = await Promise.all([
      supabase
        .from('article_likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId),

      supabase
        .from('article_likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('fingerprint', fp)
        .maybeSingle(),

      supabase
        .from('article_comments')
        .select('id, display_name, body, created_at, user_id, profiles(avatar_url)')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    setLikeCount(count ?? 0)
    setLiked(!!myLike)
    setComments(
      (cmts ?? []).map((c: any) => ({
        ...c,
        avatar_url: c.profiles?.avatar_url ?? null,
      }))
    )
  }, [articleId])

  useEffect(() => {
    load()
  }, [load])

  // ── Toggle like ─────────────────────────────────────────────────────────────
  async function toggleLike() {
    if (likeLoading) return
    const fp = getFingerprint()
    setLikeLoading(true)

    if (liked) {
      const { error } = await supabase
        .from('article_likes')
        .delete()
        .eq('article_id', articleId)
        .eq('fingerprint', fp)
      if (!error) {
        setLiked(false)
        setLikeCount((c) => Math.max(0, c - 1))
      }
    } else {
      const { error } = await supabase
        .from('article_likes')
        .insert({ article_id: articleId, fingerprint: fp })
      if (!error) {
        setLiked(true)
        setLikeCount((c) => c + 1)
      }
    }
    setLikeLoading(false)
  }

  // ── Post comment ─────────────────────────────────────────────────────────────
  async function postComment() {
    const trimmedBody = body.trim()
    if (!trimmedBody) return
    setSubmitting(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()

    const { error } = await supabase.from('article_comments').insert({
      article_id: articleId,
      display_name: username ?? 'Anonymous',
      body: trimmedBody,
      user_id: session?.user?.id ?? null,
    })

    if (error) {
      setError('Something went wrong. Please try again.')
    } else {
      setBody('')
      setSubmitted(true)
      setShowForm(false)
      await load()
      setTimeout(() => setSubmitted(false), 4000)
    }
    setSubmitting(false)
  }

  // ── Delete comment ───────────────────────────────────────────────────────────
  async function deleteComment(commentId: string) {
    if (!confirm('Delete your comment?')) return
    setDeletingId(commentId)
    const { error } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', currentUserId!) // extra safety — only own rows
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
    setDeletingId(null)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mt-10 space-y-8">

      {/* ── Like & comment action bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={toggleLike}
          disabled={likeLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
            liked
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              : 'bg-white border-stone-200 text-stone-500 hover:border-red-200 hover:text-red-500'
          }`}
        >
          <svg
            className={`w-4 h-4 transition-transform ${
              likeLoading ? 'scale-90' : liked ? 'scale-110' : ''
            }`}
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {likeCount > 0 ? likeCount.toLocaleString() : 'Like'}
        </button>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-500 hover:border-green-300 hover:text-green-700 transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {comments.length > 0
            ? `${comments.length} comment${comments.length === 1 ? '' : 's'}`
            : 'Comment'}
        </button>

        {submitted && (
          <span className="text-xs text-green-700 flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Comment posted
          </span>
        )}
      </div>

      {/* ── Comment form ── */}
      {showForm && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Leave a comment
            </p>
            <span className="text-xs text-stone-400">
              Posting as{' '}
              <span className="font-medium text-stone-600">
                {username ?? 'Anonymous'}
              </span>
              {!username && (
                <span className="text-stone-300">
                  {' '}
                  ·{' '}
                  <a href="/login" className="text-green-700 hover:underline">
                    Sign in
                  </a>{' '}
                  to use your name
                </span>
              )}
            </span>
          </div>

          {/* Show current user's avatar in form */}
          {username && (
            <div className="flex items-center gap-2">
              <CommentAvatar avatarUrl={avatarUrl} displayName={username} />
              <span className="text-xs text-stone-400">{username}</span>
            </div>
          )}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your comment…"
            maxLength={1000}
            rows={3}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-300 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100 transition-all resize-none"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-300">{body.length}/1000</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false)
                  setError(null)
                }}
                className="text-xs px-3 py-1.5 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={postComment}
                disabled={submitting || !body.trim()}
                className="text-xs px-4 py-1.5 rounded-lg bg-green-700 text-white font-medium hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Comments list ── */}
      {comments.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
            {comments.length} comment{comments.length === 1 ? '' : 's'}
          </p>

          {comments.map((c) => {
            const isOwn = !!currentUserId && c.user_id === currentUserId
            const isDeleting = deletingId === c.id

            return (
              <div key={c.id} className="flex gap-3 group">
                <CommentAvatar avatarUrl={c.avatar_url} displayName={c.display_name} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium text-stone-700">
                      {c.display_name}
                    </span>
                    <span className="text-[11px] text-stone-300">
                      {timeAgo(c.created_at)}
                    </span>

                    {/* Delete button — only shown to the comment owner */}
                    {isOwn && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        disabled={isDeleting}
                        title="Delete comment"
                        className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-stone-300 hover:text-red-400 disabled:opacity-30 transition-all"
                      >
                        {isDeleting ? (
                          <svg
                            className="w-3 h-3 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                        Delete
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap break-words">
                    {c.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}