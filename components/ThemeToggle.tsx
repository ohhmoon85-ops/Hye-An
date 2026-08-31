'use client'

import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'hyean-theme'
const LABEL: Record<Theme, string> = { light: '밝게', dark: '어둡게', system: '시스템' }

/**
 * 테마는 React 상태가 아니라 <html data-theme> 에 산다 (첫 페인트 전에
 * ThemeScript 가 심는다). 그래서 상태를 복제하지 않고 DOM을 외부 저장소로 읽는다.
 */
let listeners: Array<() => void> = []

function subscribe(callback: () => void) {
  listeners.push(callback)
  return () => {
    listeners = listeners.filter((l) => l !== callback)
  }
}

function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute('data-theme')
  return attr === 'dark' || attr === 'light' ? attr : 'system'
}

function setTheme(next: Theme) {
  if (next === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', next)

  try {
    if (next === 'system') window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* 사생활 보호 모드에서는 저장이 막힐 수 있다. 화면 전환은 그대로 동작한다. */
  }

  for (const listener of listeners) listener()
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'system' as Theme)
  const next: Theme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="font-mono text-[0.7rem] tracking-wide text-ink-faint transition-colors hover:text-accent"
      aria-label={`화면 밝기 — 현재 ${LABEL[theme]}`}
      title={`화면 밝기 — 현재 ${LABEL[theme]}`}
    >
      {LABEL[theme]}
    </button>
  )
}

/**
 * 첫 페인트 전에 저장된 선택을 적용해 깜빡임을 없앤다.
 * 저장된 값이 없으면 아무것도 하지 않고 prefers-color-scheme 에 맡긴다.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
