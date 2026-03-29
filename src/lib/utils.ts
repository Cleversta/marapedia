import { type ClassValue, clsx } from 'clsx'
import { formatDistanceToNow, format } from 'date-fns'
import slugify from 'slugify'
import type { Category, Language, ArticleTranslation } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function createSlug(title: string): string {
  return slugify(title, { lower: true, strict: true, trim: true })
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export const CATEGORIES: { value: Category; label: string; icon: string; color: string; href?: string }[] = [
  { value: 'history',  label: 'History',          icon: '📜', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'songs',    label: 'Songs\'s Lyrics',    icon: '🎵', color: 'bg-red-50 text-red-800 border-red-200' },
  { value: 'poems',    label: 'Poems',             icon: '✍️', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { value: 'stories',  label: 'Stories',           icon: '📖', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { value: 'people',   label: 'Famous People',     icon: '👤', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  { value: 'places',   label: 'Villages & Places', icon: '🏘️', color: 'bg-green-50 text-green-800 border-green-200' },
  { value: 'culture',  label: 'Culture',           icon: '🎭', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  { value: 'religion', label: 'Religion',          icon: '⛪', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { value: 'language', label: 'Language',          icon: '🗣️', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  { value: 'photos' as Category,  label: 'Photos', icon: '📷', color: 'bg-pink-50 text-pink-800 border-pink-200', href: '/photos' },
  { value: 'other',    label: 'Other',             icon: '📁', color: 'bg-gray-50 text-gray-800 border-gray-200' },
]

// ─── Article types per category — tailored for the Mara people ───────────────
export const ARTICLE_TYPES: Record<Category, { value: string; label: string }[]> = {
  songs: [
    { value: 'worship',    label: '🙏 Worship Song' },
    { value: 'hymn',       label: '⛪ Hymn' },
    { value: 'love',       label: '❤️ Love Song' },
    { value: 'folk',       label: '🎶 Folk Song' },
    { value: 'childrens',  label: '🧒 Children\'s Song' },
    { value: 'lullaby',    label: '🌙 Lullaby' },
    { value: 'patriotic',  label: '🏔️ Patriotic Song' },
    { value: 'other',      label: '📁 Other' },
  ],
  poems: [
    { value: 'spiritual',  label: '✝️ Spiritual / Devotional' },
    { value: 'nature',     label: '🌿 Nature' },
    { value: 'love',       label: '❤️ Love' },
    { value: 'cultural',   label: '🎭 Cultural' },
    { value: 'lament',     label: '😔 Lament' },
    { value: 'praise',     label: '🙌 Praise' },
    { value: 'historical', label: '📜 Historical' },
    { value: 'other',      label: '📁 Other' },
  ],
  history: [
    { value: 'village',    label: '🏘️ Village History' },
    { value: 'migration',  label: '🚶 Migration' },
    { value: 'chin_state', label: '🇲🇲 Chin State History' },
    { value: 'india',      label: '🇮🇳 India / Mizoram History' },
    { value: 'war',        label: '⚔️ War & Conflict' },
    { value: 'leadership', label: '👑 Leadership' },
    { value: 'church',     label: '⛪ Church History' },
    { value: 'other',      label: '📁 Other' },
  ],
  stories: [
    { value: 'folktale',   label: '🌙 Folktale' },
    { value: 'legend',     label: '⚡ Legend' },
    { value: 'moral',      label: '📖 Moral Story' },
    { value: 'creation',   label: '🌏 Creation Story' },
    { value: 'other',      label: '📁 Other' },
  ],
  people: [
    { value: 'pastor',     label: '✝️ Pastor / Church Leader' },
    { value: 'chief',      label: '👑 Chief / Village Leader' },
    { value: 'artist',     label: '🎵 Artist / Musician' },
    { value: 'teacher',    label: '📚 Teacher / Scholar' },
    { value: 'warrior',    label: '⚔️ Warrior' },
    { value: 'missionary', label: '🌍 Missionary' },
    { value: 'other',      label: '📁 Other' },
  ],
  places: [
    { value: 'chin_village',   label: '🇲🇲 Village in Chin State' },
    { value: 'india_village',  label: '🇮🇳 Village in Mizoram / India' },
    { value: 'sacred',         label: '✝️ Sacred Site' },
    { value: 'river',          label: '🌊 River' },
    { value: 'mountain',       label: '⛰️ Mountain' },
    { value: 'other',          label: '📁 Other' },
  ],
  culture: [
    { value: 'festival',   label: '🎉 Festival' },
    { value: 'dance',      label: '💃 Traditional Dance' },
    { value: 'food',       label: '🍽️ Food & Cuisine' },
    { value: 'clothing',   label: '👘 Clothing & Dress' },
    { value: 'ceremony',   label: '🕯️ Ceremony & Ritual' },
    { value: 'other',      label: '📁 Other' },
  ],
  religion: [
    { value: 'hymn',       label: '🎵 Hymn' },
    { value: 'prayer',     label: '🙏 Prayer' },
    { value: 'sermon',     label: '📖 Sermon' },
    { value: 'testimony',  label: '✝️ Testimony' },
    { value: 'bible',      label: '📗 Bible Study' },
    { value: 'church',     label: '⛪ Church History' },
    { value: 'other',      label: '📁 Other' },
  ],
  language: [
    { value: 'tlosai',     label: '🗣️ Tlosai Dialect' },
    { value: 'vocabulary', label: '📝 Vocabulary' },
    { value: 'proverb',    label: '💬 Proverb' },
    { value: 'grammar',    label: '📖 Grammar' },
    { value: 'other',      label: '📁 Other' },
  ],
  other: [
    { value: 'general',    label: '📁 General' },
    { value: 'other',      label: '📁 Other' },
  ],
}

export const LANGUAGES: { value: Language; label: string; nativeLabel: string }[] = [
  { value: 'mara',    label: 'Mara',    nativeLabel: 'Mara' },
  { value: 'english', label: 'English', nativeLabel: 'English' },
  { value: 'myanmar', label: 'Myanmar', nativeLabel: 'မြန်မာ' },
  { value: 'mizo',    label: 'Mizo',    nativeLabel: 'Mizo' },
]

export function getCategoryInfo(value: Category) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}

export function getArticleTypeLabel(category: Category, type: string | null | undefined): string | null {
  if (!type) return null
  const found = ARTICLE_TYPES[category]?.find(t => t.value === type)
  return found?.label ?? null
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function makeExcerpt(content: string, length = 150): string {
  const plain = stripHtml(content)
  return plain.length > length ? plain.substring(0, length) + '...' : plain
}

// ─── Language priority: Mara → English → Myanmar → Mizo ──────────────────────
const LANGUAGE_PRIORITY = ['mara', 'english', 'myanmar', 'mizo'] as const

export function getPreferredTranslation(
  translations: ArticleTranslation[] | null | undefined
): ArticleTranslation | null {
  if (!translations || translations.length === 0) return null
  for (const lang of LANGUAGE_PRIORITY) {
    const found = translations.find(t => t.language === lang)
    if (found) return found
  }
  return translations[0]
}