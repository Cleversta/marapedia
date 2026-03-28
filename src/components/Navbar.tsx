'use client'
import { useState, useEffect, useRef } from 'react'
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
  const [searchFocused, setSearchFocused] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ⌘K / Ctrl+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setMobileMenuOpen(false)
        searchRef.current?.focus()
      }
      // Escape closes menus
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setMobileMenuOpen(false)
        searchRef.current?.blur()
      }
      // Tab cycles through category nav (optional UX hint)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function fetchProfile(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMobileMenuOpen(false)
    }
  }

  const isEditor = profile?.role === 'editor' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  // Detect OS for shortcut hint
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl K'

  // ─── Avatar ──────────────────────────────────────────────────────────────────
  function UserAvatar({ size = 8 }: { size?: number }) {
    const dim = `${size * 4}px`
    if (profile?.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt={profile.username}
          style={{ width: dim, height: dim }}
          className="rounded-full object-cover object-[center_20%] ring-2 ring-white"
        />
      )
    }
    return (
      <div
        style={{ width: dim, height: dim }}
        className="rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-semibold ring-2 ring-white"
      >
        {profile?.username?.[0]?.toUpperCase() ?? 'U'}
      </div>
    )
  }

  // ─── Role Badge ───────────────────────────────────────────────────────────────
  function RoleBadge({ className = '' }: { className?: string }) {
    if (!profile) return null
    if (profile.role === 'admin')
      return (
        <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700 ${className}`}>
          Admin
        </span>
      )
    if (profile.role === 'editor')
      return (
        <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700 ${className}`}>
          Editor
        </span>
      )
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* ── Top bar ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-14 gap-3">

          {/* Logo */}
          <Link href="/" className="font-display text-xl font-bold shrink-0 tracking-tight">
            Mara<span className="text-green-700">pedia</span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full group">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search articles..."
                className="w-full pl-4 pr-20 py-1.5 text-sm border border-gray-300 rounded-full
                  focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20
                  bg-gray-50 focus:bg-white transition-all duration-150"
              />

              {/* Shortcut hint — hidden when focused or has text */}
              {!searchFocused && !searchQuery && (
                <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[10px] text-gray-400
                  border border-gray-200 rounded px-1.5 py-0.5 pointer-events-none select-none
                  transition-opacity duration-150">
                  {shortcutLabel}
                </span>
              )}

              {/* Search icon */}
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors"
                aria-label="Search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                {/* Contribute button */}
                <Link
                  href="/articles/create"
                  className="hidden md:flex items-center gap-1.5 text-sm px-3 py-1.5
                    bg-green-700 text-white rounded-lg hover:bg-green-800 active:scale-95
                    transition-all duration-150 font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Contribute
                </Link>

                {/* User menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 text-sm pl-1 pr-2 py-1 rounded-lg
                      hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
                  >
                    <UserAvatar size={8} />
                    <span className="hidden md:block text-sm font-medium text-gray-800">
                      {profile?.username}
                    </span>
                    <RoleBadge className="hidden md:inline-flex" />
                    {/* Chevron */}
                    <svg
                      className={`hidden md:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {menuOpen && (
                    <div
                      className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200
                        rounded-xl shadow-lg shadow-gray-200/80 overflow-hidden z-50
                        animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      {/* Dropdown header — who's logged in */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar size={9} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {profile?.username}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        {profile?.role && (profile.role === 'admin' || profile.role === 'editor') && (
                          <div className="mt-2">
                            <RoleBadge />
                          </div>
                        )}
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="text-base">👤</span>
                          My Profile
                        </Link>
                        <Link
                          href="/articles/my"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="text-base">📑</span>
                          My Articles
                        </Link>

                        {isEditor && (
                          <>
                            <div className="mx-4 my-1 border-t border-gray-100" />
                            <Link
                              href="/editor"
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <span className="text-base">✏️</span>
                              Editor Panel
                            </Link>
                          </>
                        )}

                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span className="text-base">⚙️</span>
                            Admin Panel
                          </Link>
                        )}

                        <div className="mx-4 my-1 border-t border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600
                            hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg
                    hover:bg-gray-50 active:scale-95 transition-all duration-150"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-lg
                    hover:bg-green-800 active:scale-95 transition-all duration-150 font-medium"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
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

        {/* ── Category nav — desktop ───────────────────────────────────────────── */}
        <nav
          className="hidden md:flex items-center overflow-x-auto scrollbar-hide border-t border-gray-100"
          aria-label="Category navigation"
        >
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.value}
              href={`/category/${cat.value}`}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap
                transition-colors duration-150 border-b-2 -mb-px relative
                ${pathname === `/category/${cat.value}`
                  ? 'border-green-700 text-green-800 font-medium'
                  : 'border-transparent text-gray-500 hover:text-green-700 hover:border-green-300'
                }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.label}</span>
              {/* Tab hint only on first item */}
              {i === 0 && (
                <span className="ml-1 text-[9px] text-gray-400 border border-gray-200
                  rounded px-1 py-0.5 leading-none select-none">
                  Tab
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Mobile menu ─────────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-4">

          {/* Mobile search */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-full
                  bg-gray-50 focus:bg-white focus:outline-none focus:border-green-600
                  focus:ring-2 focus:ring-green-600/20 transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700"
                aria-label="Search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Mobile user info strip */}
          {user && profile && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <UserAvatar size={10} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <RoleBadge />
            </div>
          )}

          {/* Category grid */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Categories
            </p>
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
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile action buttons */}
          <div className="space-y-1 pt-1 border-t border-gray-100">
            {user && (
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base">👤</span> My Profile
              </Link>
            )}
            {isEditor && (
              <Link
                href="/editor"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <span className="text-base">✏️</span> Editor Panel
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <span className="text-base">⚙️</span> Admin Panel
              </Link>
            )}
          </div>

          {/* Contribute / Auth buttons */}
          {user ? (
            <div className="space-y-2 pt-1">
              <Link
                href="/articles/create"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-sm px-3 py-2.5
                  bg-green-700 text-white rounded-xl hover:bg-green-800 active:scale-95
                  transition-all duration-150 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Contribute Article
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2.5
                  border border-red-200 text-red-600 rounded-xl hover:bg-red-50
                  active:scale-95 transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center text-sm px-3 py-2.5 border border-gray-300
                  rounded-xl hover:bg-gray-50 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center text-sm px-3 py-2.5 bg-green-700 text-white
                  rounded-xl hover:bg-green-800 transition-colors font-medium"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}