'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/utils'
import type { Profile } from '@/types'
import NotificationBell from '@/components/NotificationBell'

// ─── OPTION SWITCH ────────────────────────────────────────────────────────────
// true  → keep horizontal tab row on desktop, drawer on mobile
// false → remove horizontal tab row entirely (drawer only everywhere)
const KEEP_TABS_ON_DESKTOP = true
// ─────────────────────────────────────────────────────────────────────────────

// Each category gets a distinct soft color accent, cycling by index
const CAT_PALETTE = [
  { light: '#EAF3DE', mid: '#639922', dark: '#27500A', bar: '#97C459' }, // green
  { light: '#E6F1FB', mid: '#378ADD', dark: '#0C447C', bar: '#85B7EB' }, // blue
  { light: '#EEEDFE', mid: '#7F77DD', dark: '#3C3489', bar: '#AFA9EC' }, // purple
  { light: '#FAEEDA', mid: '#BA7517', dark: '#412402', bar: '#EF9F27' }, // amber
  { light: '#FAECE7', mid: '#D85A30', dark: '#4A1B0C', bar: '#F0997B' }, // coral
  { light: '#E1F5EE', mid: '#1D9E75', dark: '#04342C', bar: '#5DCAA5' }, // teal
  { light: '#FBEAF0', mid: '#D4537E', dark: '#4B1528', bar: '#ED93B1' }, // pink
  { light: '#F1EFE8', mid: '#5F5E5A', dark: '#2C2C2A', bar: '#888780' }, // gray
]

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()

  const [user,    setUser]    = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [profileDrawerOpen,    setProfileDrawerOpen]    = useState(false)
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false)
  const [mobileSearchOpen,     setMobileSearchOpen]     = useState(false)

  const [searchQuery,    setSearchQuery]    = useState('')
  const [searchFocused,  setSearchFocused]  = useState(false)
  const [shortcutLabel,  setShortcutLabel]  = useState('Ctrl K')
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)

  const searchRef       = useRef<HTMLInputElement>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)

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
        setProfileDrawerOpen(false)
        setCategoriesDrawerOpen(false)
        setMobileSearchOpen(false)
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 50)
    } else {
      setSearchQuery('')
    }
  }, [mobileSearchOpen])

  useEffect(() => {
    document.body.style.overflow = (profileDrawerOpen || categoriesDrawerOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [profileDrawerOpen, categoriesDrawerOpen])

  async function fetchProfile(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfileDrawerOpen(false)
    router.push('/')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMobileSearchOpen(false)
    }
  }

  async function handleShare() {
    const shareData = {
      title: 'Marapedia',
      text: 'Explore the cultural encyclopedia of the Mara people — history, language, songs, and traditions.',
      url: 'https://marapedia.org',
    }
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData) } catch {}
    } else {
      await navigator.clipboard.writeText('https://marapedia.org')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  const isEditor   = profile?.role === 'editor' || profile?.role === 'admin'
  const isAdmin    = profile?.role === 'admin'

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

  const enrichedCategories = useMemo(() =>
    CATEGORIES.map((cat, i) => {
      const isAll = (cat as any).href === '/'
      const count = isAll ? totalCount : (categoryCounts[cat.value] ?? 0)
      return { cat, color: CAT_PALETTE[i % CAT_PALETTE.length], count }
    }),
    [categoryCounts, totalCount]
  )

  const maxCount = Math.max(...enrichedCategories.map(e => e.count), 1)

  // ── sub-components ─────────────────────────────────────────────────────────

  function CountBadge({ cat, active, size = 'md' }: {
    cat: typeof CATEGORIES[number]; active: boolean; size?: 'sm' | 'md'
  }) {
    const isAll = (cat as any).href === '/'
    const raw   = isAll ? totalCount : (categoryCounts[cat.value] ?? null)
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

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .nav-search-input::placeholder { color: #9ca3af; }
        .nav-search-input:focus::placeholder { color: #d1d5db; }

        .profile-drawer-slide {
          animation: profileDrawerIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes profileDrawerIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }

        .cat-drawer-slide {
          animation: catDrawerIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes catDrawerIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }

        .drawer-overlay {
          animation: fadeIn 0.2s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .cat-row {
          animation: catRowIn 0.22s ease both;
        }
        @keyframes catRowIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .cat-count-bar {
          transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
        }

        .mobile-search-bar {
          animation: mobileSearchIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes mobileSearchIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Middle line grows on hover */
        .hamburger-mid {
          transition: width 0.2s ease;
        }
        .hamburger-btn:hover .hamburger-mid {
          width: 18px !important;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          CATEGORIES DRAWER
      ══════════════════════════════════════════════════════════════════════ */}
      {categoriesDrawerOpen && (
        <>
          <div className="drawer-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setCategoriesDrawerOpen(false)} />

          <div className="cat-drawer-slide fixed top-0 left-0 h-full z-50 w-[290px] sm:w-[310px]
            flex flex-col overflow-hidden shadow-2xl"
            style={{ background: '#F7F6F2' }}>

            {/* ── Header ── */}
            <div className="relative shrink-0 overflow-hidden px-5 pt-7 pb-5"
              style={{ background: 'linear-gradient(145deg, #0f3d20 0%, #166534 55%, #16803d 100%)' }}>

              {/* Decorative circles */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="270" cy="-10" r="110" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none" />
                <circle cx="270" cy="-10" r="160" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
                <circle cx="-30" cy="120"  r="90"  fill="rgba(255,255,255,0.03)" />
                <circle cx="280" cy="115" r="50"  fill="rgba(255,255,255,0.03)" />
              </svg>

              {/* Close */}
              <button onClick={() => setCategoriesDrawerOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                  flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Brand */}
              <div className="relative z-10 flex items-center gap-2 mb-3">
                <img src="/MARAPEDIA.png" alt="Marapedia" className="w-7 h-7 object-contain opacity-90" />
                <span className="text-white/55 text-[10px] font-bold tracking-[0.22em] uppercase">Marapedia</span>
              </div>

              <h2 className="relative z-10 text-white font-black text-[23px] tracking-tight leading-none">
                Browse
              </h2>

              {/* Stat pills */}
              <div className="relative z-10 flex items-center gap-2 mt-2.5">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.80)' }}>
                  {totalCount.toLocaleString()} articles
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.80)' }}>
                  {CATEGORIES.length} categories
                </span>
              </div>
            </div>

            {/* ── Category rows ── */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {enrichedCategories.map(({ cat, color, count }, i) => {
                const active = isCatActive(cat)
                const barPct = maxCount > 0 ? Math.max(5, Math.round((count / maxCount) * 100)) : 0

                return (
                  <Link
                    key={cat.value}
                    href={catHref(cat)}
                    onClick={() => setCategoriesDrawerOpen(false)}
                    className="cat-row flex items-center gap-3 px-3 py-[11px] rounded-xl my-0.5
                      transition-all duration-150 active:scale-[0.98] group relative overflow-hidden"
                    style={{
                      animationDelay: `${i * 28}ms`,
                      background: active ? color.mid : 'transparent',
                    }}
                  >
                    {/* Hover wash */}
                    {!active && (
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ background: color.light }} />
                    )}

                    {/* Icon */}
                    <div
                      className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0
                        transition-transform duration-200 group-hover:scale-[1.08]"
                      style={{
                        background: active ? 'rgba(255,255,255,0.18)' : color.light,
                        boxShadow: active ? 'none' : '0 1px 3px rgba(0,0,0,0.07)',
                      }}
                    >
                      {cat.icon}
                    </div>

                    {/* Label + mini bar */}
                    <div className="relative z-10 flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold leading-none truncate"
                        style={{ color: active ? '#fff' : '#111' }}>
                        {cat.label}
                      </p>

                      {/* Relative count bar */}
                      {count > 0 && (
                        <div className="mt-[7px] h-[3px] rounded-full overflow-hidden w-16"
                          style={{ background: active ? 'rgba(255,255,255,0.22)' : '#e5e5e2' }}>
                          <div className="cat-count-bar h-full rounded-full"
                            style={{
                              width: `${barPct}%`,
                              background: active ? 'rgba(255,255,255,0.72)' : color.bar,
                            }} />
                        </div>
                      )}
                    </div>

                    {/* Count number */}
                    {count > 0 && (
                      <span className="relative z-10 text-[14px] font-black tabular-nums shrink-0"
                        style={{ color: active ? 'rgba(255,255,255,0.95)' : color.dark }}>
                        {formatCount(count)}
                      </span>
                    )}

                    {/* Active indicator */}
                    {active && (
                      <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* ── Footer CTA ── */}
            <div className="px-3 py-3 border-t border-gray-200/80 shrink-0"
              style={{ background: '#fff' }}>
              <Link
                href="/articles/create"
                onClick={() => setCategoriesDrawerOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                  bg-green-700 text-white text-[13px] font-semibold
                  hover:bg-green-800 active:scale-[0.98] transition-all duration-150
                  shadow-sm shadow-green-900/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Contribute Article
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PROFILE DRAWER (right side)
      ══════════════════════════════════════════════════════════════════════ */}
      {profileDrawerOpen && (
        <>
          <div className="drawer-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setProfileDrawerOpen(false)} />

          <div className="profile-drawer-slide fixed top-0 right-0 h-full z-50 w-[300px] sm:w-[320px]
            bg-gray-50 shadow-2xl flex flex-col">

            <div className="relative bg-gradient-to-br from-green-900 to-green-600 px-5 pt-10 pb-6 overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="absolute bottom-[-20px] right-8 w-16 h-16 rounded-full bg-white/5" />

              <button onClick={() => setProfileDrawerOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                  flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

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

              <p className="text-white font-black text-lg tracking-tight leading-none">{profile?.username}</p>
              <p className="text-green-200 text-xs mt-1 mb-2 truncate">{user?.email}</p>

              {profile?.role === 'admin' && (
                <span className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-full font-bold
                  bg-violet-500/30 text-violet-200 border border-violet-400/30 tracking-wide">⚙️ Admin</span>
              )}
              {profile?.role === 'editor' && (
                <span className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-full font-bold
                  bg-sky-500/30 text-sky-200 border border-sky-400/30 tracking-wide">✏️ Editor</span>
              )}
              {profile?.role !== 'admin' && profile?.role !== 'editor' && (
                <span className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-full font-bold
                  bg-white/10 text-white/70 border border-white/20 tracking-wide">📖 Member</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              <p className="px-5 pt-2 pb-1 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">Account</p>
              <DrawerItem icon="👤" label="My Profile" subtitle="View & edit your info"
                href="/profile" onClick={() => setProfileDrawerOpen(false)} />
              <DrawerItem icon="📑" label="My Articles" subtitle="Manage your contributions"
                href="/articles/my" onClick={() => setProfileDrawerOpen(false)} />

              {isEditor && (
                <>
                  <p className="px-5 pt-4 pb-1 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">Management</p>
                  <DrawerItem icon="✏️" label="Editor Panel" subtitle="Review & publish content"
                    href="/editor" onClick={() => setProfileDrawerOpen(false)} accent="sky" />
                </>
              )}
              {isAdmin && (
                <DrawerItem icon="⚙️" label="Admin Panel" subtitle="Full site control"
                  href="/admin" onClick={() => setProfileDrawerOpen(false)} accent="violet" />
              )}

              <div className="mx-4 my-3 border-t border-gray-200" />

              <DrawerItem icon="✍️" label="Contribute Article" subtitle="Share your knowledge"
                href={pathname.startsWith('/category/')
                  ? `/articles/create?category=${pathname.split('/category/')[1]}`
                  : '/articles/create'}
                onClick={() => setProfileDrawerOpen(false)} accent="green" />

              <button onClick={handleShare}
                className="flex items-center gap-3 mx-3 my-0.5 px-3 py-2.5 rounded-xl w-[calc(100%-24px)]
                  transition-all duration-150 active:scale-[0.98] group hover:bg-gray-100">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base
                  shadow-sm bg-white border border-gray-200 group-hover:bg-gray-50 transition-colors shrink-0">
                  {copied ? '✅' : '🔗'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13.5px] font-semibold leading-none mb-0.5 text-gray-800">
                    {copied ? 'Link Copied!' : 'Share Marapedia'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {copied ? 'marapedia.org copied to clipboard' : 'Spread the word about Marapedia'}
                  </p>
                </div>
                {!copied && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-300 group-hover:text-gray-400"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              <div className="mx-4 my-3 border-t border-gray-200" />

              <p className="px-5 pt-1 pb-1 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">Marapedia</p>
              <DrawerItem icon="📖" label="About" subtitle="Our mission & story"
                href="/about" onClick={() => setProfileDrawerOpen(false)} />
              <DrawerItem icon="🔒" label="Privacy Policy" subtitle="How we handle your data"
                href="/privacy" onClick={() => setProfileDrawerOpen(false)} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  bg-red-50 border border-red-100 text-red-600
                  hover:bg-red-100 active:scale-[0.98] transition-all duration-150 group">
                <span className="w-8 h-8 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                <div className="flex-1 text-left"><p className="text-sm font-semibold">Sign out</p></div>
                <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="flex items-center h-[60px] gap-3">

            {/* ── Hamburger ── */}
            <button
              onClick={() => setCategoriesDrawerOpen(true)}
              aria-label="Browse categories"
              className="hamburger-btn flex flex-col items-center justify-center gap-[5px] w-9 h-9 rounded-xl
                hover:bg-gray-100 active:bg-gray-200 active:scale-95 transition-all duration-150 shrink-0
                border border-transparent hover:border-gray-200"
            >
              <span className="block w-[18px] h-[1.5px] bg-gray-600 rounded-full" />
              <span className="hamburger-mid block w-[13px] h-[1.5px] bg-gray-600 rounded-full self-start ml-[3px]" />
              <span className="block w-[18px] h-[1.5px] bg-gray-600 rounded-full" />
            </button>

            {/* Logo */}
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

            {/* Search — desktop only */}
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

              {/* Mobile search icon */}
              <button
                onClick={() => setMobileSearchOpen(v => !v)}
                aria-label="Search"
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl
                  hover:bg-gray-100 active:bg-gray-200 active:scale-95 transition-all duration-150
                  border border-transparent hover:border-gray-200"
              >
                {mobileSearchOpen ? (
                  <svg className="w-[18px] h-[18px] text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-[18px] h-[18px] text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>

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

                  <button onClick={() => setProfileDrawerOpen(true)}
                    className="flex items-center gap-2 pl-1 pr-2.5 py-1.5 rounded-xl
                      hover:bg-gray-50 active:bg-gray-100 transition-all duration-150
                      border border-transparent hover:border-gray-200">
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

          {/* Mobile search bar — expands below the header row */}
          {mobileSearchOpen && (
            <div className="mobile-search-bar md:hidden border-t border-gray-100 py-2.5">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={mobileSearchRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search the encyclopedia..."
                    className="w-full pl-10 pr-16 py-2.5 text-sm bg-gray-50 border border-gray-200
                      rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20
                      focus:border-green-400 text-gray-800 transition-all duration-150"
                  />
                  {searchQuery && (
                    <button type="submit"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium
                        px-2.5 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors">
                      Go
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Desktop tabs — controlled by KEEP_TABS_ON_DESKTOP */}
          {KEEP_TABS_ON_DESKTOP && (
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
          )}

        </div>
      </header>
    </>
  )
}

// ─── Profile drawer item ──────────────────────────────────────────────────────

function DrawerItem({
  icon, label, subtitle, href, onClick, accent,
}: {
  icon: string; label: string; subtitle: string; href: string; onClick: () => void; accent?: 'green' | 'sky' | 'violet'
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
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shadow-sm transition-colors
        ${s ? s.icon : 'bg-white border border-gray-200 group-hover:bg-gray-50'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] font-semibold leading-none mb-0.5 ${s ? s.text : 'text-gray-800'}`}>{label}</p>
        <p className={`text-[11px] ${s ? s.sub : 'text-gray-400'}`}>{subtitle}</p>
      </div>
      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${s ? s.sub : 'text-gray-300 group-hover:text-gray-400'} transition-colors`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}