import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/config'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: '%s · Marapedia',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Mara people', 'Mara tribe', 'Maraland', 'Mara culture', 'Mara history',
    'Mara language', 'Chin State Myanmar', 'Mizoram', 'Mara songs', 'Mara traditions',
    'Mara encyclopedia', 'Mara wiki', 'indigenous encyclopedia',
  ],
  authors: [{ name: 'Marapedia Community' }],
  creator: 'Marapedia',
  publisher: 'Marapedia',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/MARAPEDIA.png',
    apple: '/MARAPEDIA.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}