import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DocMetaLine } from '@/components/DocMeta'
import { Paywall, RestrictedNotice } from '@/components/Paywall'
import { AttachmentList } from '@/components/AttachmentList'
import { getAttachments, getDocumentBySlug } from '@/lib/queries'
import { getLeadExcerpt, resolveAccess } from '@/lib/entitlement'
import { renderMarkdown, toPlainText } from '@/lib/markdown'
import { getCurrentProfile } from '@/lib/supabase/server'
import { logAccess } from '@/lib/access-log'
import { absoluteUrl, SITE } from '@/lib/site'
import { formatDate, isoDate } from '@/lib/format'

/**
 * 권한에 따라 응답 내용이 달라지므로 캐시하지 않는다.
 * 요약·목록은 ISR로 캐시하되, 이 화면만은 매 요청 서버가 판정한다.
 */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const doc = await getDocumentBySlug(slug)
  if (!doc) return { title: '문건을 찾을 수 없다' }

  const isOpen = doc.rights_tier !== 'C' && doc.rights_tier !== 'D' && doc.published_at !== null

  return {
    title: doc.title,
    description: toPlainText(doc.summary_md, 155),
    alternates: { canonical: `/doc/${doc.slug}` },
    // C·D 등급과 미발행 문건은 색인하지 않는다.
    robots: isOpen ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: 'article',
      title: doc.title,
      description: toPlainText(doc.summary_md, 155),
      url: absoluteUrl(`/doc/${doc.slug}`),
      publishedTime: doc.published_at ?? undefined,
      authors: [SITE.name],
      tags: doc.tags,
    },
  }
}

export default async function DocumentPage({ params }: Params) {
  const { slug } = await params
  const doc = await getDocumentBySlug(slug)
  if (!doc) notFound()

  // ★ 판정은 여기서 한 번. 권한이 없으면 body 는 null 로 온다.
  const access = await resolveAccess(doc)

  if (!access.canRead && access.reason === 'restricted') notFound()

  const restricted = doc.rights_tier === 'C' || doc.rights_tier === 'D'
  const unpublished = doc.published_at === null
  const lead = access.canRead ? '' : await getLeadExcerpt(doc)
  const attachments = await getAttachments(doc.id)
  const profile = await getCurrentProfile()

  void logAccess({ documentId: doc.id, userId: profile?.id ?? null, action: 'view' })

  return (
    <article className="mx-auto max-w-5xl px-5 pb-16">
      <JsonLd doc={doc} paywalled={!access.canRead} />

      <header className="border-b border-rule py-10 sm:py-14">
        <DocMetaLine doc={doc} />
        <h1 className="mt-3 max-w-(--measure) font-serif text-3xl leading-tight font-bold sm:text-4xl">
          {doc.title}
        </h1>
        {doc.subtitle && (
          <p className="mt-2.5 max-w-(--measure) font-serif text-lg text-ink-soft">
            {doc.subtitle}
          </p>
        )}
        {doc.published_at && (
          <p className="mt-5 font-mono text-xs text-ink-faint">
            {formatDate(doc.published_at)} 작성
          </p>
        )}
      </header>

      {(restricted || unpublished) && (
        <RestrictedNotice tier={restricted ? (doc.rights_tier as 'C' | 'D') : 'unpublished'} />
      )}

      {/* ─── 핵심 요약 — 언제나 전문 공개. 검색엔진 색인 대상. ─────── */}
      <section className="max-w-(--measure) pt-10">
        <h2 className="mb-3 font-mono text-[0.7rem] tracking-[0.18em] text-brass uppercase">
          핵심 요약
        </h2>
        <div
          className="prose prose-summary"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.summary_md) }}
        />
      </section>

      <hr className="my-10 border-t border-rule" />

      {/* ─── 본문 ────────────────────────────────────────────────── */}
      <section className="max-w-(--measure)">
        {access.canRead ? (
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(access.body) }}
          />
        ) : (
          <>
            {/* 서버가 잘라낸 도입부만 내려온다. 나머지는 응답에 없다. */}
            {lead && (
              <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(lead) }} />
            )}
            <div className="paywall">
              <Paywall />
            </div>
          </>
        )}
      </section>

      {/* ─── 첨부 ────────────────────────────────────────────────── */}
      {attachments.length > 0 && (
        <section className="mt-12 max-w-(--measure)">
          <h2 className="mb-3 font-mono text-[0.7rem] tracking-[0.18em] text-ink-faint uppercase">
            첨부
          </h2>
          <AttachmentList attachments={attachments} canDownload={access.canRead} />
        </section>
      )}

      {/* ─── 방법·인용 ───────────────────────────────────────────── */}
      <footer className="mt-12 max-w-(--measure) space-y-4 border-t border-rule pt-6">
        {doc.method && (
          <p className="font-mono text-[0.7rem] leading-relaxed text-ink-faint">
            작성 방법 · {doc.method}
          </p>
        )}
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {doc.tags.map((tag) => (
              <Link
                key={tag}
                href={`/archive?q=${encodeURIComponent(tag)}`}
                className="border border-rule px-2 py-0.5 font-mono text-[0.65rem] text-ink-soft hover:border-accent hover:text-accent"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
        <Citation doc={doc} />
      </footer>
    </article>
  )
}

function Citation({ doc }: { doc: Awaited<ReturnType<typeof getDocumentBySlug>> }) {
  if (!doc) return null
  const year = doc.published_at ? new Date(doc.published_at).getFullYear() : ''
  return (
    <div className="border border-rule bg-surface-sunken px-4 py-3">
      <p className="font-mono text-[0.65rem] tracking-wide text-ink-faint uppercase">인용 서식</p>
      <p className="mt-1.5 font-mono text-[0.72rem] leading-relaxed break-words text-ink-soft">
        {SITE.name}. ({year}). 「{doc.title}」
        {doc.doc_no ? `. ${doc.doc_no}` : ''}. {absoluteUrl(`/doc/${doc.slug}`)}
      </p>
    </div>
  )
}

/**
 * 구글의 유료 콘텐츠 정책 — 요약은 색인하되 본문이 유료임을 구조화 데이터로 알린다.
 * 이 표기가 없으면 클로킹으로 오인되어 색인에서 불이익을 받을 수 있다.
 */
function JsonLd({
  doc,
  paywalled,
}: {
  doc: NonNullable<Awaited<ReturnType<typeof getDocumentBySlug>>>
  paywalled: boolean
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    alternativeHeadline: doc.subtitle ?? undefined,
    description: toPlainText(doc.summary_md, 200),
    datePublished: doc.published_at ? isoDate(doc.published_at) : undefined,
    inLanguage: 'ko',
    // 개인이 아니라 매체가 서명한다.
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(`/doc/${doc.slug}`) },
    articleSection: doc.categories?.name_ko,
    keywords: doc.tags.join(', '),
    isAccessibleForFree: !paywalled,
    ...(paywalled
      ? {
          hasPart: {
            '@type': 'WebPageElement',
            isAccessibleForFree: false,
            cssSelector: '.paywall',
          },
        }
      : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
