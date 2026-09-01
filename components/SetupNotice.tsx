import { supabaseEnvProblems } from '@/lib/supabase/env'

/**
 * 환경변수가 없거나 형태가 어긋날 때만 나타난다.
 * 무엇이 왜 잘못됐는지까지 적는다 — 빈 사이트만 보고 원인을 추측하게 두지 않는다.
 */
export function SetupNotice() {
  const problems = supabaseEnvProblems()

  return (
    <div className="border-b border-brass bg-brass-soft">
      <div className="mx-auto max-w-5xl px-5 py-4">
        <p className="font-mono text-[0.7rem] tracking-[0.15em] text-brass uppercase">Setup</p>

        {problems.length === 0 ? (
          <p className="mt-1.5 text-sm text-ink-soft">
            Supabase 연결 전이라 문건 목록이 비어 있다.{' '}
            <code className="font-mono text-xs">.env.local.example</code> 을{' '}
            <code className="font-mono text-xs">.env.local</code> 로 복사해 키를 채우고,{' '}
            <code className="font-mono text-xs">supabase/migrations/</code> 를 적용한다.
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-ink-soft">
              환경변수가 올바르지 않아 문건을 불러오지 못한다. 고친 뒤 <strong>빌드 캐시를 쓰지
              않고</strong> 다시 배포해야 반영된다 — <code className="font-mono text-xs">NEXT_PUBLIC_</code>{' '}
              변수는 빌드 시점에 번들로 구워지기 때문이다.
            </p>
            <ul className="mt-3 space-y-1.5">
              {problems.map((p) => (
                <li key={p.key} className="text-sm leading-relaxed text-ink-soft">
                  <code className="font-mono text-xs text-brass">{p.key}</code>
                  <span className="mx-1.5 text-ink-faint">—</span>
                  <span className="break-all">{p.reason}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
