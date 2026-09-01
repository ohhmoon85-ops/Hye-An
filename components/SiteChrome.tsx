import Link from 'next/link'
import { Seal } from '@/components/Seal'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NAV, SITE } from '@/lib/site'

/**
 * 공개 화면의 머리글.
 *
 * ★ 여기서 세션(쿠키)을 읽지 않는다. 한 번이라도 cookies() 를 부르면 이
 * 레이아웃을 쓰는 모든 페이지가 요청마다 렌더되어 요약·목록의 ISR 캐시가
 * 사라진다. 검색 유입이 1단계의 목표이므로 그 대가가 크다.
 *
 * 그래서 관리자 링크를 두지 않는다. 운영자는 /admin 을 직접 연다.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-surface/80 backdrop-blur-sm sticky top-0 z-30 no-print">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Seal size={30} />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold tracking-tight">{SITE.name}</span>
            <span className="font-mono text-[0.6rem] tracking-[0.18em] text-ink-faint mt-0.5">
              {SITE.nameEn}
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-5 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-accent transition-colors">
              {item.label}
            </Link>
          ))}
          {/* 화면 밝기는 이동이 아니라 조작이다. 괘선으로 구분해 메뉴처럼 보이지 않게 한다. */}
          <span className="ml-1 border-l border-rule pl-4">
            <ThemeToggle />
          </span>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule bg-surface no-print">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-start gap-8">
          <div className="flex items-start gap-3">
            <Seal size={38} />
            <div>
              <p className="font-serif text-base font-bold">
                {SITE.name} <span className="text-ink-faint font-normal">{SITE.nameHanja}</span>
              </p>
              <p className="text-xs text-ink-soft mt-1">{SITE.description}</p>
              <p className="font-mono text-[0.65rem] text-ink-faint mt-1.5 tracking-wide">
                {SITE.subtitleEn}
              </p>
            </div>
          </div>

          <nav className="ml-auto grid grid-cols-2 gap-x-10 gap-y-1.5 text-xs text-ink-soft">
            <Link href="/archive" className="hover:text-accent">
              전체 아카이브
            </Link>
            <Link href="/about" className="hover:text-accent">
              저자·편집 원칙
            </Link>
            <Link href="/pricing" className="hover:text-accent">
              구독 안내
            </Link>
            <Link href="/about#citation" className="hover:text-accent">
              인용 정책
            </Link>
            <a href={`mailto:${SITE.email}`} className="hover:text-accent">
              {SITE.email}
            </a>
            <Link href="/about#institution" className="hover:text-accent">
              기관 라이선스 문의
            </Link>
            <Link href="/terms" className="hover:text-accent">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-accent">
              개인정보 처리방침
            </Link>
          </nav>
        </div>

        <p className="mt-8 border-t border-rule pt-5 font-mono text-[0.65rem] leading-relaxed text-ink-faint">
          © {new Date().getFullYear()} {SITE.name}. 모든 문건의 저작권은 {SITE.name}에 있다.
          <br />
          {/* 통신판매업 신고번호는 신고 완료 후 이곳에 표기한다 (오픈 전 필수) */}
        </p>
      </div>
    </footer>
  )
}
