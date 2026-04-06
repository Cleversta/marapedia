import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabaseServer as supabase } from '@/lib/supabase-server'
import { timeAgo, getPreferredTranslation } from '@/lib/utils'
import ArticleCard from '@/components/ArticleCard'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/config'
import type { Article } from '@/types'

export const revalidate = 600

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOLIDAY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

type HolidayTheme =
  | 'christmas' | 'newYear' | 'epiphany' | 'allSaints' | 'advent' | 'lorrainDay'
  | 'ashWednesday' | 'palmSunday' | 'goodFriday' | 'easter' | 'ascension' | 'pentecost'
  | 'default'

/** Anonymous Gregorian algorithm — computes Easter Sunday for any year. */
function computeEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function getHolidayTheme(): HolidayTheme {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const mo    = now.getMonth() + 1 // 1-based
  const dy    = now.getDate()

  // Fixed dates
  if (mo === 9  && dy === 26)             return 'lorrainDay'
  if (mo === 11 && dy === 1)              return 'allSaints'
  if (mo === 12 && dy >= 1 && dy <= 19)  return 'advent'
  if (mo === 12 && dy >= 20)             return 'christmas'
  if (mo === 1  && dy <= 5)              return 'newYear'
  if (mo === 1  && dy === 6)             return 'epiphany'

  // Easter-based moving dates
  const easter     = computeEaster(now.getFullYear())
  const easterTime = easter.getTime()
  const todayTime  = today.getTime()
  const DAY        = 86400000
  const ashWed     = new Date(easterTime - 46 * DAY)
  const diff       = Math.round((todayTime - easterTime) / DAY)

  if (today.getTime() === ashWed.getTime()) return 'ashWednesday'
  if (diff === -7)                          return 'palmSunday'
  if (diff === -2)                          return 'goodFriday'
  if (diff === 0 || diff === 1)             return 'easter'
  if (diff === 39)                          return 'ascension'
  if (diff === 49 || diff === 50)           return 'pentecost'

  return 'default'
}

interface HolidayConfig {
  heroBg: string       // Tailwind bg class or inline style
  heroBorder: string   // border color (hex)
  heroBgStyle: string  // inline CSS background color
  label: string
  isDark: boolean
}

function getHolidayConfig(theme: HolidayTheme): HolidayConfig {
  const configs: Record<HolidayTheme, HolidayConfig> = {
    christmas: {
      heroBgStyle: '#1A3A2A', heroBg: '', heroBorder: '#2D6645',
      label: '🎄 MERRY CHRISTMAS · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    newYear: {
      heroBgStyle: '#0D0D2B', heroBg: '', heroBorder: '#2A2A60',
      label: '🎆 HAPPY NEW YEAR · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    epiphany: {
      heroBgStyle: '#1C0A38', heroBg: '', heroBorder: '#3A1A60',
      label: '✨ FEAST OF EPIPHANY · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    ashWednesday: {
      heroBgStyle: '#1A1A1A', heroBg: '', heroBorder: '#333333',
      label: '✝ ASH WEDNESDAY · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    palmSunday: {
      heroBgStyle: '#1A2E0A', heroBg: '', heroBorder: '#2D5010',
      label: '🌿 PALM SUNDAY · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    goodFriday: {
      heroBgStyle: '#200808', heroBg: '', heroBorder: '#4A1010',
      label: '✝ GOOD FRIDAY · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    easter: {
      heroBgStyle: '#2A1800', heroBg: '', heroBorder: '#5A3800',
      label: '✝ HAPPY EASTER · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    ascension: {
      heroBgStyle: '#061828', heroBg: '', heroBorder: '#0C3050',
      label: '☁ ASCENSION DAY · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    pentecost: {
      heroBgStyle: '#2A0808', heroBg: '', heroBorder: '#601010',
      label: '🔥 PENTECOST SUNDAY · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    allSaints: {
      heroBgStyle: '#180820', heroBg: '', heroBorder: '#3A1050',
      label: '✦ ALL SAINTS DAY · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    advent: {
      heroBgStyle: '#16101E', heroBg: '', heroBorder: '#2E1E44',
      label: '🕯 ADVENT SEASON · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    lorrainDay: {
      heroBgStyle: '#0F2218', heroBg: '', heroBorder: '#1E4430',
      label: '📖 R.A. LORRAIN DAY · THE FREE MARA ENCYCLOPEDIA', isDark: true,
    },
    default: {
      heroBgStyle: '#EDE5D4', heroBg: '', heroBorder: '#DDD4C0',
      label: 'THE FREE MARA ENCYCLOPEDIA', isDark: false,
    },
  }
  return configs[theme]
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOLIDAY SVG DECORATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function HolidayDecoration({ theme }: { theme: HolidayTheme }) {
  switch (theme) {
    case 'christmas':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Snowflakes */}
          {([
            [10,8,4],[28,20,3],[52,6,5],[74,18,3.5],[91,4,4],[18,45,2.5],
            [63,40,3],[84,50,4.5],[38,65,2],[4,70,3.5],[94,76,2.5],[50,86,4],
          ] as [number,number,number][]).map(([rx,ry,r], i) => (
            <g key={i} transform={`translate(${rx}%,${ry}%)`}>
              <circle r={r*0.5} fill="rgba(255,255,255,0.18)" />
              {[0,1,2,3,4,5].map(j => {
                const a = j * Math.PI / 3
                return <line key={j} x2={r*2.2*Math.cos(a)} y2={r*2.2*Math.sin(a)} stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
              })}
            </g>
          ))}
          {/* Pine silhouette */}
          <polygon points="88%,44% 78%,100% 98%,100%" fill="rgba(255,255,255,0.05)" />
          {/* Star */}
          <circle cx="88%" cy="41%" r="4" fill="rgba(255,215,0,0.28)" />
        </svg>
      )

    case 'newYear':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {([
            [10,15,3,true],[25,8,2,false],[45,12,4,true],[70,5,2.5,false],
            [88,18,3,true],[5,40,2,false],[35,35,3.5,true],[60,30,2,false],
            [80,42,4,true],[15,65,3,false],[50,60,2.5,true],[90,55,3.5,false],
            [30,82,2,true],[72,78,3,false],[92,88,2.5,true],
          ] as [number,number,number,boolean][]).map(([rx,ry,r,isGold], i) => (
            <circle key={i} cx={`${rx}%`} cy={`${ry}%`} r={r}
              fill={isGold ? 'rgba(255,215,0,0.20)' : 'rgba(255,255,255,0.14)'} />
          ))}
          {([
            [20,28,9],[60,14,7],[85,68,10],[40,84,7],[8,55,8],
          ] as [number,number,number][]).map(([rx,ry,r], i) => {
            const d = r * 0.5
            return (
              <g key={i} stroke="rgba(255,215,0,0.18)" strokeWidth="0.8">
                <line x1={`${rx}%`} y1={`calc(${ry}% - ${r}px)`} x2={`${rx}%`} y2={`calc(${ry}% + ${r}px)`} />
                <line x1={`calc(${rx}% - ${r}px)`} y1={`${ry}%`} x2={`calc(${rx}% + ${r}px)`} y2={`${ry}%`} />
              </g>
            )
          })}
        </svg>
      )

    case 'easter':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Sunrise rays from top center */}
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI
            const ex = 50 + 70 * Math.cos(a)
            const ey = -5 + 70 * Math.sin(a)
            return <line key={i} x1="50%" y1="-5%" x2={`${ex}%`} y2={`${ey}%`}
              stroke="rgba(255,215,0,0.10)" strokeWidth="1.2" />
          })}
          <circle cx="50%" cy="-5%" r="10" fill="rgba(255,215,0,0.12)" />
          {([
            [10,30,3],[25,18,2.5],[45,22,4],[70,15,3],
            [88,28,2.5],[15,55,2],[60,50,3.5],[85,65,2],[35,72,2.5],[55,82,3],
          ] as [number,number,number][]).map(([rx,ry,r], i) => (
            <circle key={i} cx={`${rx}%`} cy={`${ry}%`} r={r} fill="rgba(255,215,0,0.18)" />
          ))}
        </svg>
      )

    case 'advent':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* 4 candles */}
          {([
            [20,70],[38,68],[56,70],[74,68],
          ] as [number,number][]).map(([rx,ry], i) => (
            <g key={i}>
              <rect x={`calc(${rx}% - 5px)`} y={`calc(${ry}% - 15px)`} width="10" height="30"
                rx="2" fill="rgba(155,89,182,0.12)" />
              {/* flame */}
              <ellipse cx={`${rx}%`} cy={`calc(${ry}% - 22px)`} rx="3" ry="5"
                fill="rgba(255,215,0,0.18)" />
              <circle cx={`${rx}%`} cy={`calc(${ry}% - 22px)`} r="5"
                fill="rgba(255,215,0,0.10)" />
            </g>
          ))}
          {([
            [8,12,2.5],[30,8,2],[55,10,3],[80,6,2.5],[95,20,2],
            [10,40,2],[65,35,2.5],[90,55,2],[25,85,2],[85,85,2.5],
          ] as [number,number,number][]).map(([rx,ry,r], i) => (
            <circle key={i} cx={`${rx}%`} cy={`${ry}%`} r={r} fill="rgba(255,255,255,0.10)" />
          ))}
        </svg>
      )

    case 'pentecost':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {([
            [20,50,40],[40,45,50],[60,48,44],[80,52,38],[5,60,30],[92,55,32],
          ] as [number,number,number][]).map(([rx,ry,h], i) => (
            <ellipse key={i} cx={`${rx}%`} cy={`${ry}%`} rx={h*0.3} ry={h}
              fill="rgba(255,69,0,0.12)" />
          ))}
          {([
            [15,25,3],[35,18,2.5],[55,22,3.5],[72,15,2.5],
            [88,30,2],[28,55,2],[65,60,2.5],[48,72,2],[82,75,2],
          ] as [number,number,number][]).map(([rx,ry,r], i) => (
            <circle key={i} cx={`${rx}%`} cy={`${ry}%`} r={r} fill="rgba(255,215,0,0.16)" />
          ))}
        </svg>
      )

    case 'goodFriday':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <line x1="50%" y1="10%" x2="50%" y2="85%" stroke="rgba(255,255,255,0.04)" strokeWidth="18" strokeLinecap="round" />
          <line x1="25%" y1="45%" x2="75%" y2="45%" stroke="rgba(255,255,255,0.04)" strokeWidth="18" strokeLinecap="round" />
        </svg>
      )

    case 'allSaints':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {([
            [20,20,16],[70,15,14],[85,55,12],[15,65,13],[50,80,15],
          ] as [number,number,number][]).map(([rx,ry,r], i) => (
            <g key={i}>
              <circle cx={`${rx}%`} cy={`${ry}%`} r={r}
                stroke="rgba(255,215,0,0.10)" strokeWidth="1" fill="none" />
              <circle cx={`${rx}%`} cy={`${ry}%`} r={r*0.4} fill="rgba(255,255,255,0.10)" />
            </g>
          ))}
        </svg>
      )

    case 'lorrainDay':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Open book bottom right */}
          <rect x="calc(80% - 32px)" y="calc(78% - 20px)" width="30" height="28" rx="2" fill="rgba(255,255,255,0.06)" />
          <rect x="calc(80% + 2px)"  y="calc(78% - 20px)" width="30" height="28" rx="2" fill="rgba(255,255,255,0.06)" />
          <line x1="80%" y1="calc(78% - 20px)" x2="80%" y2="calc(78% + 8px)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          {/* Missionary cross top left */}
          <line x1="15%" y1="8%"  x2="15%" y2="30%" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />
          <line x1="8%"  y1="16%" x2="22%" y2="16%" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />
          {/* Heritage dots */}
          {([
            [40,10,2.5],[60,8,3],[85,15,2],[5,40,2.5],[50,45,2],
            [92,45,2.5],[30,60,2],[70,58,2.5],[10,80,2],[55,85,3],[88,90,2],
          ] as [number,number,number][]).map(([rx,ry,r], i) => (
            <circle key={i} cx={`${rx}%`} cy={`${ry}%`} r={r} fill="rgba(255,215,0,0.14)" />
          ))}
        </svg>
      )

    case 'ashWednesday':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {([
            [20,35,10],[75,30,8],[50,60,9],[15,75,7],[85,65,8],
          ] as [number,number,number][]).map(([rx,ry,r], i) => (
            <g key={i} stroke="rgba(255,255,255,0.07)" strokeWidth="0.8">
              <line x1={`${rx}%`} y1={`calc(${ry}% - ${r}px)`} x2={`${rx}%`} y2={`calc(${ry}% + ${r}px)`} />
              <line x1={`calc(${rx}% - ${r*0.65}px)`} y1={`calc(${ry}% - ${r*0.2}px)`}
                    x2={`calc(${rx}% + ${r*0.65}px)`} y2={`calc(${ry}% - ${r*0.2}px)`} />
            </g>
          ))}
        </svg>
      )

    case 'palmSunday':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {([
            [20,15],[50,8],[70,20],[30,40],[65,50],[15,60],
          ] as [number,number][]).map(([rx,ry], i) => (
            <ellipse key={i} cx={`${rx}%`} cy={`${ry}%`} rx="8" ry="4" fill="rgba(255,255,255,0.08)" />
          ))}
        </svg>
      )

    case 'ascension':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Clouds */}
          {([
            [25,15],[72,10],[50,5],
          ] as [number,number][]).map(([rx,ry], i) => (
            <g key={i} fill="rgba(255,255,255,0.05)">
              <circle cx={`${rx}%`} cy={`${ry}%`} r="14" />
              <circle cx={`calc(${rx}% - 12px)`} cy={`calc(${ry}% + 4px)`} r="10" />
              <circle cx={`calc(${rx}% + 12px)`} cy={`calc(${ry}% + 4px)`} r="10" />
            </g>
          ))}
          {([
            [10,28,2.5],[40,18,3],[65,25,2],[88,35,2.5],
          ] as [number,number,number][]).map(([rx,ry,r], i) => (
            <circle key={i} cx={`${rx}%`} cy={`${ry}%`} r={r} fill="rgba(135,206,235,0.15)" />
          ))}
        </svg>
      )

    case 'epiphany':
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Central star rays */}
          {Array.from({length: 8}, (_, i) => {
            const a = i * Math.PI / 4
            return <line key={i} x1="50%" y1="8%"
              x2={`calc(50% + ${18*Math.cos(a)}px)`}
              y2={`calc(8% + ${18*Math.sin(a)}px)`}
              stroke="rgba(255,215,0,0.28)" strokeWidth="1.2" />
          })}
          <circle cx="50%" cy="8%" r="5" fill="rgba(255,215,0,0.22)" />
          {([
            [8,12,6],[88,10,5],[20,30,4],[75,25,5],
            [5,55,4],[92,50,4],[30,70,3],[70,75,3.5],[50,85,4],
          ] as [number,number,number][]).map(([rx,ry,r], i) => (
            <g key={i}>
              {[0,1,2,3].map(j => {
                const a = j * Math.PI / 2
                return <line key={j}
                  x1={`${rx}%`} y1={`${ry}%`}
                  x2={`calc(${rx}% + ${r*Math.cos(a)}px)`}
                  y2={`calc(${ry}% + ${r*Math.sin(a)}px)`}
                  stroke="rgba(255,215,0,0.15)" strokeWidth="0.8" />
              })}
              <circle cx={`${rx}%`} cy={`${ry}%`} r={r*0.35} fill="rgba(255,215,0,0.22)" />
            </g>
          ))}
        </svg>
      )

    default:
      // Default diagonal pattern
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diag" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="26" stroke="rgba(140,126,106,0.06)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag)" />
          {[1,2,3,4].map(r => (
            <circle key={r} cx="100%" cy="0%" r={r*30} stroke="rgba(140,126,106,0.07)" strokeWidth="1" fill="none" />
          ))}
        </svg>
      )
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════════

const ARTICLE_FIELDS = `
  id, slug, category, status, featured, thumbnail_url, view_count, created_at, updated_at,
  profiles(id, username, avatar_url, role, created_at),
  article_translations(id, article_id, language, title, excerpt, content)
`

const getFeaturedArticle = unstable_cache(
  async (): Promise<Article | null> => {
    const { data } = await supabase
      .from('articles')
      .select(ARTICLE_FIELDS)
      .eq('status', 'published')
      .eq('featured', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    return data as unknown as Article | null
  },
  ['home-featured'],
  { revalidate: 600, tags: ['article'] }
)

const getRecentArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const { data } = await supabase
      .from('articles')
      .select(ARTICLE_FIELDS)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(6)
    return (data ?? []) as unknown as Article[]
  },
  ['home-recent'],
  { revalidate: 600, tags: ['article'] }
)

const getMostViewedArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const { data } = await supabase
      .from('articles')
      .select(ARTICLE_FIELDS)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(6)
    return (data ?? []) as unknown as Article[]
  },
  ['home-most-viewed'],
  { revalidate: 600, tags: ['article'] }
)

const getStats = unstable_cache(
  async () => {
    const [{ count: articleCount }, { count: userCount }] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ])
    return { articles: articleCount ?? 0, users: userCount ?? 0 }
  },
  ['home-stats'],
  { revalidate: 600, tags: ['article'] }
)

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default async function HomePage() {
  const [featured, recent, mostViewed, stats] = await Promise.all([
    getFeaturedArticle(),
    getRecentArticles(),
    getMostViewedArticles(),
    getStats(),
  ])

  const featuredTranslation = getPreferredTranslation(featured?.article_translations)

  const theme  = getHolidayTheme()
  const cfg    = getHolidayConfig(theme)
  const isDark = cfg.isDark

  // Dynamic color tokens based on dark/light hero
  const titleColor  = isDark ? '#FFFFFF'                    : '#1C1812'
  const subColor    = isDark ? 'rgba(255,255,255,0.70)'     : '#8C7E6A'
  const badgeBorder = isDark ? 'rgba(255,255,255,0.24)'     : '#DDD4C0'
  const badgeBg     = isDark ? 'rgba(255,255,255,0.10)'     : 'rgba(255,255,255,0.50)'
  const badgeText   = isDark ? 'rgba(255,255,255,0.60)'     : '#8C7E6A'
  const pillBorder  = isDark ? 'rgba(255,255,255,0.24)'     : '#DDD4C0'
  const pillBg      = isDark ? 'rgba(255,255,255,0.10)'     : 'rgba(255,255,255,0.70)'
  const pillText    = isDark ? 'rgba(255,255,255,0.70)'     : '#4A4035'
  const statBg      = isDark ? 'rgba(255,255,255,0.08)'     : 'rgba(255,255,255,0.60)'
  const statBorder  = isDark ? 'rgba(255,255,255,0.24)'     : '#DDD4C0'
  const statIcon    = isDark ? 'rgba(255,255,255,0.54)'     : '#5A7A5C'
  const statValue   = isDark ? '#FFFFFF'                    : '#1C1812'
  const statLabel   = isDark ? 'rgba(255,255,255,0.54)'     : '#8C7E6A'
  const ctaBorder   = isDark ? '#5A7A5C'                    : '#5A7A5C'
  const ctaBg       = isDark ? 'rgba(255,255,255,0.10)'     : 'rgba(255,255,255,0.70)'

  const nonFeaturedMostViewed = mostViewed.filter(a => a.id !== featured?.id)

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
            description: SITE_DESCRIPTION,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      {/* ── HERO ── */}
      <div className="px-4 pt-4 pb-0">
        <div
          className="relative rounded-2xl overflow-hidden border"
          style={{
            backgroundColor: cfg.heroBgStyle,
            borderColor: cfg.heroBorder,
            boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
          }}
        >
          {/* Holiday decoration layer */}
          <HolidayDecoration theme={theme} />

          {/* Content */}
          <div className="relative z-10 px-6 py-7 flex flex-col items-center text-center">

            {/* Holiday badge */}
            <div
              className="px-3 py-1 rounded-full text-[9px] font-semibold tracking-[1.6px] mb-3.5"
              style={{ backgroundColor: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeText }}
            >
              {cfg.label}
            </div>

            {/* Title */}
            <h1
              className="font-display text-[26px] font-bold leading-tight mb-2"
              style={{ color: titleColor }}
            >
              Preserving Mara<br />History & Culture
            </h1>

            {/* Subtitle */}
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: subColor }}>
              A community-built encyclopedia for the Mara people.
            </p>

            {/* Language pills */}
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              {['Mara', 'English', 'Myanmar', 'Mizo'].map(lang => (
                <span
                  key={lang}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: pillBg, border: `1px solid ${pillBorder}`, color: pillText }}
                >
                  {lang}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 w-full mb-3.5">
              {([
                { value: stats.articles.toLocaleString(), label: 'Articles',     icon: '📄' },
                { value: stats.users.toLocaleString(),    label: 'Contributors', icon: '👥' },
                { value: '4',                             label: 'Languages',    icon: '🌐' },
              ] as { value: string; label: string; icon: string }[]).map(({ value, label, icon }) => (
                <div
                  key={label}
                  className="rounded-xl py-3 flex flex-col items-center"
                  style={{ backgroundColor: statBg, border: `1px solid ${statBorder}` }}
                >
                  <span className="text-[13px] mb-0.5" style={{ color: statIcon }}>{icon}</span>
                  <span className="font-display text-[19px] font-bold" style={{ color: statValue }}>{value}</span>
                  <span className="text-[10px] font-medium" style={{ color: statLabel }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Contributors CTA */}
            <Link
              href="/contributors"
              className="inline-flex items-center gap-2 text-[13px] font-semibold px-[18px] py-2.5 rounded-full transition-opacity hover:opacity-80"
              style={{ backgroundColor: ctaBg, border: `1px solid ${ctaBorder}`, color: '#5A7A5C' }}
            >
              <span>👥</span>
              Meet our contributors
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Featured */}
        {featured && featuredTranslation && (
          <div className="mb-10">
            <h2 className="font-display text-lg font-semibold mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
              <span className="text-[11px] text-green-700">✦</span> Featured Article
            </h2>
            <Link href={`/articles/${featured.slug}`} className="block group max-w-2xl mx-auto">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-green-300 hover:shadow-sm transition-all">
                {featured.thumbnail_url && (
                  <div className="h-56 overflow-hidden">
                    <img
                      src={featured.thumbnail_url}
                      alt={featuredTranslation.title ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5 text-center">
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Featured</span>
                  <h3 className="font-display text-xl font-bold mt-2 mb-2 group-hover:text-green-800 transition-colors">
                    {featuredTranslation.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                    {featuredTranslation.excerpt ?? (featuredTranslation.content ?? '').replace(/<[^>]*>/g, '').substring(0, 200)}...
                  </p>
                  <div className="mt-3 text-xs text-gray-400 flex justify-center gap-4">
                    <span>By {featured.profiles?.username ?? 'Anonymous'}</span>
                    <span>{timeAgo(featured.updated_at ?? featured.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Recent + Most Viewed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-lg font-semibold mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
              <span className="text-[11px] text-green-700">◈</span> Recent Articles
            </h2>
            {recent.length === 0 ? (
              <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
                <p className="text-gray-400 mb-3">No articles yet. Be the first to contribute!</p>
                <Link
                  href="/articles/create"
                  className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                >
                  Write First Article
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recent.map(article => <ArticleCard key={article.id} article={article} />)}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
              <span className="text-[11px] text-green-700">◉</span> Most Viewed
            </h2>
            {nonFeaturedMostViewed.length === 0 ? (
              <p className="text-sm text-gray-400">No articles yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {nonFeaturedMostViewed.map(article => <ArticleCard key={article.id} article={article} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}