
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [debug, setDebug] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  function update(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setDebug(null)

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', form.username.trim())
      .single()

    if (existing) {
      setError('Username already taken. Please choose another.')
      setLoading(false)
      return
    }

    const result = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username.trim().toLowerCase(),
          full_name: form.full_name.trim(),
        },
      },
    })

    setDebug(result)

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else if (result.data?.user?.identities?.length === 0) {
      // Supabase returns a fake user when email already exists (no error!)
      setError('An account with this email already exists.')
      setLoading(false)
    } else if (result.data?.user && !result.data?.session) {
      // Email confirmation required
      setSuccess('Account created! Please check your email to confirm your account before signing in.')
      setLoading(false)
    } else {
      setSuccess('Account created successfully! Redirecting...')
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold">Join <span className="text-green-700">Marapedia</span></h1>
          <p className="text-gray-500 text-sm mt-1">Help preserve Mara history and culture</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
            ✅ {success}
          </div>
        )}

        {debug && (
          <details className="mb-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">🐛 Debug info</summary>
            <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-48 text-gray-600">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => update('username', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
                placeholder="marauser01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => update('full_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
                placeholder="Your name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-green-700 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
