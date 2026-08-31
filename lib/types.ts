export type UserRole = 'reader' | 'admin'
export type DocType = 'brief' | 'report' | 'archive' | 'series'
export type RightsTier = 'A' | 'B' | 'C' | 'D'
export type AccessLevel = 'free' | 'member' | 'institution'
export type AttachmentKind = 'pdf' | 'pptx' | 'hwpx' | 'docx' | 'image' | 'other'

export type Category = {
  id: number
  slug: string
  name_ko: string
  name_en: string | null
  sort_order: number
}

/** 목록·카드에 필요한 만큼. body_md 는 어떤 경우에도 여기 담기지 않는다. */
export type DocumentSummary = {
  id: string
  slug: string
  doc_no: string | null
  title: string
  subtitle: string | null
  summary_md: string
  method: string | null   // 'AI 보조 작성 · 저자 검증' 등. 문건 하단에 표기한다.
  doc_type: DocType
  rights_tier: RightsTier
  access_level: AccessLevel
  published_at: string | null
  free_until: string | null
  tags: string[]
  view_count: number
  categories: Pick<Category, 'slug' | 'name_ko' | 'name_en'> | null
}

/**
 * 관리자 화면 전용. 미발행·C·D 등급과 본문을 포함한다.
 * 이 타입이 붙은 데이터는 service_role 로 읽은 것이며, 관리자 화면 밖으로
 * 나가서는 안 된다.
 */
export type DocumentAdminRow = DocumentSummary & {
  body_md: string | null
  source_path: string | null
  category_id: number | null
  updated_at: string
}

export type Attachment = {
  id: string
  document_id: string
  kind: AttachmentKind
  filename: string
  bytes: number | null
  is_public: boolean
  sort_order: number
}

export type Profile = {
  id: string
  email: string
  name: string | null
  org: string | null
  role: UserRole
}

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  brief: '브리프',
  report: '보고서',
  archive: '원자료',
  series: '연재',
}

export const RIGHTS_TIER_LABEL: Record<RightsTier, string> = {
  A: 'A · 저자 저작',
  B: 'B · 정부 공개원문',
  C: 'C · 타인 저작 (비공개)',
  D: 'D · 내부 문서 (영구 비공개)',
}

export const ACCESS_LEVEL_LABEL: Record<AccessLevel, string> = {
  free: '무료 공개',
  member: '멤버십',
  institution: '기관',
}

/** C·D 등급은 발행할 수 없다. UI·서버 액션·DB 제약 세 곳에서 함께 막는다. */
export const PUBLISHABLE_TIERS: RightsTier[] = ['A', 'B']

export function isPublishable(tier: RightsTier): boolean {
  return PUBLISHABLE_TIERS.includes(tier)
}
