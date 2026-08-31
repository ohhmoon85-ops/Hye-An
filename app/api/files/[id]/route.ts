import { NextResponse } from 'next/server'
import { createAdminClient, STORAGE_BUCKET } from '@/lib/supabase/admin'
import { canDownload } from '@/lib/entitlement'
import { getCurrentProfile, hasSupabaseEnv } from '@/lib/supabase/server'
import { logAccess } from '@/lib/access-log'

export const dynamic = 'force-dynamic'

/** Signed URL 유효기간(초). 링크를 퍼 나르지 못할 만큼 짧게 둔다. */
const SIGNED_URL_TTL = 60

/**
 * 첨부 파일 접근의 유일한 통로.
 * 버킷은 private 이고 공개 URL은 어디에서도 만들지 않는다.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!hasSupabaseEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const admin = createAdminClient()

  const { data: file } = await admin
    .from('attachments')
    .select('id, storage_path, filename, is_public, document_id')
    .eq('id', id)
    .maybeSingle()

  if (!file) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { data: doc } = await admin
    .from('documents')
    .select('slug, rights_tier, access_level, published_at, free_until')
    .eq('id', file.document_id)
    .maybeSingle()

  if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const decision = await canDownload(doc, file.is_public)
  if (!decision.allowed) {
    // 존재 여부까지 감출 필요는 없다. 무엇이 왜 막혔는지는 알려준다.
    return NextResponse.json(
      { error: decision.reason === 'restricted' ? 'not_found' : 'forbidden' },
      { status: decision.reason === 'restricted' ? 404 : 403 }
    )
  }

  const { data: signed, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_TTL, { download: file.filename })

  if (error || !signed) {
    return NextResponse.json({ error: 'signing_failed' }, { status: 500 })
  }

  const profile = await getCurrentProfile()
  await logAccess({ documentId: file.document_id, userId: profile?.id ?? null, action: 'download' })

  return NextResponse.redirect(signed.signedUrl, {
    status: 302,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
