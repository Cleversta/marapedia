import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Marapedia — The Free Mara Encyclopedia',
  description: 'A community-built encyclopedia preserving the history, culture, language, songs, and traditions of the Mara people.',
  keywords: 'Mara, Maraland, Mara people, Mara history, Mara culture, Mara language, Chin State, Mizoram',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
