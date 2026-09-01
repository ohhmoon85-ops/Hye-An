import type { MetadataRoute } from 'next'
import { getCategories, listDocuments } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ documents }, categories] = await Promise.all([
    listDocuments({ limit: 1000 }),
    getCategories(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/brief'), changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/archive'), changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/pricing'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/terms'), changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/privacy'), changeFrequency: 'yearly', priority: 0.2 },
  ]

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: absoluteUrl(`/topics/${c.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // 발행된 문건만 담긴다. C·D 등급과 미발행은 listDocuments 에서 이미 걸러진다.
    ...documents.map((doc) => ({
      url: absoluteUrl(`/doc/${doc.slug}`),
      lastModified: doc.published_at ? new Date(doc.published_at) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
