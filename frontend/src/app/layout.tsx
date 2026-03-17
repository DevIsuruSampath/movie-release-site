import type { Metadata } from 'next'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0a0a0a] text-white`}>
        {children}
      </body>
    </html>
  )
}
