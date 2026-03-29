import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  metadataBase: new URL('https://marapedia.org'), // 👈 change to your real domain
  title: {
    default: 'Marapedia — The Free Mara Encyclopedia',
    template: '%s | Marapedia',
  },
  description: 'A community-built encyclopedia preserving the history, culture, language, songs, and traditions of the Mara people — from Maraland to the world.',
  keywords: ['Mara', 'Maraland', 'Mara people', 'Mara history', 'Mara culture', 'Mara language', 'Chin State', 'Mizoram', 'Mara encyclopedia', 'Mara songs', 'Mara traditions'],
  authors: [{ name: 'Marapedia Community' }],
  creator: 'Marapedia',
  publisher: 'Marapedia',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://marapedia.org',
    siteName: 'Marapedia',
    title: 'Marapedia — The Free Mara Encyclopedia',
    description: 'A community-built encyclopedia preserving the history, culture, language, songs, and traditions of the Mara people.',
    images: [
      {
        url: '/og-image.png', // 👈 create a 1200x630 image and put in /public
        width: 1200,
        height: 630,
        alt: 'Marapedia — The Free Mara Encyclopedia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marapedia — The Free Mara Encyclopedia',
    description: 'A community-built encyclopedia preserving the history, culture, and traditions of the Mara people.',
    images: ['/og-image.png'],
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
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}