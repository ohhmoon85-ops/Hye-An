import Link from 'next/link'
import { DocumentForm } from '@/components/admin/DocumentForm'
import { getCategories } from '@/lib/queries'
import { requireAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function NewDocumentPage() {
  await requireAdmin()
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-3xl px-5">
      <header className="py-10">
        <Link href="/admin" className="font-mono text-[0.7rem] text-ink-faint hover:text-accent">
          ← 문건 목록
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-bold">새 문건</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Markdown 원고를 붙여넣고 섹션·등급·공개일을 지정한다. 저장 후 첨부를 올릴 수 있다.
        </p>
      </header>

      <DocumentForm doc={null} categories={categories} />
    </div>
  )
}
