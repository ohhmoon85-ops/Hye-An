import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Seal } from '@/components/Seal'
import { getCurrentProfile, hasSupabaseEnv } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata = { title: '발행 도구', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) redirect('/')

  // 최종 판정은 여기서 한 번. 미들웨어의 통과 여부에 의존하지 않는다.
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?next=/admin')
  if (profile.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Seal size={26} />
            <span className="font-mono text-xs tracking-[0.15em] text-brass uppercase">
              발행 도구
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-5 text-sm">
            <Link href="/admin" className="hover:text-accent">
              문건
            </Link>
            <Link href="/admin/new" className="hover:text-accent">
              새 문건
            </Link>
            <Link href="/" className="font-mono text-[0.7rem] text-ink-faint hover:text-accent">
              사이트 보기 →
            </Link>
            <span className="font-mono text-[0.65rem] text-ink-faint">{profile.email}</span>
          </nav>
        </div>
      </header>
      <main className="flex-1 pb-16">{children}</main>
    </div>
  )
}
