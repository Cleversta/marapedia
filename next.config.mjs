// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'marapedia.vercel.app' }],
        destination: 'https://marapedia.org/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.marapedia.org' }],
        destination: 'https://marapedia.org/:path*',
        permanent: true,
      },
      {
        source: '/articles/ahy-lyubie-thaino-chama-1775025455113',
        destination: '/articles/ahy-lyubie-thaino-chama',
        permanent: true,
      },
      {
        source: '/articles/evangelical-church-of-maraland-ecm-1776497060641',
        destination: '/articles/evangelical-church-of-maraland-ecm',
        permanent: true,
      },
      {
        source: '/articles/khazohpa-na-hniapa-1777354523491',
        destination: '/articles/khazohpa-na-hniapa',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'media.marapedia.org' },
    ],
  },
  async headers() {
    return [
      {
        source: '/articles/:slug*',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' }],
      },
      {
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=600, stale-while-revalidate=3600' }],
      },
      {
        source: '/category/:name*',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=1800, stale-while-revalidate=3600' }],
      },
      {
        source: '/photos/:id*',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' }],
      },
      {
        source: '/(search|admin|login|register|profile|editor)/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/articles/(create|edit)/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
