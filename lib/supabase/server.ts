import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Profile } from '@/lib/types'

/**
 * Supabase 프로젝트를 아직 연결하지 않은 상태에서도 골격을 띄울 수 있게 한다.
 * 설정 전에는 목록이 빈 채로 렌더되고, 화면에 안내가 뜬다.
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`환경변수 ${name} 가 설정되지 않았다. .env.local.example 참조.`)
  return value
}

/**
 * 요청자의 세션으로 동작하는 클라이언트. RLS가 그대로 걸린다.
 * 공개 데이터 조회와 권한 판정 RPC 호출에 사용한다.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    env('NEXT_PUBLIC_SUPABASE_URL'),
    env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Component 에서는 쿠키를 쓸 수 없다. 세션 갱신은
            // middleware.ts 가 담당하므로 여기서는 무시해도 안전하다.
          }
        },
      },
    }
  )
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!hasSupabaseEnv()) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, email, name, org, role')
    .eq('id', user.id)
    .maybeSingle()

  return (data as Profile) ?? null
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    throw new Error('관리자 권한이 필요하다.')
  }
  return profile
}
