import Link from 'next/link'
import { DocMetaLine, LockMark } from '@/components/DocMeta'
import { toPlainText } from '@/lib/markdown'
import type { DocumentSummary } from '@/lib/types'

/** 목록 한 행. 밀도를 높게 유지한다 — 축적의 규모 자체가 신뢰 자산이다. */
export function DocRow({ doc, open = false }: { doc: DocumentSummary; open?: boolean }) {
  return (
    <li className="group border-b border-rule">
      <Link href={`/doc/${doc.slug}`} className="block py-5 transition-colors hover:bg-accent-soft">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <DocMetaLine doc={doc} />
            <h3 className="mt-1.5 font-serif text-lg font-bold leading-snug group-hover:text-accent">
              {doc.title}
            </h3>
            {doc.subtitle && (
              <p className="mt-0.5 text-sm text-ink-soft leading-snug">{doc.subtitle}</p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-ink-soft line-clamp-2">
              {toPlainText(doc.summary_md, 180)}
            </p>
          </div>
          <div className="shrink-0 pt-1">
            <LockMark doc={doc} open={open} />
          </div>
        </div>
      </Link>
    </li>
  )
}

/** 홈 상단 헤드라인용 — 한 건을 크게 세운다. */
export function DocHeadline({ doc }: { doc: DocumentSummary }) {
  return (
    <article className="border-b border-rule pb-8">
      <DocMetaLine doc={doc} />
      <h2 className="mt-2.5 font-serif text-2xl font-bold leading-tight sm:text-3xl">
        <Link href={`/doc/${doc.slug}`} className="hover:text-accent">
          {doc.title}
        </Link>
      </h2>
      {doc.subtitle && <p className="mt-1.5 text-base text-ink-soft">{doc.subtitle}</p>}
      <p className="mt-3 max-w-(--measure) leading-relaxed text-ink-soft">
        {toPlainText(doc.summary_md, 220)}
      </p>
      <Link
        href={`/doc/${doc.slug}`}
        className="mt-3 inline-block font-mono text-xs text-accent hover:underline"
      >
        전문 읽기 →
      </Link>
    </article>
  )
}
