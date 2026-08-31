/**
 * 한글을 살린 슬러그. URL에서는 인코딩되지만, 가독성과 검색 유입에 유리하다.
 * ('use server' 파일은 async 함수만 내보낼 수 있어 이 파일로 분리했다.)
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
