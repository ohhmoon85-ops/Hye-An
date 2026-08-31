export const SITE = {
  name: '혜안',
  nameHanja: '慧眼',
  nameEn: 'HYEAN',
  tagline: '현상 너머의 구조를 읽는다',
  subtitleEn: 'Strategic Intelligence, Seoul',
  description: '국제정세·안보전략 분석 저널',
  author: '문형철',
  authorTitle: '예비역 육군 대령',
  email: 'brief@hyean.kr',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://hyean.kr',
} as const

export const NAV = [
  { href: '/brief', label: '브리프' },
  { href: '/archive', label: '아카이브' },
  { href: '/pricing', label: '구독' },
  { href: '/about', label: '소개' },
] as const

export function absoluteUrl(path = '/'): string {
  return new URL(path, SITE.url).toString()
}
