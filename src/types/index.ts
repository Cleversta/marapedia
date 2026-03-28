// src/types/index.ts

export type Language = 'mara' | 'english' | 'myanmar' | 'mizo'

export type Category =
  | 'history'
  | 'songs'
  | 'poems'
  | 'stories'
  | 'people'
  | 'places'
  | 'culture'
  | 'religion'
  | 'language'
  | 'other'

export type ArticleStatus = 'published' | 'draft' | 'archived'

// ─── Role hierarchy: member < editor < admin ──────────────────────────────────
export type Role = 'member' | 'editor' | 'admin'

export interface ArticleTranslation {
  id: string
  article_id: string
  language: Language
  title: string
  content: string
  excerpt?: string | null
  thumbnail_url?: string | null
  created_at: string
}

export interface Article {
  id: string
  slug: string
  category: Category
  article_type?: string | null
  status: ArticleStatus
  featured: boolean
  view_count?: number
  thumbnail_url?: string | null
  excerpt?: string | null
  created_at: string
  updated_at?: string | null
  author_id?: string
  article_translations?: ArticleTranslation[]
  profiles?: Profile | null
}

export interface Profile {
  id: string
  username: string
  full_name?: string | null
  role: Role
  created_at: string
  avatar_url?: string | null
  bio?: string | null
}

export interface ArticleRevision {
  id: string
  article_id: string
  content: string
  title: string
  language: Language
  revised_by: string
  created_at: string
  edited_at?: string | null
}