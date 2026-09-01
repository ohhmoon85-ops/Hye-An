/**
 * 환경변수의 **형태**를 검사한다.
 *
 * 값이 비어 있는지만 보면, 엉뚱한 값이 들어갔을 때 조용히 빈 사이트가 된다.
 * 실제로 NEXT_PUBLIC_SUPABASE_URL 자리에 사이트 주소가 들어간 적이 있는데,
 * 모든 조회가 우리 사이트 자신에게 요청을 보내 문건이 0건으로 보였고
 * 화면만으로는 원인을 알 수 없었다. 이름이 비슷한 변수가 둘 있으니
 * (SUPABASE_URL / SITE_URL) 다시 일어날 수 있는 실수다.
 */

export type EnvProblem = { key: string; reason: string }

const SUPABASE_HOST = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/
const LOCAL_HOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

function looksLikeKey(value: string): boolean {
  // 구형 anon 키는 3조각 JWT, 신형 공개 키는 sb_publishable_ 접두사
  if (value.startsWith('sb_publishable_')) return true
  return value.startsWith('eyJ') && value.split('.').length === 3
}

export function supabaseEnvProblems(): EnvProblem[] {
  const problems: EnvProblem[] = []
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    problems.push({ key: 'NEXT_PUBLIC_SUPABASE_URL', reason: '비어 있다' })
  } else if (!SUPABASE_HOST.test(url) && !LOCAL_HOST.test(url)) {
    problems.push({
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      reason: `'.supabase.co' 로 끝나야 한다. 사이트 주소를 넣지 않았는지 확인한다 (그건 NEXT_PUBLIC_SITE_URL 이다). 지금 값: ${url}`,
    })
  }

  if (!key) {
    problems.push({ key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', reason: '비어 있다' })
  } else if (!looksLikeKey(key)) {
    problems.push({
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      reason: `키 형식이 아니다. 앞 글자가 잘리지 않았는지 확인한다 (JWT 는 'eyJ' 로 시작한다). 지금 값의 앞부분: ${key.slice(0, 12)}…`,
    })
  }

  return problems
}

/** 형태까지 올바를 때만 true. 하나라도 어긋나면 '연결 전'으로 취급한다. */
export function hasValidSupabaseEnv(): boolean {
  return supabaseEnvProblems().length === 0
}
