import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DocRow } from '@/components/DocCard'
import { PageHeader } from '@/components/PageHeader'
import { getCategories, listDocuments } from '@/lib/queries'
import { isStageOpen } from '@/lib/entitlement'

export const revalidate = 300

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const category = (await getCategories()).find((c) => c.slug === slug)
  if (!category) return {}
  return {
    title: category.name_ko,
    description: `${category.name_ko} 분야의 분석 문건. 핵심 요약은 전문 공개한다.`,
    alternates: { canonical: `/topics/${slug}` },
  }
}

export default async function TopicPage({ params }: Params) {
  const { slug } = await params
  const categories = await getCategories()
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  const { documents, total } = await listDocuments({ categorySlug: slug, limit: 50 })
  const open = isStageOpen()

  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader
        label={category.name_en ?? 'Section'}
        title={category.name_ko}
        count={total}
      />

      <nav className="mb-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/topics/${c.slug}`}
            className={`border px-3 py-1.5 font-mono text-[0.7rem] transition-colors ${
              c.slug === slug
                ? 'border-accent bg-accent text-ground'
                : 'border-rule text-ink-soft hover:border-accent hover:text-accent'
            }`}
          >
            {c.name_ko}
          </Link>
        ))}
      </nav>

      {documents.length === 0 ? (
        <p className="border-y border-rule py-16 text-center text-sm text-ink-faint">
          이 섹션에는 아직 발행된 문건이 없다.
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
