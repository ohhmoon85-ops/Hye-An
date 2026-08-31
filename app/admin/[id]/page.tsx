import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocumentForm } from '@/components/admin/DocumentForm'
import { AttachmentManager } from '@/components/admin/AttachmentManager'
import { PublishControls } from '@/components/admin/PublishControls'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/server'
import { getCategories } from '@/lib/queries'
import { formatDate } from '@/lib/format'
import type { Attachment, DocumentAdminRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

const ADMIN_EDIT_COLUMNS = `
  id, slug, doc_no, title, subtitle, summary_md, body_md, doc_type, rights_tier, access_level,
  published_at, free_until, tags, view_count, method, source_path, category_id, updated_at,
  categories ( slug, name_ko, name_en )
`

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const admin = createAdminClient()
  const [{ data }, categories] = await Promise.all([
    admin.from('documents').select(ADMIN_EDIT_COLUMNS).eq('id', id).maybeSingle(),
    getCategories(),
  ])

  const doc = data as unknown as DocumentAdminRow | null
  if (!doc) notFound()

  const { data: files } = await admin
    .from('attachments')
    .select('id, document_id, kind, filename, bytes, is_public, sort_order')
    .eq('document_id', id)
    .order('sort_order')

  return (
    <div className="mx-auto max-w-3xl px-5">
      <header className="py-10">
        <Link href="/admin" className="font-mono text-[0.7rem] text-ink-faint hover:text-accent">
          ← 문건 목록
        </Link>
        <p className="mt-3 font-mono text-[0.7rem] tracking-wide text-ink-faint">
          {doc.doc_no} · 최종 수정 {formatDate(doc.updated_at)} · 조회 {doc.view_count}
        </p>
        <h1 className="mt-1.5 font-serif text-2xl font-bold">{doc.title}</h1>
      </header>

      <PublishControls doc={doc} />

      <div className="mt-10">
        <DocumentForm doc={doc} categories={categories} />
      </div>

      <div className="mt-12">
        <AttachmentManager
          documentId={doc.id}
          attachments={(files as Attachment[]) ?? []}
        />
      </div>
    </div>
  )
}
