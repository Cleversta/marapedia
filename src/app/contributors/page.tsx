// app/contributors/page.tsx

import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabaseServer as supabase } from '@/lib/supabase-server'
import { formatDate } from '@/lib/utils'
import { SITE_NAME } from '@/lib/config'

export const revalidate = 600

export const metadata: Metadata = {
  title: `Contributors — ${SITE_NAME}`,
  description: 'Meet the community members who contribute to Marapedia.',
}

interface Contributor {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string
  created_at: string
  article_count: number
  published_count: number
}

const getContributors = unstable_cache(
  async (): Promise<Contributor[]> => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, role, created_at')
      .order('created_at', { ascending: true })

    if (!profiles || profiles.length === 0) return []

    const { data: articles } = await supabase
      .from('articles')
      .select('author_id, status')

    const countMap: Record<string, { total: number; published: number }> = {}
    for (const a of articles ?? []) {
      if (!a.author_id) continue
      if (!countMap[a.author_id]) countMap[a.author_id] = { total: 0, published: 0 }
      countMap[a.author_id].total++
      if (a.status === 'published') countMap[a.author_id].published++
    }

    return profiles.map(p => ({
      ...p,
      article_count: countMap[p.id]?.total ?? 0,
      published_count: countMap[p.id]?.published ?? 0,
    }))
  },
  ['contributors-list'],
  { revalidate: 600, tags: ['article', 'profiles'] }
)

// Sort helpers
function sortByArticles(a: Contributor, b: Contributor) {
  if (b.published_count !== a.published_count) return b.published_count - a.published_count
  if (b.article_count !== a.article_count) return b.article_count - a.article_count
  return a.username.localeCompare(b.username)
}

function sortByNewest(a: Contributor, b: Contributor) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

// Role badge variants
function AdminBadge() {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold tracking-wide">
      admin
    </span>
  )
}

function EditorBadge() {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold tracking-wide">
      editor
    </span>
  )
}

function MemberBadge() {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold tracking-wide">
      member
    </span>
  )
}

// Full-width row card for admins & editors
function StaffCard({ contributor, rank }: { contributor: Contributor; rank: number }) {
  return (
    <Link
      href={`/contributors/${contributor.username}`}
      className="group bg-white border border-gray-200 rounded-xl px-4 py-3
        hover:border-green-300 hover:shadow-sm transition-all duration-150 flex items-center gap-4"
    >
      {/* Rank */}
      <div className="w-6 text-center shrink-0 text-xs font-bold text-gray-300">
        #{rank}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm ring-1 ring-gray-200">
        {contributor.avatar_url
          ? <img src={contributor.avatar_url} alt={contributor.username} className="w-full h-full object-cover" />
          : contributor.username[0].toUpperCase()
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900 group-hover:text-green-800 transition-colors">
            {contributor.username}
          </span>
          {contributor.full_name && (
            <span className="text-xs text-gray-400 truncate">{contributor.full_name}</span>
          )}
          {contributor.role === 'admin' ? <AdminBadge /> : <EditorBadge />}
        </div>
        {contributor.bio && (
          <p className="text-xs text-gray-400 truncate mt-0.5 max-w-xs">{contributor.bio}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(contributor.created_at)}</p>
      </div>

      {/* Article counts */}
      <div className="text-right shrink-0">
        <div className="font-display font-bold text-lg text-green-700">
          {contributor.published_count}
        </div>
        <div className="text-[10px] text-gray-400">
          {contributor.published_count === 1 ? 'article' : 'articles'}
        </div>
        {contributor.article_count > contributor.published_count && (
          <div className="text-[10px] text-amber-500">
            +{contributor.article_count - contributor.published_count} draft
          </div>
        )}
      </div>

      {/* Arrow */}
      <svg
        className="w-4 h-4 text-gray-300 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all shrink-0"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// Compact card for members (grid layout), sorted newest first
function MemberCard({ contributor }: { contributor: Contributor }) {
  return (
    <Link
      href={`/contributors/${contributor.username}`}
      className="group bg-white border border-gray-100 rounded-xl px-3 py-3
        hover:border-green-300 hover:shadow-sm transition-all duration-150 flex items-center gap-3"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-green-100 flex items-center justify-center text-green-800 font-bold text-xs ring-1 ring-gray-200">
        {contributor.avatar_url
          ? <img src={contributor.avatar_url} alt={contributor.username} className="w-full h-full object-cover" />
          : contributor.username[0].toUpperCase()
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-xs text-gray-800 group-hover:text-green-800 transition-colors truncate">
            {contributor.username}
          </span>
          <MemberBadge />
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Joined {formatDate(contributor.created_at)}
        </p>
        {contributor.published_count > 0 && (
          <p className="text-[10px] text-green-600 font-medium mt-0.5">
            {contributor.published_count} {contributor.published_count === 1 ? 'article' : 'articles'}
          </p>
        )}
      </div>
    </Link>
  )
}

// Section heading
function SectionHeading({
  label,
  count,
  color = 'gray',
}: {
  label: string
  count: number
  color?: 'purple' | 'blue' | 'green' | 'gray'
}) {
  const dot: Record<string, string> = {
    purple: 'bg-purple-400',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
    gray: 'bg-gray-300',
  }
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot[color]}`} />
      <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </h2>
      <span className="text-xs text-gray-300 font-medium">({count})</span>
    </div>
  )
}

export default async function ContributorsPage() {
  const contributors = await getContributors()

  const admins = contributors.filter(c => c.role === 'admin').sort(sortByArticles)
  const editors = contributors.filter(c => c.role === 'editor').sort(sortByArticles)
  const members = contributors.filter(c => c.role !== 'admin' && c.role !== 'editor').sort(sortByNewest)

  const totalPublished = contributors.reduce((s, c) => s + c.published_count, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-green-700 font-medium mb-2">Community</p>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Contributors</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          The people preserving Mara history, songs, stories, and culture.
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-6">
          <div>
            <div className="font-display text-xl font-bold text-green-700">{contributors.length}</div>
            <div className="text-xs text-gray-400">Total Members</div>
          </div>
          <div>
            <div className="font-display text-xl font-bold text-purple-600">{admins.length}</div>
            <div className="text-xs text-gray-400">Admins</div>
          </div>
          <div>
            <div className="font-display text-xl font-bold text-blue-600">{editors.length}</div>
            <div className="text-xs text-gray-400">Editors</div>
          </div>
          <div>
            <div className="font-display text-xl font-bold text-green-700">{totalPublished}</div>
            <div className="text-xs text-gray-400">Articles</div>
          </div>
        </div>
      </div>

      {/* Admins */}
      {admins.length > 0 && (
        <div className="mb-10">
          <SectionHeading label="Admins" count={admins.length} color="purple" />
          <div className="flex flex-col gap-2">
            {admins.map((c, i) => (
              <StaffCard key={c.id} contributor={c} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Editors */}
      {editors.length > 0 && (
        <div className="mb-10">
          <SectionHeading label="Editors" count={editors.length} color="blue" />
          <div className="flex flex-col gap-2">
            {editors.map((c, i) => (
              <StaffCard key={c.id} contributor={c} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      {members.length > 0 && (
        <div className="mb-10">
          <SectionHeading label="Members" count={members.length} color="green" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {members.map(c => (
              <MemberCard key={c.id} contributor={c} />
            ))}
          </div>
        </div>
      )}

      {contributors.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400">No contributors yet.</p>
        </div>
      )}
    </div>
  )
}