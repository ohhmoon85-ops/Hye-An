import type { Metadata, Viewport } from 'next'
import { Gowun_Batang, IBM_Plex_Sans_KR, IBM_Plex_Mono } from 'next/font/google'
import { ThemeScript } from '@/components/ThemeToggle'
import { SITE, absoluteUrl } from '@/lib/site'
import './globals.css'

const gowun = Gowun_Batang({
  weight: ['400', '700'],
  variable: '--font-gowun',
  display: 'swap',
  // 한글 서브셋은 유니코드 범위로 쪼개져 배포된다. subsets 를 지정해 통째로
  // 선행 로드하면 첫 화면이 무거워지므로 브라우저 판단에 맡긴다.
  preload: false,
})

const plexSans = IBM_Plex_Sans_KR({
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
  preload: false,
})

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.description}`,
    template: `%s · ${SITE.name}`,
  },
  description: `${SITE.tagline}. ${SITE.description}.`,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  keywords: ['국제정세', '안보전략', '한미동맹', '국방정책', '지정학', 'HYEAN'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.description}`,
    description: SITE.tagline,
    url: absoluteUrl('/'),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F4F1' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1312' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${gowun.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  )
}
