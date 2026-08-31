import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // 요약은 색인을 허용해야 유입이 생긴다. 본문은 애초에 전송되지 않으므로
        // 색인될 수 없다 — 차단할 대상이 아니다.
        allow: '/',
        disallow: ['/admin', '/account', '/api/', '/login'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
