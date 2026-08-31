const KST = 'Asia/Seoul'

/** 2026.08.31 — 목록·메타 표기 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}.${get('month')}.${get('day')}`
}

/** 2026-08-31 — <time datetime> 속성용 */
export function isoDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toISOString().slice(0, 10)
}

/** 남은 무료 공개 기간 — "무료 공개 6일 남음" */
export function daysLeft(until: string | null | undefined): number | null {
  if (!until) return null
  const ms = new Date(until).getTime() - Date.now()
  if (ms <= 0) return null
  return Math.ceil(ms / 86_400_000)
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)}${units[unit]}`
}

export function formatKrw(won: number): string {
  return new Intl.NumberFormat('ko-KR').format(won)
}
