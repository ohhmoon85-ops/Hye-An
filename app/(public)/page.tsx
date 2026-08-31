import Link from 'next/link'
import { DocHeadline, DocRow } from '@/components/DocCard'
import { Seal } from '@/components/Seal'
import { SetupNotice } from '@/components/SetupNotice'
import { getArchiveStats, getSectionHighlights, listDocuments } from '@/lib/queries'
import { hasSupabaseEnv } from '@/lib/supabase/server'
import { isStageOpen } from '@/lib/entitlement'
import { SITE } from '@/lib/site'
import { formatKrw } from '@/lib/format'

export const revalidate = 300

export default async function HomePage() {
  const [briefs, latest, sections, stats] = await Promise.all([
    listDocuments({ docType: 'brief', limit: 3 }),
    listDocuments({ limit: 8 }),
    getSectionHighlights(),
    getArchiveStats(),
  ])

  const open = isStageOpen()
  const headline = briefs.documents[0] ?? latest.documents[0] ?? null
  const restBriefs = briefs.documents.slice(1)
  const recent = latest.documents.filter((d) => d.slug !== headline?.slug).slice(0, 6)

  return (
    <>
      {!hasSupabaseEnv() && <SetupNotice />}

      {/* ─── 표제 ─────────────────────────────────────────────── */}
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
          <div className="flex items-start gap-5 sm:gap-7">
            <Seal size={58} className="mt-1.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-mono text-[0.65rem] tracking-[0.24em] text-brass uppercase">
                {SITE.subtitleEn}
              </p>
              <h1 className="mt-3.5 font-serif text-[2.05rem] leading-[1.28] font-bold sm:text-[2.75rem]">
                {SITE.tagline}
              </h1>
              <p className="mt-5 max-w-(--measure) leading-loose text-ink-soft">
                {SITE.description}. 사건을 나열하지 않는다. 그 아래 놓인 구조를 읽고, 근거를 밝혀
                판단을 적는다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5">
        {/* ─── 최신 브리프 ─────────────────────────────────────── */}
        {headline && (
          <section className="pt-12">
            <SectionLabel
              label="최신 브리프"
              note="현안 발생 48시간 내 · 발행 후 7일간 전문 무료"
              href="/brief"
            />
            <DocHeadline doc={headline} />
            {restBriefs.length > 0 && (
              <ul className="mt-2">
                {restBriefs.map((doc) => (
                  <DocRow key={doc.slug} doc={doc} open={open} />
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ─── 섹션 그리드 ─────────────────────────────────────── */}
        {sections.length > 0 && (
          <section className="pt-16">
            <SectionLabel label="섹션" note="7개 분야" href="/archive" />
            <div className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-3 border border-rule">
              {sections.map(({ category, latest: doc, count }) => (
                <Link
                  key={category.slug}
                  href={`/topics/${category.slug}`}
                  className="group bg-surface p-5 transition-colors hover:bg-accent-soft"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif text-base font-bold group-hover:text-accent">
                      {category.name_ko}
                    </h3>
                    <span className="font-mono text-[0.7rem] text-ink-faint">{count}건</span>
                  </div>
                  <p className="mt-1 font-mono text-[0.65rem] tracking-wide text-ink-faint uppercase">
                    {category.name_en}
                  </p>
                  <p className="mt-3 text-sm leading-snug text-ink-soft line-clamp-2 min-h-10">
                    {doc?.title ?? '준비 중'}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── 최근 발행 ───────────────────────────────────────── */}
        {recent.length > 0 && (
          <section className="pt-16">
            <SectionLabel label="최근 발행" href="/archive" />
            <ul className="border-t border-rule">
              {recent.map((doc) => (
                <DocRow key={doc.slug} doc={doc} open={open} />
              ))}
            </ul>
          </section>
        )}

        {/* ─── 아카이브 카운터 ─────────────────────────────────── */}
        {/* 축적의 규모 자체가 신뢰 자산이다. 다만 0건일 때 큰 숫자를 세우면
            비어 보이므로, 발행 전에는 다른 문안을 내보낸다. */}
        {stats.published > 0 ? (
          <section className="mt-16 border border-rule bg-surface px-6 py-12 text-center">
            <p className="font-mono text-[0.65rem] tracking-[0.24em] text-ink-faint uppercase">
              Archive
            </p>
            <p className="mt-4 font-serif text-6xl leading-none font-bold tabular-nums text-accent">
              {stats.published}
              <span className="ml-1.5 text-2xl text-brass">건</span>
            </p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              {stats.since ? `${stats.since}년부터 축적된 ` : ''}국제정세·안보전략 분석 문건. 핵심
              요약은 언제나 전문 공개한다.
            </p>
            <Link
              href="/archive"
              className="mt-6 inline-block border border-accent px-5 py-2 text-sm text-accent transition-colors hover:bg-accent hover:text-ground"
            >
              전체 아카이브 열람
            </Link>
          </section>
        ) : (
          <section className="mt-16 border border-rule bg-surface px-6 py-16 text-center">
            <Seal size={42} className="mx-auto" />
            <p className="mt-5 font-serif text-lg font-bold">아직 공개된 문건이 없다</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
              첫 문건이 발행되면 이곳에 아카이브 규모와 최신 분석이 표시된다.
            </p>
          </section>
        )}

        {/* ─── 구독 CTA ────────────────────────────────────────── */}
        {/* 면을 뒤집어 페이지를 닫는다. ink/ground 한 쌍만 쓰므로 다크 모드에서
            자동으로 반대로 뒤집힌다 — 어느 쪽이든 대비 15:1 이상. */}
        <section className="mt-6 mb-4 bg-ink px-6 py-10 text-ground sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-7">
            <div className="max-w-md">
              <p className="font-mono text-[0.65rem] tracking-[0.24em] uppercase opacity-60">
                Membership
              </p>
              <h2 className="mt-2.5 font-serif text-2xl font-bold">아카이브 전량을 연다</h2>
              <p className="mt-2.5 text-sm leading-relaxed opacity-75">
                본문·원자료·첨부 열람 · PDF·슬라이드 다운로드 · 신규 발행 이메일 알림 · 전문 검색.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <p className="font-mono text-sm whitespace-nowrap">
                월 {formatKrw(12900)}원
                <span className="mt-0.5 block text-[0.68rem] opacity-60">
                  연 {formatKrw(129000)}원 · 2개월분 무료
                </span>
              </p>
              <Link
                href="/pricing"
                className="shrink-0 bg-ground px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-85"
              >
                요금제 보기
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function SectionLabel({ label, note, href }: { label: string; note?: string; href?: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3 border-b border-ink pb-2">
      <h2 className="font-mono text-[0.75rem] tracking-[0.18em] uppercase">{label}</h2>
      {note && <p className="text-xs text-ink-faint">{note}</p>}
      {href && (
        <Link href={href} className="ml-auto font-mono text-[0.7rem] text-accent hover:underline">
          전체 →
        </Link>
      )}
    </div>
  )
}
