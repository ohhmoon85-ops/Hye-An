import Link from 'next/link'
import { formatDate, daysLeft, isoDate } from '@/lib/format'
import { DOC_TYPE_LABEL, type DocumentSummary } from '@/lib/types'

/** 문서번호·섹션·작성일 한 줄. 기록물 성격을 드러내는 표식이다. */
export function DocMetaLine({ doc }: { doc: DocumentSummary }) {
  const free = daysLeft(doc.free_until)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] tracking-wide text-ink-faint">
      {doc.doc_no && <span>{doc.doc_no}</span>}
      {doc.categories && (
        <>
          <span aria-hidden>·</span>
          <Link href={`/topics/${doc.categories.slug}`} className="text-accent hover:underline">
            {doc.categories.name_ko}
          </Link>
        </>
      )}
      <span aria-hidden>·</span>
      <span className="uppercase">{DOC_TYPE_LABEL[doc.doc_type]}</span>
      {doc.published_at && (
        <>
          <span aria-hidden>·</span>
          <time dateTime={isoDate(doc.published_at)}>{formatDate(doc.published_at)}</time>
        </>
      )}
      {free !== null && (
        <span className="rounded-sm bg-brass-soft px-1.5 py-0.5 text-brass">
          무료 공개 {free}일 남음
        </span>
      )}
    </div>
  )
}

/** 목록에서 자물쇠 표시 — 무엇이 잠겨 있는지 숨기지 않는다. */
export function LockMark({ doc, open }: { doc: DocumentSummary; open: boolean }) {
  if (open || doc.access_level === 'free' || daysLeft(doc.free_until) !== null) {
    return (
      <span className="font-mono text-[0.65rem] text-ink-faint" title="전문 공개">
        전문
      </span>
    )
  }
  return (
    <span className="font-mono text-[0.65rem] text-brass" title="멤버십 전용">
      ⌗ 멤버십
    </span>
  )
}
