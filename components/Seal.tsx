/**
 * 인장(印章). 그림 심볼 대신 낙관 형식으로 간다 —
 * 문서에 찍히는 인장이 곧 이 서비스가 파는 것(책임지고 서명된 판단)의 은유다.
 * 파비콘·워터마크·PDF 헤더에 같은 형태로 재사용한다.
 */
export function Seal({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`seal ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        borderWidth: Math.max(1, size / 22),
      }}
    >
      <span style={{ display: 'block', marginTop: size * -0.02 }}>慧</span>
      <span style={{ display: 'block', marginTop: size * -0.06 }}>眼</span>
    </span>
  )
}
