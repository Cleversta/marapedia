'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/utils'
import type { Profile } from '@/types'
import NotificationBell from '@/components/NotificationBell'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [shortcutLabel, setShortcutLabel] = useState('Ctrl K')
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setShortcutLabel('⌘K')
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
    })

    supabase
      .from('articles')
      .select('category')
      .eq('status', 'published')
      .then(({ data }) => {
        const counts: Record<string, number> = {}
        data?.forEach(({ category }) => {
          counts[category] = (counts[category] ?? 0) + 1
        })
        setCategoryCounts(counts)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setDrawerOpen(false)
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  async function fetchProfile(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setDrawerOpen(false)
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

  const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  const isEditor = profile?.role === 'editor' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  function catHref(cat: typeof CATEGORIES[number]) {
    return (cat as any).href ?? `/category/${cat.value}`
  }
  function isCatActive(cat: typeof CATEGORIES[number]) {
    return pathname === catHref(cat)
  }
  function formatCount(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return n.toLocaleString()
  }

  function CountBadge({ cat, active, size = 'md' }: {
    cat: typeof CATEGORIES[number]; active: boolean; size?: 'sm' | 'md'
  }) {
    const isAll = (cat as any).href === '/'
    const raw = isAll ? totalCount : (categoryCounts[cat.value] ?? null)
    if (raw === null || raw === 0) return null
    return (
      <span className={`inline-flex items-center justify-center font-extrabold rounded-full leading-none
        transition-all duration-150
        ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'}
        ${active ? 'bg-white text-green-700' : 'bg-green-50 text-green-700 border border-green-200'}`}
        style={{ letterSpacing: '-0.02em' }}>
        {formatCount(raw)}
      </span>
    )
  }

  function UserAvatar({ size = 8 }: { size?: number }) {
    const dim = `${size * 4}px`
    if (profile?.avatar_url)
      return (
        <img src={profile.avatar_url} alt={profile.username}
          style={{ width: dim, height: dim }}
          className="rounded-full object-cover object-[center_20%] ring-2 ring-white shadow-sm" />
      )
    return (
      <div style={{ width: dim, height: dim }}
        className="rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
        {profile?.username?.[0]?.toUpperCase() ?? 'U'}
      </div>
    )
  }

  function RoleBadge() {
    if (!profile) return null
    if (profile.role === 'admin')
      return <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 tracking-wide">Admin</span>
    if (profile.role === 'editor')
      return <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-100 text-sky-700 tracking-wide">Editor</span>
    return null
  }

  return (
    <>
      <style>{`
        .nav-search-input::placeholder { color: #9ca3af; }
        .nav-search-input:focus::placeholder { color: #d1d5db; }
        .drawer-slide {
          animation: drawerIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes drawerIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .drawer-overlay {
          animation: fadeIn 0.2s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── Profile Drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="drawer-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <div className="drawer-slide fixed top-0 right-0 h-full z-50 w-[300px] sm:w-[320px]
            bg-gray-50 shadow-2xl flex flex-col">

            {/* ── Header gradient ── */}
            <div className="relative bg-gradient-to-br from-green-900 to-green-600 px-5 pt-10 pb-6 overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="absolute bottom-[-20px] right-8 w-16 h-16 rounded-full bg-white/5" />

              {/* Close button */}
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                  flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Avatar */}
              <div className="relative w-16 h-16 mb-3">
                <div className="w-16 h-16 rounded-full ring-[3px] ring-white/30 overflow-hidden
                  bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username}
                      className="w-full h-full object-cover object-[center_20%]" />
                  ) : (
                    <span className="text-2xl font-black text-white">
                      {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  )}
                </div>
              </div>

              {/* Name + email + role */}
              <p className="text-white font-black text-lg tracking-tight leading-none">
                {profile?.username}
              </p>
              <p className="text-green-200 text-xs mt-1 mb-2 truncate">{user?.email}</p>

              {profile?.role === 'admin' && (
                <span className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-full font-bold
                  bg-violet-500/30 text-violet-200 border border-violet-400/30 tracking-wide">
                  ⚙️ Admin
                </span>
              )}
              {profile?.role === 'editor' && (
                <span className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-full font-bold
                  bg-sky-500/30 text-sky-200 border border-sky-400/30 tracking-wide">
                  ✏️ Editor
                </span>
              )}
              {profile?.role !== 'admin' && profile?.role !== 'editor' && (
                <span className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-full font-bold
                  bg-white/10 text-white/70 border border-white/20 tracking-wide">
                  📖 Member
                </span>
              )}
            </div>

            {/* ── Menu items ── */}
            <div className="flex-1 overflow-y-auto py-3">
              <p className="px-5 pt-2 pb-1 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">
                Account
              </p>

              <DrawerItem
                icon="👤" label="My Profile" subtitle="View & edit your info"
                href="/profile" onClick={() => setDrawerOpen(false)}
              />
              <DrawerItem
                icon="📑" label="My Articles" subtitle="Manage your contributions"
                href="/articles/my" onClick={() => setDrawerOpen(false)}
              />

              {isEditor && (
                <>
                  <p className="px-5 pt-4 pb-1 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">
                    Management
                  </p>
                  <DrawerItem
                    icon="✏️" label="Editor Panel" subtitle="Review & publish content"
                    href="/editor" onClick={() => setDrawerOpen(false)} accent="sky"
                  />
                </>
              )}
              {isAdmin && (
                <DrawerItem
                  icon="⚙️" label="Admin Panel" subtitle="Full site control"
                  href="/admin" onClick={() => setDrawerOpen(false)} accent="violet"
                />
              )}

              <div className="mx-4 my-3 border-t border-gray-200" />

              <DrawerItem
                icon="✍️" label="Contribute Article" subtitle="Share your knowledge"
                href={pathname.startsWith('/category/')
                  ? `/articles/create?category=${pathname.split('/category/')[1]}`
                  : '/articles/create'}
                onClick={() => setDrawerOpen(false)} accent="green"
              />
            </div>

            {/* ── Sign out ── */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  bg-red-50 border border-red-100 text-red-600
                  hover:bg-red-100 active:scale-[0.98] transition-all duration-150 group"
              >
                <span className="w-8 h-8 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">Sign out</p>
                </div>
                <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* ── Top bar ── */}
          <div className="flex items-center h-[60px] gap-4">

            <Link href="/" className="shrink-0 flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-100 scale-0 group-hover:scale-110 transition-transform duration-300 ease-out" />
                <img src="/MARAPEDIA.png" alt="Marapedia"
                  className="relative h-11 w-11 object-contain drop-shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-md" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-[1.15rem] font-bold tracking-tight text-gray-900">
                  Mara<span className="text-green-700">pedia</span>
                </span>
                <span className="text-[9px] text-gray-400 tracking-[0.2em] uppercase font-medium mt-0.5">Since 2026</span>
              </div>
            </Link>

            {/* Search — desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-auto">
              <div className={`relative w-full transition-all duration-200 ${searchFocused ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute inset-0 rounded-xl transition-all duration-200 pointer-events-none
                  ${searchFocused
                    ? 'shadow-[0_0_0_3px_rgba(21,128,61,0.12)] border border-green-500'
                    : 'border border-gray-200'
                  } bg-gray-50 rounded-xl`} />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input ref={searchRef} type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search the encyclopedia..."
                  className="nav-search-input relative z-10 w-full pl-10 pr-20 py-2 text-sm bg-transparent rounded-xl focus:outline-none text-gray-800" />
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
                    href={pathname.startsWith('/category/')
                      ? `/articles/create?category=${pathname.split('/category/')[1]}`
                      : '/articles/create'}
                    className="hidden md:flex items-center gap-1.5 text-sm px-3.5 py-2
                      bg-green-700 text-white rounded-lg hover:bg-green-800
                      active:scale-95 transition-all duration-150 font-medium shadow-sm shadow-green-900/20"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Contribute
                  </Link>

                  {user && <NotificationBell userId={user.id} />}

                  {/* Avatar — opens drawer */}
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 pl-1 pr-2.5 py-1.5 rounded-xl
                      hover:bg-gray-50 active:bg-gray-100 transition-all duration-150
                      border border-transparent hover:border-gray-200"
                  >
                    <div className="ring-2 ring-green-500 ring-offset-1 rounded-full">
                      <UserAvatar size={8} />
                    </div>
                    <div className="hidden md:flex flex-col items-start leading-none">
                      <span className="text-[13px] font-semibold text-gray-800">{profile?.username}</span>
                      <RoleBadge />
                    </div>
                    <svg className="hidden md:block w-3 h-3 text-gray-400 ml-0.5"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
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
            </div>
          </div>

          {/* ── Category tabs desktop ── */}
          <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-t border-gray-200 py-2.5 -mx-4 px-4"
            aria-label="Category navigation">
            {CATEGORIES.map((cat, i) => {
              const active = isCatActive(cat)
              return (
                <Link key={cat.value} href={catHref(cat)}
                  className={`flex items-center gap-1.5 text-[12.5px] px-3.5 py-1.5 whitespace-nowrap
                    rounded-full border-2 font-semibold shrink-0 transition-all duration-150 active:scale-95
                    ${active
                      ? 'border-green-800 bg-gradient-to-b from-green-700 to-green-800 text-white shadow-md shadow-green-900/30 -translate-y-px'
                      : 'border-gray-400 bg-white text-slate-700 hover:border-green-600 hover:text-green-800 hover:bg-green-50 hover:shadow-sm active:bg-green-100'
                    }`}>
                  <span className="text-sm leading-none">{cat.icon}</span>
                  <span>{cat.label}</span>
                  <CountBadge cat={cat} active={active} size="md" />
                  {i === 0 && (
                    <span className={`ml-0.5 text-[9px] border rounded px-1 py-0.5 leading-none select-none font-mono font-normal
                      ${active ? 'border-green-500/60 text-green-200' : 'border-gray-400 text-gray-500'}`}>
                      Tab
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* ── Category tabs mobile ── */}
          <nav className="md:hidden flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-t border-gray-200 py-2 -mx-4 px-4"
            aria-label="Category navigation mobile">
            {CATEGORIES.map(cat => {
              const active = isCatActive(cat)
              return (
                <Link key={cat.value} href={catHref(cat)}
                  className={`flex items-center gap-1 text-[11.5px] px-3 py-1.5 whitespace-nowrap
                    rounded-full border-2 font-semibold shrink-0 transition-all duration-150 active:scale-95
                    ${active
                      ? 'border-green-800 bg-gradient-to-b from-green-700 to-green-800 text-white shadow-md shadow-green-900/30 -translate-y-px'
                      : 'border-gray-400 bg-white text-slate-700 hover:border-green-600 hover:text-green-800 hover:bg-green-50 active:bg-green-100'
                    }`}>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <CountBadge cat={cat} active={active} size="sm" />
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
    </>
  )
}

// ─── Drawer menu item ─────────────────────────────────────────────────────────

function DrawerItem({
  icon, label, subtitle, href, onClick, accent,
}: {
  icon: string
  label: string
  subtitle: string
  href: string
  onClick: () => void
  accent?: 'green' | 'sky' | 'violet'
}) {
  const accentStyles = {
    green:  { bg: 'bg-green-50',  border: 'border-green-100',  icon: 'bg-green-100',  text: 'text-green-800',  sub: 'text-green-600'  },
    sky:    { bg: 'bg-sky-50',    border: 'border-sky-100',    icon: 'bg-sky-100',    text: 'text-sky-800',    sub: 'text-sky-500'    },
    violet: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'bg-violet-100', text: 'text-violet-800', sub: 'text-violet-500' },
  }
  const s = accent ? accentStyles[accent] : null

  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 mx-3 my-0.5 px-3 py-2.5 rounded-xl
        transition-all duration-150 active:scale-[0.98] group
        ${s ? `${s.bg} border ${s.border}` : 'hover:bg-gray-100'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base
        shadow-sm transition-colors
        ${s ? s.icon : 'bg-white border border-gray-200 group-hover:bg-gray-50'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] font-semibold leading-none mb-0.5
          ${s ? s.text : 'text-gray-800'}`}>
          {label}
        </p>
        <p className={`text-[11px] ${s ? s.sub : 'text-gray-400'}`}>
          {subtitle}
        </p>
      </div>
      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${s ? s.sub : 'text-gray-300 group-hover:text-gray-400'} transition-colors`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}