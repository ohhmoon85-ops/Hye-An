import 'server-only'

import { createClient } from '@supabase/supabase-js'

/**
 * service_role 키를 쓰는 클라이언트. RLS를 통과하므로 서버 코드에서만,
 * 그리고 호출 직전에 권한을 확인한 뒤에만 사용한다.
 *
 * 'server-only' import 가 있어 클라이언트 번들에 섞이면 빌드가 깨진다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았다. .env.local 확인.')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents'
