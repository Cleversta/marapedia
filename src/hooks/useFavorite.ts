'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useFavorite(articleId: string) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setLoading(false); return }
      setUserId(session.user.id)

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('article_id', articleId)
        .maybeSingle()

      setIsFavorited(!!data)
      setLoading(false)
    })
  }, [articleId])

  async function toggle() {
    if (!userId) return false // not logged in

    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId)
      setIsFavorited(false)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: userId, article_id: articleId })
      setIsFavorited(true)
    }
    return true
  }

  return { isFavorited, loading, toggle, isLoggedIn: !!userId }
}