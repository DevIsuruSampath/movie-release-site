/** @type {import('next').NextConfig} */
const backendUrl =
  process.env.API_URL ||
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://backend:8000'

const nextConfig = {
  reactStrictMode: true,

  // Set Turbopack root to avoid conflicts with workspace
  turbopack: {
    root: __dirname,
  },

  // Enable standalone output for Docker
  output: 'standalone',

  // Set base URL for Docker deployment
  basePath: '',
  assetPrefix: process.env.NEXT_PUBLIC_URL || undefined,

  // Use Webpack compiler for better Docker build stability
  compiler: {
    // Remove console during production
    removeConsole: {
      exclude: ['webpackCache', 'Next.js', 'react-dom'],
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
