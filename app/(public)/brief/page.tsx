import type { Metadata } from 'next'
import { DocRow } from '@/components/DocCard'
import { PageHeader } from '@/components/PageHeader'
import { listDocuments } from '@/lib/queries'
import { isStageOpen } from '@/lib/entitlement'

export const revalidate = 300

export const metadata: Metadata = {
  title: '현안 브리프',
  description: '사건 발생 48시간 내에 쓰는 짧은 판단. 발행 후 7일간 전문을 무료 공개한다.',
  alternates: { canonical: '/brief' },
}

export default async function BriefPage() {
  const { documents, total } = await listDocuments({ docType: 'brief', limit: 50 })
  const open = isStageOpen()

  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader
        label="Brief"
        title="현안 브리프"
        description="사건이 벌어진 지 48시간 안에 쓰는 짧은 판단. 2,000자 내외로 무엇이 달라졌는지만 적는다. 발행 후 7일간은 전문을 무료로 공개한다."
        count={total}
      />

      {documents.length === 0 ? (
        <EmptyList />
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

function EmptyList() {
  return (
    <p className="border-y border-rule py-16 text-center text-sm text-ink-faint">
      아직 발행된 브리프가 없다.
    </p>
  )
}
