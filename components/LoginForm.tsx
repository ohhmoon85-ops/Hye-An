'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setState('error')
      setMessage(error.message)
      return
    }
    setState('sent')
  }

  if (state === 'sent') {
    return (
      <div className="border border-accent bg-accent-soft px-5 py-4">
        <p className="font-mono text-[0.7rem] tracking-[0.15em] text-accent uppercase">전송됨</p>
        <p className="mt-1.5 text-sm text-ink-soft">
          <strong className="font-medium">{email}</strong> 으로 접속 링크를 보냈다. 메일함을 확인한다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="이메일 주소"
        className="w-full border border-rule bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full bg-accent px-4 py-2.5 text-sm font-medium text-ground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {state === 'sending' ? '보내는 중…' : '접속 링크 받기'}
      </button>
      {state === 'error' && <p className="text-sm text-brass">{message}</p>}
    </form>
  )
}
