import Link from 'next/link'
import { Seal } from '@/components/Seal'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-5 px-5 text-center">
      <Seal size={56} />
      <div>
        <p className="font-mono text-[0.7rem] tracking-[0.2em] text-ink-faint uppercase">404</p>
        <h1 className="mt-2 font-serif text-2xl font-bold">그 문건은 없다</h1>
        <p className="mt-2 text-sm text-ink-soft">
          주소가 바뀌었거나, 아직 공개되지 않은 문건이다.
        </p>
      </div>
      <div className="flex gap-4 text-sm">
        <Link href="/" className="text-accent hover:underline">
          첫 화면
        </Link>
        <Link href="/archive" className="text-accent hover:underline">
          아카이브 검색
        </Link>
      </div>
    </div>
  )
}
