import 'server-only'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasSupabaseEnv } from '@/lib/supabase/server'

/**
 * 접속 기록. 원본 IP는 저장하지 않고 해시만 남긴다 (개인정보 처리방침 고지 항목).
 * 남용 탐지와 기관 정산 근거로만 쓴다.
 */
export async function logAccess(params: {
  documentId: string
  userId: string | null
  action: 'view' | 'download'
}) {
  if (!hasSupabaseEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return

  try {
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
    const salt = process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 16)
    const ipHash = ip ? createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32) : null

    const admin = createAdminClient()
    await admin.from('access_logs').insert({
      document_id: params.documentId,
      user_id: params.userId,
      action: params.action,
      ip_hash: ipHash,
    })

    if (params.action === 'view') {
      await admin.rpc('increment_view_count', { doc_id: params.documentId })
    }
  } catch {
    // 기록 실패가 열람을 막아서는 안 된다.
  }
}
