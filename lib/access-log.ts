import 'server-only'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasSupabaseEnv } from '@/lib/supabase/server'

/**
 * 접속 기록. 원본 IP는 저장하지 않고 해시만 남긴다 (개인정보 처리방침 고지 항목).
 * 남용 탐지와 기관 정산 근거로만 쓴다.
 *
 * ★ after() 로 감싼다.
 * 이 작업은 화면을 그리는 데 필요 없으므로 응답을 늦출 이유가 없다. 그렇다고
 * 그냥 await 하지 않고 띄워두면 서버리스에서는 응답 직후 함수가 얼어붙어
 * 기록이 사라진다 (실제로 운영에서 3회 조회 중 1회가 유실됐다).
 * after() 는 응답을 보낸 뒤에도 함수를 살려두어 두 문제를 함께 해결한다.
 *
 * 호출자는 await 하지 않아도 된다 — 이 함수 자체가 즉시 반환한다.
 */
export function logAccess(params: {
  documentId: string
  userId: string | null
  action: 'view' | 'download'
}): void {
  if (!hasSupabaseEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return

  after(async () => {
    try {
      const headerList = await headers()
      const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
      const salt = process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 16)
      const ipHash = ip
        ? createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
        : null

      // 기록과 조회수 증가를 한 번의 왕복으로 끝낸다. 두 번 나눠 부르면
      // 응답 이후에 남은 시간이 모자라 뒤의 것이 잘린다 (0003 마이그레이션 참조).
      await createAdminClient().rpc('record_access', {
        doc_id: params.documentId,
        viewer: params.userId,
        act: params.action,
        ip: ipHash,
      })
    } catch {
      // 기록 실패가 열람을 막아서는 안 된다.
    }
  })
}
