import 'server-only'

import { createClient, getCurrentProfile } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { leadParagraphs } from '@/lib/markdown'
import type { DocumentSummary } from '@/lib/types'

/**
 * ─────────────────────────────────────────────────────────────────────
 * 열람 권한 단일 판정 지점.
 *
 * 이 파일 밖에서 본문(body_md)을 읽는 코드를 만들지 않는다.
 * 판정에 실패하면 본문을 응답 페이로드에 **아예 담지 않는다**.
 * CSS로 가리는 방식은 개발자도구로 즉시 뚫리므로 금지한다.
 * ─────────────────────────────────────────────────────────────────────
 */

export type AccessReason =
  | 'free'        // access_level = free
  | 'free-window' // 브리프 무료 공개 기간 중
  | 'entitlement' // entitlements 테이블에 유효한 권한 보유
  | 'admin'       // 관리자
  | 'stage-open'  // 1단계(발행 기반) 전면 공개 스위치
  | 'locked'      // 권한 없음 — 페이월
  | 'restricted'  // C·D 등급 또는 미발행 — 존재 자체를 노출하지 않는다

export type AccessDecision = {
  canRead: boolean
  reason: AccessReason
  /** 권한이 없으면 언제나 null. 이 값이 곧 응답 페이로드에 실린다. */
  body: string | null
}

/**
 * 1단계(발행 기반) 한정 스위치.
 * 로드맵상 1단계는 전 문건을 무료 공개하고 유입을 먼저 확인한다.
 * 2단계 진입 시 HYEAN_FREE_ALL 을 false 로 바꾸면 페이월이 활성화된다.
 */
export function isStageOpen(): boolean {
  return process.env.HYEAN_FREE_ALL === 'true'
}

type AccessInput = Pick<
  DocumentSummary,
  'slug' | 'rights_tier' | 'access_level' | 'published_at' | 'free_until'
>

function isPublished(doc: AccessInput): boolean {
  return doc.published_at !== null && new Date(doc.published_at) <= new Date()
}

function inFreeWindow(doc: AccessInput): boolean {
  return doc.free_until !== null && new Date(doc.free_until) > new Date()
}

/**
 * 문건 하나에 대한 열람 판정. Server Component 또는 Route Handler 에서만 호출한다.
 */
export async function resolveAccess(doc: AccessInput): Promise<AccessDecision> {
  // 1. C·D 등급과 미발행 문건은 관리자에게만 존재를 드러낸다.
  if (doc.rights_tier === 'C' || doc.rights_tier === 'D' || !isPublished(doc)) {
    const profile = await getCurrentProfile()
    if (profile?.role !== 'admin') {
      return { canRead: false, reason: 'restricted', body: null }
    }
    return { canRead: true, reason: 'admin', body: await readBodyAsAdmin(doc.slug) }
  }

  // 2. DB의 has_access() 가 정본이다. 본문은 이 RPC 를 통해서만 나온다.
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_document_body', { doc_slug: doc.slug })
  const body = (data as string | null) ?? null

  if (body !== null) {
    if (doc.access_level === 'free') return { canRead: true, reason: 'free', body }
    if (inFreeWindow(doc)) return { canRead: true, reason: 'free-window', body }
    return { canRead: true, reason: 'entitlement', body }
  }

  // 3. 1단계 전면 공개 스위치. 발행된 A·B 등급에만 적용된다.
  if (isStageOpen()) {
    return { canRead: true, reason: 'stage-open', body: await readBodyAsAdmin(doc.slug) }
  }

  return { canRead: false, reason: 'locked', body: null }
}

/**
 * 페이월 위에 놓을 도입부.
 *
 * 전자상거래법 제17조상 미리보기를 제공하지 않으면 청약철회 제한이 무효가 되므로
 * 본문 일부는 반드시 노출해야 한다. 다만 **서버에서 잘라낸 분량만** 응답에 담는다.
 * 전문을 보내고 CSS로 가리는 것과는 전혀 다른 일이다.
 */
export async function getLeadExcerpt(doc: AccessInput, maxChars = 600): Promise<string> {
  if (!isPublished(doc) || doc.rights_tier === 'C' || doc.rights_tier === 'D') return ''

  const body = await readBodyAsAdmin(doc.slug)
  if (!body) return ''

  const lead = leadParagraphs(body, 2)
  return lead.length > maxChars ? `${lead.slice(0, maxChars).trimEnd()}…` : lead
}

/** 첨부 파일 하나에 대한 판정. /api/files/[id] 가 호출한다. */
export async function canDownload(doc: AccessInput, isPublicAttachment: boolean) {
  if (isPublicAttachment && isPublished(doc) && doc.rights_tier !== 'C' && doc.rights_tier !== 'D') {
    return { allowed: true, reason: 'free' as AccessReason }
  }
  const decision = await resolveAccess(doc)
  return { allowed: decision.canRead, reason: decision.reason }
}

/**
 * 판정을 통과한 뒤에만 호출한다. 이 함수는 권한을 확인하지 않는다.
 * 그래서 export 하지 않는다 — 호출자는 이 파일 안에만 존재한다.
 */
async function readBodyAsAdmin(slug: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const { data } = await createAdminClient()
    .from('documents')
    .select('body_md')
    .eq('slug', slug)
    .maybeSingle()
  return (data?.body_md as string | null) ?? null
}
