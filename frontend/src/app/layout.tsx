import type { Metadata, Viewport } from 'next'
import './globals.css'

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
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://m.media-amazon.com" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
      </head>
      <body className="bg-[#0a0a0a] text-white overflow-x-hidden antialiased">
        <a
          id="skip-to-content"
          href="#main-content"
          className="sr-only focus:fixed focus:z-[100] focus:bg-[#e50914] focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none focus:ring-2 focus:ring-[#e50914] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"

         >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
