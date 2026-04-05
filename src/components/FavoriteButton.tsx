'use client'
import { useRouter } from 'next/navigation'
import { useFavorite } from '@/hooks/useFavorite'

interface Props {
  articleId: string
  /** 'overlay' = floating pill over thumbnail (ArticleCard top-right)
   *  'button'  = full pill button (ArticleDetailClient footer)
   *  'icon'    = bare heart icon (legacy / small spaces) */
  variant?: 'overlay' | 'button' | 'icon'
  /** Extra classes forwarded to the root element */
  className?: string
}

export default function FavoriteButton({ articleId, variant = 'icon', className = '' }: Props) {
  const router = useRouter()
  const { isFavorited, loading, toggle, isLoggedIn } = useFavorite(articleId)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) { router.push('/login'); return }
    await toggle()
  }

  if (variant === 'overlay') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        title={isFavorited ? 'Remove from favorites' : 'Save article'}
        className={`flex items-center justify-center w-7 h-7 rounded-full
          backdrop-blur-sm shadow transition-all disabled:opacity-40
          ${isFavorited
            ? 'bg-white/90 text-red-500'
            : 'bg-black/30 text-white/80 hover:bg-white/90 hover:text-red-400 opacity-0 group-hover:opacity-100'
          } ${className}`}
      >
        <Heart filled={isFavorited} className="w-3.5 h-3.5" />
      </button>
    )
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium
          transition-all disabled:opacity-40
          ${isFavorited
            ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
            : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400'
          } ${className}`}
      >
        <Heart filled={isFavorited} className="w-3.5 h-3.5" />
        {isFavorited ? 'Saved' : 'Save article'}
      </button>
    )
  }

  // icon variant — matches the share button style in ArticleCard
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={isFavorited ? 'Remove from favorites' : 'Save article'}
      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all
        ${isFavorited
          ? 'text-red-500 opacity-100'
          : 'text-gray-400 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100'
        } ${className}`}
    >
      <Heart filled={isFavorited} className="w-3 h-3" />
    </button>
  )
}

function Heart({ filled, className }: { filled: boolean; className?: string }) {
  return filled ? (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.593c-.425-.394-8.593-7.951-8.593-12.798C3.407 5.164 5.747 3 8.593 3c1.82 0 3.432.981 4.407 2.432C13.975 3.981 15.587 3 17.407 3c2.846 0 5.186 2.164 5.186 5.795 0 4.847-8.168 12.404-8.593 12.798z"/>
    </svg>
  ) : (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
    </svg>
  )
}