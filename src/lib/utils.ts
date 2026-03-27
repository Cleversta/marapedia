import { type ClassValue, clsx } from 'clsx'
import { formatDistanceToNow, format } from 'date-fns'
import slugify from 'slugify'
import type { Category, Language } from '@/types'

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

export const CATEGORIES: { value: Category; label: string; icon: string; color: string }[] = [
  { value: 'history', label: 'History', icon: '📜', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'songs', label: 'Songs & Lyrics', icon: '🎵', color: 'bg-red-50 text-red-800 border-red-200' },
  { value: 'poems', label: 'Poems', icon: '✍️', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { value: 'stories', label: 'Stories', icon: '📖', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { value: 'people', label: 'Famous People', icon: '👤', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  { value: 'places', label: 'Villages & Places', icon: '🏘️', color: 'bg-green-50 text-green-800 border-green-200' },
  { value: 'culture', label: 'Culture', icon: '🎭', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  { value: 'religion', label: 'Religion', icon: '⛪', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { value: 'language', label: 'Language', icon: '🗣️', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  { value: 'other', label: 'Other', icon: '📁', color: 'bg-gray-50 text-gray-800 border-gray-200' },
]

export const LANGUAGES: { value: Language; label: string; nativeLabel: string }[] = [
  { value: 'mara', label: 'Mara', nativeLabel: 'Mara' },
  { value: 'english', label: 'English', nativeLabel: 'English' },
  { value: 'myanmar', label: 'Myanmar', nativeLabel: 'မြန်မာ' },
  { value: 'mizo', label: 'Mizo', nativeLabel: 'Mizo' },
]

export function getCategoryInfo(value: Category) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function makeExcerpt(content: string, length = 150): string {
  const plain = stripHtml(content)
  return plain.length > length ? plain.substring(0, length) + '...' : plain
}
