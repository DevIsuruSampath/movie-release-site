/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
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
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
