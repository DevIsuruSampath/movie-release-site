/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
}

module.exports = nextConfig
