import 'server-only'

import { createClient, createPublicClient, hasSupabaseEnv } from '@/lib/supabase/server'
import type { Category, DocumentSummary } from '@/lib/types'

/**
 * ★ documents 질의에 select('*') 를 쓰지 않는다.
 * body_md 는 anon·authenticated 에서 컬럼 권한이 회수되어 있어 * 질의는 실패하고,
 * 무엇보다 본문이 실수로 페이로드에 섞이는 경로를 원천 차단하기 위해서다.
 */
export const DOC_LIST_COLUMNS = `
  id, slug, doc_no, title, subtitle, summary_md, method, doc_type, rights_tier,
  access_level, published_at, free_until, tags, view_count,
  categories ( slug, name_ko, name_en )
` as const

export async function getCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv()) return []
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name_ko, name_en, sort_order')
    .order('sort_order')
  return (data as Category[]) ?? []
}

type ListOptions = {
  categorySlug?: string
  docType?: string
  year?: number
  limit?: number
  offset?: number
}

export async function listDocuments(opts: ListOptions = {}) {
  const { categorySlug, docType, year, limit = 20, offset = 0 } = opts
  if (!hasSupabaseEnv()) return { documents: [], total: 0 }
  const supabase = createPublicClient()

  let query = supabase
    .from('documents')
    .select(DOC_LIST_COLUMNS, { count: 'exact' })
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (categorySlug) query = query.eq('categories.slug', categorySlug)
  if (docType) query = query.eq('doc_type', docType)
  if (year) {
    query = query
      .gte('published_at', `${year}-01-01T00:00:00Z`)
      .lt('published_at', `${year + 1}-01-01T00:00:00Z`)
  }

  const { data, count } = await query
  let rows = (data as unknown as DocumentSummary[]) ?? []
  // PostgREST 는 임베드 테이블 필터에 해당하지 않는 행을 categories: null 로 돌려준다.
  if (categorySlug) rows = rows.filter((d) => d.categories !== null)

  return { documents: rows, total: count ?? rows.length }
}

export async function getDocumentBySlug(slug: string): Promise<DocumentSummary | null> {
  if (!hasSupabaseEnv()) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select(DOC_LIST_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()
  return (data as unknown as DocumentSummary) ?? null
}

export async function getAttachments(documentId: string) {
  if (!hasSupabaseEnv()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('attachments')
    .select('id, document_id, kind, filename, bytes, is_public, sort_order')
    .eq('document_id', documentId)
    .order('sort_order')
  return data ?? []
}

export async function searchDocuments(q: string, limit = 40) {
  if (!hasSupabaseEnv()) return []
  const supabase = createPublicClient()
  const { data } = await supabase.rpc('search_documents', { q, lim: limit })
  return data ?? []
}

/** 홈 화면의 "253건의 분석" 카운터 */
export async function getArchiveStats() {
  if (!hasSupabaseEnv()) return { published: 0, since: null }
  const supabase = createPublicClient()
  const { count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())

  const { data: oldest } = await supabase
    .from('documents')
    .select('published_at')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return {
    published: count ?? 0,
    since: oldest?.published_at ? new Date(oldest.published_at).getFullYear() : null,
  }
}

/** 섹션별 대표글 — 홈 그리드에 쓴다. */
export async function getSectionHighlights() {
  if (!hasSupabaseEnv()) return []
  const categories = await getCategories()
  const supabase = createPublicClient()

  const results = await Promise.all(
    categories.map(async (category) => {
      const { data, count } = await supabase
        .from('documents')
        .select(DOC_LIST_COLUMNS, { count: 'exact' })
        .eq('category_id', category.id)
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(1)

      return {
        category,
        latest: ((data as unknown as DocumentSummary[]) ?? [])[0] ?? null,
        count: count ?? 0,
      }
    })
  )

  return results
}
