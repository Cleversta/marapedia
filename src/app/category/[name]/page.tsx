import { supabase } from '@/lib/supabase'
import { getCategoryInfo, CATEGORIES } from '@/lib/utils'
import ArticleCard from '@/components/ArticleCard'
import Link from 'next/link'
import type { Category, Article } from '@/types'

interface Props {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: Props) {
  const { name } = await params
  const cat = getCategoryInfo(name as Category)
  return { title: `${cat.label} — Marapedia` }
}

export default async function CategoryPage({ params }: Props) {
  const { name } = await params
  const category = name as Category
  const cat = getCategoryInfo(category)

  const { data: articles } = await supabase
    .from('articles')
    .select('*, profiles(*), article_translations(*)')
    .eq('status', 'published')
    .eq('category', category)
    .order('updated_at', { ascending: false })

  const list: Article[] = articles ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <nav className="text-sm text-gray-400 mb-3">
          <Link href="/" className="hover:text-green-700">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{cat.label}</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{cat.icon}</span>
          <div>
            <h1 className="font-display text-3xl font-bold">{cat.label}</h1>
            <p className="text-gray-500 text-sm">{list.length} article{list.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {list.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400 mb-3">No {cat.label.toLowerCase()} articles yet.</p>
              <Link href="/articles/create" className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
                Be the first to contribute
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {list.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">Other categories</h3>
            <div className="flex flex-col gap-1">
              {CATEGORIES.filter(c => c.value !== category).map(c => (
                <Link key={c.value} href={`/category/${c.value}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700 py-1">
                  <span>{c.icon}</span> {c.label}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/articles/create" className="block text-center text-sm px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800">
            + Add {cat.label} article
          </Link>
        </div>
      </div>
    </div>
  )
}
