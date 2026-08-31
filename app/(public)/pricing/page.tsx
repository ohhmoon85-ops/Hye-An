import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { formatKrw } from '@/lib/format'
import { isStageOpen } from '@/lib/entitlement'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: '구독',
  description: '요금제와 기관 라이선스. 해지는 1클릭, 해지 후에도 결제 기간 만료일까지 열람한다.',
  alternates: { canonical: '/pricing' },
}

const PLANS = [
  {
    code: 'free',
    name: '열람',
    price: '무료',
    note: '가입 없이',
    features: [
      '모든 문건의 핵심 요약 전문',
      '현안 브리프 발행 후 7일간 전문',
      '원자료 아카이브 (NSS·NDS 등)',
      '월 2건 전문 열람',
    ],
    cta: { label: '그냥 읽기', href: '/archive' },
    emphasis: false,
  },
  {
    code: 'member_y',
    name: '멤버십 · 연간',
    price: `${formatKrw(129000)}원`,
    note: '연 결제 · 월 환산 10,750원 (2개월분 무료)',
    features: [
      '아카이브 전량 열람',
      'PDF·슬라이드 다운로드 (워터마크)',
      '신규 발행 이메일 알림',
      '전문 검색 · 인용 서식 복사',
      '광고 없음',
    ],
    cta: { label: '연간 구독', href: '/account' },
    emphasis: true,
  },
  {
    code: 'member_m',
    name: '멤버십 · 월간',
    price: `${formatKrw(12900)}원`,
    note: '월 결제 · 언제든 해지',
    features: [
      '아카이브 전량 열람',
      'PDF·슬라이드 다운로드 (워터마크)',
      '신규 발행 이메일 알림',
      '전문 검색 · 인용 서식 복사',
    ],
    cta: { label: '월간 구독', href: '/account' },
    emphasis: false,
  },
] as const

export default function PricingPage() {
  const open = isStageOpen()

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12">
      <PageHeader
        label="Pricing"
        title="구독"
        description="핵심 요약은 언제나 무료다. 구독은 본문·원자료·첨부와 아카이브 전량 열람을 연다."
      />

      {open && (
        <div className="mb-8 border-l-2 border-brass bg-brass-soft px-5 py-4">
          <p className="font-mono text-[0.7rem] tracking-[0.15em] text-brass uppercase">
            개설 준비 기간
          </p>
          <p className="mt-1.5 text-sm text-ink-soft">
            지금은 모든 문건의 본문을 무료로 공개하고 있다. 결제는 아직 열지 않았다. 아래 요금제는
            정식 개설 시 적용될 안이다.
          </p>
        </div>
      )}

      <div className="grid gap-px border border-rule bg-rule md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.code}
            className={`flex flex-col bg-surface p-6 ${plan.emphasis ? 'ring-2 ring-inset ring-accent' : ''}`}
          >
            {plan.emphasis && (
              <p className="mb-3 font-mono text-[0.65rem] tracking-[0.15em] text-accent uppercase">
                추천
              </p>
            )}
            <h2 className="font-serif text-lg font-bold">{plan.name}</h2>
            <p className="mt-3 font-serif text-3xl font-bold tabular-nums">{plan.price}</p>
            <p className="mt-1.5 font-mono text-[0.68rem] leading-relaxed text-ink-faint">
              {plan.note}
            </p>

            <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-soft">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-2 h-px w-2 shrink-0 bg-brass" aria-hidden />
                  <span className="leading-snug">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.cta.href}
              aria-disabled={open && plan.code !== 'free'}
              className={`mt-6 block border px-4 py-2.5 text-center text-sm transition-colors ${
                plan.emphasis
                  ? 'border-accent bg-accent text-ground hover:opacity-90'
                  : 'border-rule text-ink-soft hover:border-accent hover:text-accent'
              } ${open && plan.code !== 'free' ? 'pointer-events-none opacity-45' : ''}`}
            >
              {open && plan.code !== 'free' ? '준비 중' : plan.cta.label}
            </Link>
          </div>
        ))}
      </div>

      {/* 기관 라이선스 */}
      <section className="mt-6 border border-rule bg-surface px-6 py-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-md">
            <h2 className="font-serif text-lg font-bold">기관 라이선스</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              부대·기관·기업 단위 연간 계약. IP 대역 또는 도메인 기반 자동 인증, 세금계산서 발행,
              비공개 맞춤 브리핑을 협의한다.
            </p>
          </div>
          <div className="font-mono text-xs leading-relaxed text-ink-soft">
            <p>5~50인 · 20% 할인</p>
            <p>50~100인 · 30% 할인</p>
            <p>100인 이상 · 40% 할인</p>
            <a href={`mailto:${SITE.email}`} className="mt-2 inline-block text-accent hover:underline">
              {SITE.email} →
            </a>
          </div>
        </div>
      </section>

      {/* 환불·해지 정책 — 전자상거래법상 사전 고지 항목 */}
      <section className="mt-6 border border-rule bg-surface-sunken px-6 py-6">
        <h2 className="font-mono text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
          해지 · 환불
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-ink-soft">
          <li>· 해지는 계정 화면에서 1클릭으로 처리된다. 전화·이메일 문의를 요구하지 않는다.</li>
          <li>· 해지해도 이미 결제한 기간의 만료일까지 열람이 유지된다.</li>
          <li>· 자동 갱신 3일 전 이메일로 갱신일과 금액을 통지한다.</li>
          <li>
            · 모든 문건은 핵심 요약 전문과 본문 도입부를 미리 볼 수 있다. 결제 전에 무엇을 사는지
            확인할 수 있어야 한다는 원칙이자, 전자상거래법상 요건이다.
          </li>
        </ul>
      </section>
    </div>
  )
}
