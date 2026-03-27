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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="font-display text-xl font-bold shrink-0">
            Mara<span className="text-green-700">pedia</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-4 pr-10 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-green-600"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/articles/create"
                  className="hidden md:flex items-center gap-1 text-sm px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800"
                >
                  <span>+</span> Contribute
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-sm px-2 py-1 rounded-md hover:bg-gray-100"
                  >
                    <div className="w-7 h-7 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-semibold">
                      {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <span className="hidden md:block">{profile?.username}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
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
                <Link href="/login" className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50">Login</Link>
                <Link href="/register" className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800">Register</Link>
              </>
            )}
          </div>
        </div>

        {/* Category nav */}
        <div className="hidden md:flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.value}
              href={`/category/${cat.value}`}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-t-md whitespace-nowrap hover:bg-green-50 hover:text-green-800 transition-colors ${
                pathname === `/category/${cat.value}` ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600'
              }`}
            >
              <span>{cat.icon}</span> {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
