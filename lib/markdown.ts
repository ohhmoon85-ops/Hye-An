import { Marked } from 'marked'

/**
 * Markdown → HTML.
 *
 * 표는 각각 가로 스크롤 컨테이너에 감싼다. 페이지 본문이 통째로 가로
 * 스크롤되면 모바일에서 읽을 수 없기 때문이다.
 *
 * 입력은 관리자가 직접 쓴 원고뿐이므로 원시 HTML을 허용하되, 스크립트만
 * 제거한다. 사용자 투고를 받게 되면 이 지점에 정식 새니타이저를 넣는다.
 */
const marked = new Marked({ gfm: true, breaks: false })

const SCRIPT_TAG = /<script\b[^>]*>[\s\S]*?<\/script>/gi
const EVENT_ATTR = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi

export function renderMarkdown(md: string | null | undefined): string {
  if (!md) return ''
  const html = marked.parse(md, { async: false }) as string
  return wrapTables(html).replace(SCRIPT_TAG, '').replace(EVENT_ATTR, '')
}

function wrapTables(html: string): string {
  return html.replace(
    /<table>([\s\S]*?)<\/table>/g,
    '<div class="table-scroll"><table>$1</table></div>'
  )
}

/** 본문 도입부만 노출할 때 사용 — 페이월 위에 놓는 미리보기 */
export function leadParagraphs(md: string | null | undefined, count = 3): string {
  if (!md) return ''
  const blocks = md.split(/\n{2,}/)
  const picked: string[] = []
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    picked.push(trimmed)
    // 제목 줄은 문단 수에 넣지 않는다
    if (!trimmed.startsWith('#') && picked.filter((b) => !b.startsWith('#')).length >= count) break
  }
  return picked.join('\n\n')
}

/** 검색엔진 메타 설명·목록 한 줄 요약용 평문 */
export function toPlainText(md: string | null | undefined, max = 160): string {
  if (!md) return ''
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
