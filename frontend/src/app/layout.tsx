import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'MovieHub - Latest Movie Releases',
  description: 'Browse and stream the latest movies in stunning quality. Your ultimate destination for premium entertainment.',
  keywords: 'movies, streaming, downloads, latest releases, 4k, hd',
  openGraph: {
    title: 'MovieHub - Latest Movie Releases',
    description: 'Browse and stream the latest movies in stunning quality.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0a0a0a] text-white overflow-x-hidden antialiased`}>
        {children}
      </body>
    </html>
  )
}
