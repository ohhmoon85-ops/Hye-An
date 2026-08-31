/**
 * Supabase 를 아직 연결하지 않았을 때만 나타난다. 운영 환경에서는 보이지 않는다.
 */
export function SetupNotice() {
  return (
    <div className="border-b border-brass bg-brass-soft">
      <div className="mx-auto max-w-5xl px-5 py-4">
        <p className="font-mono text-[0.7rem] tracking-[0.15em] text-brass uppercase">Setup</p>
        <p className="mt-1.5 text-sm text-ink-soft">
          Supabase 연결 전이라 문건 목록이 비어 있다.{' '}
          <code className="font-mono text-xs">.env.local.example</code> 을{' '}
          <code className="font-mono text-xs">.env.local</code> 로 복사해 키를 채우고,{' '}
          <code className="font-mono text-xs">supabase/migrations/0001_init.sql</code> 을 적용한다.
        </p>
      </div>
    </div>
  )
}
