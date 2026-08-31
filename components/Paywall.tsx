import Link from 'next/link'
import { formatKrw } from '@/lib/format'

/**
 * 페이월. 화면 하단 고정 바가 아니라 본문 흐름 안에 놓는다
 * (iOS 사파리에서 고정 바가 주소창과 충돌한다).
 *
 * 이 컴포넌트가 보인다는 것은 서버가 본문을 응답에 담지 않았다는 뜻이다.
 * 여기서 본문을 흐리게 처리하는 코드를 추가하지 말 것 — 가릴 본문 자체가 없다.
 */
export function Paywall() {
  return (
    <aside className="my-10 border border-rule bg-surface">
      <div className="border-b border-rule bg-surface-sunken px-6 py-3">
        <p className="font-mono text-[0.7rem] tracking-[0.15em] text-brass uppercase">
          여기부터 멤버십
        </p>
      </div>

      <div className="px-6 py-7">
        <h2 className="font-serif text-xl font-bold leading-snug">
          이 문건의 본문은 멤버십 독자에게 공개된다
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
          핵심 요약은 언제나 전문 공개한다. 본문·근거자료·첨부는 구독자에게 제공된다.
          아카이브에 축적된 분석 전량을 함께 열람할 수 있다.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/pricing"
            className="bg-accent px-5 py-2.5 text-sm font-medium text-ground hover:opacity-90 transition-opacity"
          >
            멤버십 {formatKrw(12900)}원 / 월
          </Link>
          <Link href="/login" className="text-sm text-accent hover:underline">
            이미 구독 중이라면 로그인
          </Link>
        </div>

        <p className="mt-5 font-mono text-[0.68rem] leading-relaxed text-ink-faint">
          연간 결제 시 {formatKrw(129000)}원 (2개월분 무료) · 언제든 1클릭 해지 · 해지 후에도 결제
          기간 만료일까지 열람 유지
        </p>
      </div>
    </aside>
  )
}

/** C·D 등급 또는 미발행 문건에 관리자가 접근했을 때의 표식 */
export function RestrictedNotice({ tier }: { tier: 'C' | 'D' | 'unpublished' }) {
  const message =
    tier === 'C'
      ? '타인 명의 저작물이다. 권리자의 서면 동의를 확보하기 전에는 공개할 수 없다.'
      : tier === 'D'
        ? '내부 문서다. 공개 대상이 아니다.'
        : '아직 발행되지 않았다. 관리자에게만 보인다.'

  return (
    <aside className="my-8 border-l-2 border-brass bg-brass-soft px-5 py-4">
      <p className="font-mono text-[0.7rem] tracking-[0.15em] text-brass uppercase">비공개</p>
      <p className="mt-1.5 text-sm text-ink-soft">{message}</p>
    </aside>
  )
}
