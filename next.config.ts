import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from external domains (business logos, scraped images)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
