export const SITE = {
  name: '혜안',
  nameHanja: '慧眼',
  nameEn: 'HYEAN',
  tagline: '현상 너머의 구조를 읽는다',
  subtitleEn: 'Strategic Intelligence, Seoul',
  description: '국제정세·안보전략 분석 저널',
  // 저자는 개인명이 아니라 매체명으로 서명한다. 바이라인·인용 서식·구조화
  // 데이터의 author 가 모두 SITE.name 을 쓴다.
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
