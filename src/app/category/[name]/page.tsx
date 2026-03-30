import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { getCategoryInfo } from '@/lib/utils'
import CategoryPageClient from './CategoryPageClient'
import type { Category, Article } from '@/types'

export const revalidate = 1800

interface Props {
  params: { name: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCategoryInfo(params.name as Category)
  return {
    title: `${cat.label} — Marapedia`,
    description: `Browse all ${cat.label.toLowerCase()} articles on Marapedia, the free Mara encyclopedia.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const category = params.name as Category

  const { data: articles } = await supabase
    .from('articles')
    .select('*, profiles(*), article_translations(*)')
    .eq('status', 'published')
    .eq('category', category)
    .order('updated_at', { ascending: false })

  return <CategoryPageClient articles={articles ?? []} category={category} />
}