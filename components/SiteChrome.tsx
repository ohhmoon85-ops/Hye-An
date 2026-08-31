import Link from 'next/link'
import { Seal } from '@/components/Seal'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NAV, SITE } from '@/lib/site'
import { getCurrentProfile } from '@/lib/supabase/server'

export async function SiteHeader() {
  const profile = await getCurrentProfile()

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
          {profile?.role === 'admin' && (
            <Link href="/admin" className="font-mono text-[0.7rem] text-brass hover:underline">
              ADMIN
            </Link>
          )}
          <ThemeToggle />
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
