import 'server-only'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasSupabaseEnv } from '@/lib/supabase/server'

/**
 * 접속 기록. 원본 IP는 저장하지 않고 해시만 남긴다 (개인정보 처리방침 고지 항목).
 * 남용 탐지와 기관 정산 근거로 쓰므로 빠짐없이 남아야 한다.
 *
 * ★ 반드시 await 한다.
 * 처음에는 응답을 늦추지 않으려 띄워두었고(void), 그다음엔 next/server 의
 * after() 로 옮겼다. 둘 다 운영에서 기록을 잃었다 — void 는 응답 직후 함수가
 * 얼어붙어 5회 중 2회를 잃었고, after() 는 콜백이 아예 실행되지 않았다.
 *
 * 기록과 조회수 증가를 record_access() 하나로 합쳐 왕복이 1회뿐이고,
 * 함수와 DB 가 같은 리전(서울)에 있어 10~20ms 다. 그 정도면 확실한 쪽이 낫다.
 */
export async function logAccess(params: {
  documentId: string
  userId: string | null
  action: 'view' | 'download'
}): Promise<void> {
  if (!hasSupabaseEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return

  try {
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
    const salt = process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 16)
    const ipHash = ip
      ? createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
      : null

    await createAdminClient().rpc('record_access', {
      doc_id: params.documentId,
      viewer: params.userId,
      act: params.action,
      ip: ipHash,
    })
  } catch {
    // 기록 실패가 열람을 막아서는 안 된다.
  }
}
