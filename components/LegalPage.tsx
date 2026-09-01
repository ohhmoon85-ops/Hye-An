import { PageHeader } from '@/components/PageHeader'
import { renderMarkdown } from '@/lib/markdown'
import { BUSINESS, LEGAL_DRAFTED_ON } from '@/lib/legal'

/** 사업자 등록 전에는 채울 수 없는 항목이 있다. 비어 있으면 그 사실을 밝힌다. */
const pending = Object.values(BUSINESS).some((value) => value === '')

export function LegalPage({
  label,
  title,
  description,
  markdown,
}: {
  label: string
  title: string
  description: string
  markdown: string
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-16">
      <PageHeader label={label} title={title} description={description} />

      {pending && (
        <aside className="mb-10 max-w-(--measure) border-l-2 border-brass bg-brass-soft px-5 py-4">
          <p className="font-mono text-[0.7rem] tracking-[0.15em] text-brass uppercase">준비 중</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            유료 구독은 아직 열지 않았다. 아래 문서는 {LEGAL_DRAFTED_ON}에 작성한 초안이며,
            사업자 등록과 통신판매업 신고를 마치는 대로 사업자 정보를 기재하고 시행일을
            확정한다. 지금 서비스는 모든 문건을 무료로 공개하고 있다.
          </p>
        </aside>
      )}

      <div
        className="prose max-w-(--measure)"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
      />
    </div>
  )
}
