import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * 세션 쿠키 갱신. Server Component 에서는 쿠키를 쓸 수 없으므로
 * 갱신은 여기서만 일어난다.
 *
 * 관리자 화면 접근 차단은 이 계층에 맡기지 않는다 — 최종 판정은
 * app/admin/layout.tsx 가 DB의 role 을 직접 확인해서 한다.
 */
export default async function proxy(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    // 정적 자원과 이미지 최적화 요청은 건너뛴다
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
