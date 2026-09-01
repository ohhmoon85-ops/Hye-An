import type { Metadata } from 'next'
import Link from 'next/link'
import { Seal } from '@/components/Seal'
import { LoginForm } from '@/components/LoginForm'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: '로그인',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-7 px-5 py-12">
      <Link href="/" className="flex items-center gap-3">
        <Seal size={40} />
        <span>
          <span className="block font-serif text-xl font-bold">{SITE.name}</span>
          <span className="block font-mono text-[0.6rem] tracking-[0.18em] text-ink-faint">
            {SITE.nameEn}
          </span>
        </span>
      </Link>

      <div>
        <h1 className="font-serif text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          이메일로 접속 링크를 보낸다. 비밀번호는 쓰지 않는다.
        </p>
      </div>

      <LoginForm />

      <p className="font-mono text-[0.65rem] leading-relaxed text-ink-faint">
        로그인하면{' '}
        <Link href="/terms" className="text-accent hover:underline">
          이용약관
        </Link>
        과{' '}
        <Link href="/privacy" className="text-accent hover:underline">
          개인정보 처리방침
        </Link>
        에 동의하는 것으로 본다. 수집 항목은 이메일과 접속기록이며, 접속 IP는 되돌릴 수 없는
        해시로만 보관한다. 비밀번호는 쓰지 않는다.
      </p>
    </div>
  )
}
