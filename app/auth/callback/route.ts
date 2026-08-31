import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** 이메일 접속 링크(매직 링크)의 코드를 세션으로 교환한다. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'

  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`)

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  return NextResponse.redirect(`${origin}${next}`)
}
