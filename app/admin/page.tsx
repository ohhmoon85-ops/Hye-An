import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import { DOC_TYPE_LABEL, type DocumentAdminRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

// 목록에서는 본문을 읽지 않는다. 필요한 화면(편집)에서만 가져온다.
const ADMIN_LIST_COLUMNS = `
  id, slug, doc_no, title, subtitle, summary_md, doc_type, rights_tier, access_level,
  published_at, free_until, tags, view_count, method, source_path, category_id, updated_at,
  categories ( slug, name_ko, name_en )
`

export default async function AdminIndexPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('documents')
    .select(ADMIN_LIST_COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(300)

  const documents = (data as unknown as Omit<DocumentAdminRow, 'body_md'>[]) ?? []
  const published = documents.filter((d) => d.published_at !== null)
  const drafts = documents.filter((d) => d.published_at === null)
  const restricted = documents.filter((d) => d.rights_tier === 'C' || d.rights_tier === 'D')
  const views = documents.reduce((sum, d) => sum + d.view_count, 0)

  return (
    <div className="mx-auto max-w-5xl px-5">
      <header className="flex flex-wrap items-end justify-between gap-4 py-10">
        <div>
          <p className="font-mono text-[0.7rem] tracking-[0.2em] text-ink-faint uppercase">
            Documents
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold">문건</h1>
        </div>
        <Link
          href="/admin/new"
          className="bg-accent px-4 py-2.5 text-sm font-medium text-ground hover:opacity-90"
        >
          새 문건
        </Link>
      </header>

      <dl className="mb-8 grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
        <Stat label="발행" value={published.length} />
        <Stat label="초안" value={drafts.length} />
        <Stat label="C·D 비공개" value={restricted.length} />
        <Stat label="누적 조회" value={views} />
      </dl>

      {documents.length === 0 ? (
        <p className="border-y border-rule py-16 text-center text-sm text-ink-faint">
          아직 등록된 문건이 없다.{' '}
          <Link href="/admin/new" className="text-accent hover:underline">
            첫 문건 작성
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto border border-rule bg-surface">
          <table className="w-full min-w-3xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule bg-surface-sunken text-left font-mono text-[0.65rem] tracking-wide text-ink-faint uppercase">
                <th className="px-3 py-2.5 font-medium">문서번호</th>
                <th className="px-3 py-2.5 font-medium">제목</th>
                <th className="px-3 py-2.5 font-medium">섹션</th>
                <th className="px-3 py-2.5 font-medium">유형</th>
                <th className="px-3 py-2.5 font-medium">등급</th>
                <th className="px-3 py-2.5 font-medium">상태</th>
                <th className="px-3 py-2.5 text-right font-medium">조회</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-rule last:border-0 hover:bg-accent-soft">
                  <td className="px-3 py-2.5 font-mono text-[0.7rem] whitespace-nowrap text-ink-faint">
                    {doc.doc_no}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/${doc.id}`} className="hover:text-accent">
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-ink-soft">
                    {doc.categories?.name_ko ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[0.7rem] whitespace-nowrap text-ink-soft">
                    {DOC_TYPE_LABEL[doc.doc_type]}
                  </td>
                  <td className="px-3 py-2.5">
                    <TierBadge tier={doc.rights_tier} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[0.7rem] whitespace-nowrap">
                    {doc.published_at ? (
                      <span className="text-accent">{formatDate(doc.published_at)}</span>
                    ) : (
                      <span className="text-ink-faint">초안</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[0.7rem] tabular-nums text-ink-faint">
                    {doc.view_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface px-4 py-4">
      <dt className="font-mono text-[0.65rem] tracking-wide text-ink-faint uppercase">{label}</dt>
      <dd className="mt-1 font-serif text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  )
}

function TierBadge({ tier }: { tier: DocumentAdminRow['rights_tier'] }) {
  const restricted = tier === 'C' || tier === 'D'
  return (
    <span
      className={`font-mono text-[0.7rem] ${restricted ? 'text-brass' : 'text-ink-soft'}`}
      title={restricted ? '발행할 수 없다' : undefined}
    >
      {tier}
      {restricted && ' ⌗'}
    </span>
  )
}
