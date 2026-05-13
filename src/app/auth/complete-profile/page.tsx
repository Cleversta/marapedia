'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({ username: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      const meta = session.user.user_metadata
      setForm(f => ({ ...f, full_name: meta.full_name ?? meta.name ?? '' }))
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const username = form.username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3–20 characters: letters, numbers, and underscores only.')
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      setError('Username already taken. Please choose another.')
      setLoading(false)
      return
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username,
        full_name: form.full_name.trim(),
        role: 'contributor',
      })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  if (!userId) return <div className="text-center py-16 text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold">
            Almost done!<br /><span className="text-green-700">Choose your username</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Set a username to complete your Marapedia profile</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
              placeholder="marauser01"
            />
            <p className="text-xs text-gray-400 mt-1">3–20 characters, letters, numbers, underscores only</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
              placeholder="Your name"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 mt-2"
          >
            {loading ? 'Saving...' : 'Complete profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
