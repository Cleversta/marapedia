'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/utils'
import type { Profile } from '@/types'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchProfile(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <Link href="/" className="font-display text-xl font-bold shrink-0">
            Mara<span className="text-green-700">pedia</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-4 pr-10 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link
                  href="/articles/create"
                  className="hidden md:flex items-center gap-1 text-sm px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
                >
                  + Contribute
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-semibold">
                      {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <span className="hidden md:block text-sm text-gray-700">{profile?.username}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm z-50">
                      <Link href="/profile" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>My Profile</Link>
                      {profile?.role === 'admin' && (
                        <Link href="/admin" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
                      )}
                      <hr className="my-1" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600">Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Login</Link>
                <Link href="/register" className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors">Register</Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded-md hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Category nav — desktop only, single row */}
        <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto scrollbar-hide border-t border-gray-100">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.value}
              href={`/category/${cat.value}`}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap transition-colors border-b-2 -mb-px ${
                pathname === `/category/${cat.value}`
                  ? 'border-green-700 text-green-800 font-medium'
                  : 'border-transparent text-gray-500 hover:text-green-700 hover:border-green-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile expanded menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-green-600"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
          {/* Mobile categories */}
          <div className="grid grid-cols-2 gap-1">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.value}
                href={`/category/${cat.value}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors ${
                  pathname === `/category/${cat.value}`
                    ? 'bg-green-50 text-green-800 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
          {user && (
            <Link
              href="/articles/create"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 flex items-center justify-center gap-1 text-sm px-3 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
            >
              + Contribute
            </Link>
          )}
        </div>
      )}
    </header>
  )
}