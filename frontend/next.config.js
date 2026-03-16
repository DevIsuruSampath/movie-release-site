/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      // Add your S3/CDN domains here
      's3.amazonaws.com',
      'cloudfront.net',
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
