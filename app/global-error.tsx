'use client'

/**
 * 루트 레이아웃 자체가 무너졌을 때의 최후 화면.
 * 이 경우 layout.tsx 가 렌더되지 않으므로 html·body 를 직접 그린다.
 * 폰트와 토큰도 못 쓰는 상황이라 스타일을 인라인으로 최소한만 둔다.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: '#F2F4F1',
          color: '#141E1C',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1.25rem',
        }}
      >
        <div>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: '#8C6D33' }}>혜안 慧眼</p>
          <h1 style={{ fontSize: '1.4rem', margin: '0.75rem 0 0.5rem' }}>
            화면을 불러오지 못했다
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#4a5451', margin: 0 }}>
            잠시 뒤 다시 시도해 주기 바란다.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.65rem 1.25rem',
              border: 0,
              background: '#1D4E46',
              color: '#F2F4F1',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
