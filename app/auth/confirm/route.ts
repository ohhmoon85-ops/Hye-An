import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * 이메일 링크를 **서버에서** 세션으로 바꾼다.
 *
 * /auth/callback 은 PKCE 흐름 전용이다. 브라우저가 시작한 로그인만 처리할 수
 * 있는데, 그때 저장해 둔 code_verifier 가 있어야 `?code=` 를 교환할 수 있기
 * 때문이다. 관리자 API로 만든 링크나 서버에서 발급한 링크는 PKCE 가 아니라
 * 토큰이 URL 프래그먼트(#access_token=...)로 돌아오고, 프래그먼트는 서버로
 * 전송되지 않아 콜백이 code 를 찾지 못한다.
 *
 * 이 경로는 token_hash 를 받아 verifyOtp 로 직접 검증하므로 code_verifier 가
 * 필요 없다. Supabase 가 서버 사이드 인증에 권장하는 방식이다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/admin'

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
