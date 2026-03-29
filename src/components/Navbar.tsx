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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setMobileMenuOpen(false)
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setMobileMenuOpen(false)
        searchRef.current?.blur()
      }
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
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl K'

  function catHref(cat: typeof CATEGORIES[number]) {
    return (cat as any).href ?? `/category/${cat.value}`
  }
  function isCatActive(cat: typeof CATEGORIES[number]) {
    return pathname === catHref(cat)
  }

  function UserAvatar({ size = 8 }: { size?: number }) {
    const dim = `${size * 4}px`
    if (profile?.avatar_url)
      return (
        <img
          src={profile.avatar_url}
          alt={profile.username}
          style={{ width: dim, height: dim }}
          className="rounded-full object-cover object-[center_20%] ring-2 ring-white shadow-sm"
        />
      )
    return (
      <div
        style={{ width: dim, height: dim }}
        className="rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm"
      >
        {profile?.username?.[0]?.toUpperCase() ?? 'U'}
      </div>
    )
  }

  function RoleBadge({ className = '' }: { className?: string }) {
    if (!profile) return null
    if (profile.role === 'admin')
      return (
        <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 tracking-wide ${className}`}>
          Admin
        </span>
      )
    if (profile.role === 'editor')
      return (
        <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-100 text-sky-700 tracking-wide ${className}`}>
          Editor
        </span>
      )
    return null
  }

  return (
    <>
      <style>{`
        .nav-search-input::placeholder { color: #9ca3af; }
        .nav-search-input:focus::placeholder { color: #d1d5db; }
        .dropdown-enter {
          animation: dropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mobile-menu-enter {
          animation: slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* ── Top bar ── */}
          <div className="flex items-center h-[60px] gap-4">

        <Link href="/" className="shrink-0 flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-100 scale-0 group-hover:scale-110 transition-transform duration-300 ease-out" />
            <img
              src="/MARAPEDIA.png"
              alt="Marapedia"
              className="relative h-11 w-11 object-contain drop-shadow-sm
                transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-md"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-[1.15rem] font-bold tracking-tight text-gray-900">
              Mara<span className="text-green-700">pedia</span>
            </span>
            <span className="text-[9px] text-gray-400 tracking-[0.2em] uppercase font-medium mt-0.5">
              Since 2026
            </span>
          </div>
        </Link>

            {/* Search — desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-auto">
              <div className={`relative w-full transition-all duration-200 ${searchFocused ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute inset-0 rounded-xl transition-all duration-200 pointer-events-none
                  ${searchFocused
                    ? 'shadow-[0_0_0_3px_rgba(21,128,61,0.12)] border border-green-500'
                    : 'border border-gray-200'
                  } bg-gray-50 rounded-xl`}
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search the encyclopedia..."
                  className="nav-search-input relative z-10 w-full pl-10 pr-20 py-2 text-sm bg-transparent rounded-xl focus:outline-none text-gray-800"
                />
                {!searchFocused && !searchQuery && (
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[10px] text-gray-400
                    border border-gray-200 rounded-md px-1.5 py-0.5 font-mono bg-white pointer-events-none select-none
                    shadow-[0_1px_0_rgba(0,0,0,0.08)]">
                    {shortcutLabel}
                  </kbd>
                )}
                {searchQuery && (
                  <button type="submit"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 text-[11px] font-medium px-2 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors">
                    Go
                  </button>
                )}
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {user ? (
                <>
                  <Link
                    href="/articles/create"
                    className="hidden md:flex items-center gap-1.5 text-sm px-3.5 py-2
                      bg-green-700 text-white rounded-lg hover:bg-green-800
                      active:scale-95 transition-all duration-150 font-medium shadow-sm shadow-green-900/20"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Contribute
                  </Link>

                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      aria-expanded={menuOpen}
                      className="flex items-center gap-2 pl-1 pr-2.5 py-1.5 rounded-xl
                        hover:bg-gray-50 active:bg-gray-100 transition-all duration-150
                        border border-transparent hover:border-gray-200"
                    >
                      <UserAvatar size={8} />
                      <div className="hidden md:flex flex-col items-start leading-none">
                        <span className="text-[13px] font-semibold text-gray-800">{profile?.username}</span>
                        <RoleBadge className="mt-0.5" />
                      </div>
                      <svg className={`hidden md:block w-3 h-3 text-gray-400 ml-0.5 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {menuOpen && (
                      <div className="dropdown-enter absolute right-0 mt-2 w-60 bg-white border border-gray-100
                        rounded-2xl shadow-xl shadow-gray-200/70 overflow-hidden z-50">
                        <div className="px-4 py-3.5 bg-gradient-to-br from-green-50 to-emerald-50/60 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <UserAvatar size={10} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900 truncate">{profile?.username}</p>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                              {profile?.role && (profile.role === 'admin' || profile.role === 'editor') && (
                                <div className="mt-1.5"><RoleBadge /></div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="py-1.5">
                          <Link href="/profile" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                            <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm group-hover:bg-gray-200 transition-colors">👤</span>
                            My Profile
                          </Link>
                          <Link href="/articles/my" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                            <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm group-hover:bg-gray-200 transition-colors">📑</span>
                            My Articles
                          </Link>
                          {isEditor && (
                            <>
                              <div className="mx-3 my-1.5 border-t border-gray-100" />
                              <Link href="/editor" onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-sky-700 hover:bg-sky-50 transition-colors">
                                <span className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sm">✏️</span>
                                <span className="font-medium">Editor Panel</span>
                              </Link>
                            </>
                          )}
                          {isAdmin && (
                            <Link href="/admin" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-violet-700 hover:bg-violet-50 transition-colors">
                              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-sm">⚙️</span>
                              <span className="font-medium">Admin Panel</span>
                            </Link>
                          )}
                          <div className="mx-3 my-1.5 border-t border-gray-100" />
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group">
                            <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                              <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            </span>
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login"
                    className="text-sm px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-150">
                    Sign in
                  </Link>
                  <Link href="/register"
                    className="text-sm px-4 py-2 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 active:scale-95 transition-all duration-150 shadow-sm shadow-green-900/20">
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>

          {/* ── Category pill tabs — desktop ── */}
          <nav
            className="hidden md:flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-t border-gray-100 py-2.5 -mx-4 px-4"
            aria-label="Category navigation"
          >
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.value}
                href={catHref(cat)}
                className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 whitespace-nowrap
                  rounded-full border font-medium shrink-0 transition-all duration-150
                  ${isCatActive(cat)
                    ? 'border-green-700 bg-green-700 text-white shadow-sm shadow-green-900/20'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-green-300 hover:text-green-700 hover:bg-green-50'
                  }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
                {i === 0 && (
                  <span className={`ml-0.5 text-[9px] border rounded px-1 py-0.5 leading-none select-none
                    ${isCatActive(cat) ? 'border-green-500 opacity-70' : 'border-gray-200 text-gray-400'}`}>
                    Tab
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Mobile menu ── */}
        {mobileMenuOpen && (
          <div className="mobile-menu-enter md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-4">

              {/* Mobile search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl
                      bg-gray-50 focus:bg-white focus:outline-none focus:border-green-500
                      focus:ring-2 focus:ring-green-500/10 transition-all"
                  />
                </div>
              </form>

              {/* User card */}
              {user && profile && (
                <div className="flex items-center gap-3 px-3.5 py-3 bg-gradient-to-br from-green-50 to-emerald-50/60 rounded-xl border border-green-100">
                  <UserAvatar size={10} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{profile.username}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <RoleBadge />
                </div>
              )}

              {/* Categories — pill grid */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">Browse</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <Link
                      key={cat.value}
                      href={catHref(cat)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium transition-all duration-150
                        ${isCatActive(cat)
                          ? 'border-green-700 bg-green-700 text-white shadow-sm shadow-green-900/20'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-700 hover:bg-green-50'
                        }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              {user && (
                <div className="border-t border-gray-100 pt-3 space-y-0.5">
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-sm px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                    <span>👤</span> My Profile
                  </Link>
                  <Link href="/articles/my" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-sm px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                    <span>📑</span> My Articles
                  </Link>
                  {isEditor && (
                    <Link href="/editor" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-sm px-3 py-2.5 rounded-xl text-sky-700 hover:bg-sky-50 transition-colors font-medium">
                      <span>✏️</span> Editor Panel
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-sm px-3 py-2.5 rounded-xl text-violet-700 hover:bg-violet-50 transition-colors font-medium">
                      <span>⚙️</span> Admin Panel
                    </Link>
                  )}
                </div>
              )}

              {/* CTA buttons */}
              <div className="pt-1 space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/articles/create"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 text-sm px-4 py-3
                        bg-green-700 text-white rounded-xl hover:bg-green-800 active:scale-95
                        transition-all duration-150 font-semibold shadow-sm shadow-green-900/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Contribute Article
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5
                        border border-red-200 text-red-600 rounded-xl hover:bg-red-50
                        active:scale-95 transition-all duration-150 font-medium">
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 text-center text-sm px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700">
                      Sign in
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 text-center text-sm px-4 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-colors font-semibold shadow-sm shadow-green-900/20">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}