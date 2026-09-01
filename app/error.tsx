'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Seal } from '@/components/Seal'

/**
 * 서버 컴포넌트가 예외를 던졌을 때의 화면. DB 장애가 대표적이다.
 * 이용자에게는 상황과 다음 행동만 알린다 — 예외 내용은 노출하지 않는다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
      <Seal size={52} />
      <div>
        <p className="font-mono text-[0.7rem] tracking-[0.2em] text-ink-faint uppercase">Error</p>
        <h1 className="mt-2 font-serif text-2xl font-bold">화면을 불러오지 못했다</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
          일시적인 문제일 수 있다. 잠시 뒤 다시 시도해 보고, 계속되면 아래 주소로 알려주기 바란다.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <button
          type="button"
          onClick={reset}
          className="bg-accent px-5 py-2.5 font-medium text-ground transition-opacity hover:opacity-90"
        >
          다시 시도
        </button>
        <Link href="/" className="text-accent hover:underline">
          첫 화면
        </Link>
      </div>

      {error.digest && (
        <p className="font-mono text-[0.65rem] text-ink-faint">참조 번호 {error.digest}</p>
      )}
    </div>
  )
}
