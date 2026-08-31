'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * 브라우저 클라이언트. 로그인·로그아웃 등 인증 흐름에만 쓴다.
 * 문건 본문은 절대 여기서 가져오지 않는다 — 판정은 서버에서만 한다.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
