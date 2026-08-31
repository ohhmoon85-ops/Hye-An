import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // 본문은 서버에서만 판정하므로 캐시 오염을 막는다.
        source: '/doc/:slug',
        headers: [{ key: 'Vary', value: 'Cookie' }],
      },
    ]
  },
}

export default nextConfig
