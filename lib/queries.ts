import 'server-only'

import { cache } from 'react'

import { createClient, createPublicClient, hasSupabaseEnv } from '@/lib/supabase/server'
import type { Category, DocumentSummary } from '@/lib/types'

/**
 * ★ documents 질의에 select('*') 를 쓰지 않는다.
 * body_md 는 anon·authenticated 에서 컬럼 권한이 회수되어 있어 * 질의는 실패하고,
 * 무엇보다 본문이 실수로 페이로드에 섞이는 경로를 원천 차단하기 위해서다.
 */
const DOC_COLUMNS = `
  id, slug, doc_no, title, subtitle, summary_md, method, doc_type, rights_tier,
  access_level, published_at, free_until, tags, view_count
`

export const DOC_LIST_COLUMNS = `${DOC_COLUMNS}, categories ( slug, name_ko, name_en )`

/**
 * 섹션으로 거를 때 쓰는 형태.
 *
 * `!inner` 가 없으면 PostgREST 는 임베드 테이블 필터에 걸리지 않은 행도 그대로
 * 돌려주고 categories 만 null 로 만든다. 그러면 count 가 걸러내기 전 숫자가 되고
 * range() 도 필터 전 집합에 적용되어, 화면의 건수가 틀리고 목록에서 문건이
 * 누락된다. inner join 으로 DB 가 직접 걸러내게 한다.
 */
const DOC_LIST_COLUMNS_INNER = `${DOC_COLUMNS}, categories!inner ( slug, name_ko, name_en )`

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
    .select(categorySlug ? DOC_LIST_COLUMNS_INNER : DOC_LIST_COLUMNS, { count: 'exact' })
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
  const rows = (data as unknown as DocumentSummary[]) ?? []

  return { documents: rows, total: count ?? rows.length }
}

/**
 * 한 요청 안에서는 한 번만 질의한다.
 * generateMetadata 와 본문 렌더가 같은 문건을 각각 부르는데, cache() 로 묶지
 * 않으면 요청마다 DB 왕복이 한 번 더 늘어난다. 문건 상세는 권한 판정 때문에
 * 이미 왕복이 여러 번인 화면이라 한 번도 아깝다.
 */
export const getDocumentBySlug = cache(
  async (slug: string): Promise<DocumentSummary | null> => {
    if (!hasSupabaseEnv()) return null
    const supabase = await createClient()
    const { data } = await supabase
      .from('documents')
      .select(DOC_LIST_COLUMNS)
      .eq('slug', slug)
      .maybeSingle()
    return (data as unknown as DocumentSummary) ?? null
  }
)

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
