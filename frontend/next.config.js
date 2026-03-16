/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Use Webpack compiler for better Docker build stability
  compiler: {
    // Remove console during production
    removeConsole: {
      exclude: ['webpackCache', 'Next.js', 'react-dom'],
    },
  },
  
  images: {
    domains: [
      'localhost',
      's3.amazonaws.com',
      'cloudfront.net',
    ],
    remotePatterns: [
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
