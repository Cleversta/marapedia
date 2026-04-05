import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseServer as supabase } from '@/lib/supabase-server'
import { formatDate, timeAgo, getCategoryInfo, getPreferredTranslation } from '@/lib/utils'
import ArticleCard from '@/components/ArticleCard'
import { SITE_NAME, SITE_URL } from '@/lib/config'
import type { Article } from '@/types'

export const revalidate = 600

interface Props {
  params: Promise<{ username: string }>
}

const getContributorByUsername = unstable_cache(
  async (username: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, role, created_at')
      .eq('username', username)
      .single()
    return data
  },
  ['contributor-profile'],
  { revalidate: 600, tags: ['profiles'] }
)

const getContributorArticles = unstable_cache(
  async (authorId: string): Promise<Article[]> => {
    const { data } = await supabase
      .from('articles')
      .select(`
        id, slug, category, status, featured, thumbnail_url, view_count,
        created_at, updated_at,
        profiles(id, username, avatar_url, role, created_at),
        article_translations(id, article_id, language, title, excerpt, content)
      `)
      .eq('author_id', authorId)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
    return (data ?? []) as unknown as Article[]
  },
  ['contributor-articles'],
  { revalidate: 600, tags: ['article'] }
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = await getContributorByUsername(username)
  if (!profile) return { title: `Not Found — ${SITE_NAME}` }
  return {
    title: `${profile.username} — ${SITE_NAME}`,
    description: profile.bio ?? `Articles by ${profile.username} on ${SITE_NAME}`,
  }
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">admin</span>
  )
  if (role === 'editor') return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">editor</span>
  )
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">member</span>
  )
}

export default async function ContributorPage({ params }: Props) {
  const { username } = await params
  const profile = await getContributorByUsername(username)
  if (!profile) notFound()

  const articles = await getContributorArticles(profile.id)

  // Group articles by category
  const categoryGroups: Record<string, Article[]> = {}
  for (const article of articles) {
    if (!categoryGroups[article.category]) categoryGroups[article.category] = []
    categoryGroups[article.category].push(article)
  }

  const totalViews = articles.reduce((s, a) => s + (a.view_count ?? 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Back */}
      <Link
        href="/contributors"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Contributors
      </Link>

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden bg-green-100 flex items-center justify-center text-green-800 font-bold text-2xl ring-2 ring-gray-100">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              : profile.username[0].toUpperCase()
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-display text-xl font-bold text-gray-900">{profile.username}</h1>
              <RoleBadge role={profile.role} />
            </div>
            {profile.full_name && (
              <p className="text-sm text-gray-500 mb-1">{profile.full_name}</p>
            )}
            {profile.bio && (
              <p className="text-sm text-gray-600 leading-relaxed mb-2">{profile.bio}</p>
            )}
            <p className="text-xs text-gray-400">Member since {formatDate(profile.created_at)}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center">
            <div className="font-display text-xl font-bold text-green-700">{articles.length}</div>
            <div className="text-xs text-gray-400">{articles.length === 1 ? 'Article' : 'Articles'}</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl font-bold text-green-700">
              {Object.keys(categoryGroups).length}
            </div>
            <div className="text-xs text-gray-400">{Object.keys(categoryGroups).length === 1 ? 'Category' : 'Categories'}</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl font-bold text-green-700">{totalViews.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Total Views</div>
          </div>
        </div>
      </div>

      {/* Articles */}
      {articles.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-2xl mb-2">✍️</p>
          <p className="text-gray-400 text-sm">No published articles yet.</p>
        </div>
      ) : (
        <div>
          <h2 className="font-display text-lg font-semibold mb-5 flex items-center gap-2">
            Articles
            <span className="text-sm font-normal text-gray-400">({articles.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}