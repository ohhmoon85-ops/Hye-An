import type { Metadata } from 'next'
import Link from 'next/link'
import { DocRow } from '@/components/DocCard'
import { PageHeader } from '@/components/PageHeader'
import { getArchiveStats, getCategories, listDocuments, searchDocuments } from '@/lib/queries'
import { isStageOpen } from '@/lib/entitlement'
import { DOC_TYPE_LABEL, type DocType, type DocumentSummary } from '@/lib/types'

export const revalidate = 300

export const metadata: Metadata = {
  title: '아카이브',
  description:
    '축적된 국제정세·안보전략 분석 문건 전체 카탈로그. 섹션·연도·유형으로 거르고 전문 검색한다.',
  alternates: { canonical: '/archive' },
}

type Search = Promise<{ q?: string; c?: string; t?: string; y?: string }>

export default async function ArchivePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams
  const query = sp.q?.trim() ?? ''
  const [categories, stats] = await Promise.all([getCategories(), getArchiveStats()])
  const open = isStageOpen()

  let documents: DocumentSummary[] = []
  let total = 0

  if (query) {
    const hits = (await searchDocuments(query)) as Array<Record<string, unknown>>
    documents = hits.map(
      (h) =>
        ({
          id: h.slug as string,
          slug: h.slug as string,
          doc_no: h.doc_no as string | null,
          title: h.title as string,
          subtitle: h.subtitle as string | null,
          summary_md: h.summary_md as string,
          method: null,
          doc_type: h.doc_type as DocType,
          rights_tier: 'A',
          access_level: h.access_level,
          published_at: h.published_at as string | null,
          free_until: null,
          tags: [],
          view_count: 0,
          categories: h.category_slug
            ? {
                slug: h.category_slug as string,
                name_ko: h.category_name_ko as string,
                name_en: null,
              }
            : null,
        }) as DocumentSummary
    )
    total = documents.length
  } else {
    const result = await listDocuments({
      categorySlug: sp.c,
      docType: sp.t,
      year: sp.y ? Number(sp.y) : undefined,
      limit: 100,
    })
    documents = result.documents
    total = result.total
  }

  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= (stats.since ?? currentYear); y -= 1) years.push(y)

  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader
        label="Archive"
        title="전체 아카이브"
        description="섹션·연도·유형으로 거르거나, 제목과 요약을 전문 검색한다. 모든 문건의 핵심 요약은 로그인 없이 전문 공개한다."
        count={stats.published}
      />

      {/* 검색 — 서버 렌더 폼. 결과는 요약까지만 담긴다. */}
      <form action="/archive" method="get" className="mb-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="제목·요약 검색"
          aria-label="문건 검색"
          className="w-full border border-rule bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
        />
        <button
          type="submit"
          className="shrink-0 border border-accent px-5 py-2.5 text-sm text-accent transition-colors hover:bg-accent hover:text-ground"
        >
          검색
        </button>
      </form>

      {/* 필터 칩 */}
      {!query && (
        <div className="mb-8 space-y-2.5">
          <FilterRow label="섹션">
            <Chip href="/archive" active={!sp.c && !sp.t && !sp.y}>
              전체
            </Chip>
            {categories.map((c) => (
              <Chip key={c.slug} href={`/archive?c=${c.slug}`} active={sp.c === c.slug}>
                {c.name_ko}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="유형">
            {(Object.keys(DOC_TYPE_LABEL) as DocType[]).map((t) => (
              <Chip key={t} href={`/archive?t=${t}`} active={sp.t === t}>
                {DOC_TYPE_LABEL[t]}
              </Chip>
            ))}
          </FilterRow>

          {years.length > 1 && (
            <FilterRow label="연도">
              {years.map((y) => (
                <Chip key={y} href={`/archive?y=${y}`} active={sp.y === String(y)}>
                  {y}
                </Chip>
              ))}
            </FilterRow>
          )}
        </div>
      )}

      {query && (
        <p className="mb-4 font-mono text-xs text-ink-faint">
          “{query}” 검색 결과 {total}건 ·{' '}
          <Link href="/archive" className="text-accent hover:underline">
            검색 지우기
          </Link>
        </p>
      )}

      {documents.length === 0 ? (
        <p className="border-y border-rule py-16 text-center text-sm text-ink-faint">
          조건에 맞는 문건이 없다.
        </p>
      ) : (
        <ul className="border-t border-rule">
          {documents.map((doc) => (
            <DocRow key={doc.slug} doc={doc} open={open} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="w-9 shrink-0 font-mono text-[0.65rem] tracking-wide text-ink-faint uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

function Chip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`border px-2.5 py-1 font-mono text-[0.7rem] transition-colors ${
        active
          ? 'border-accent bg-accent text-ground'
          : 'border-rule text-ink-soft hover:border-accent hover:text-accent'
      }`}
    >
      {children}
    </Link>
  )
}
