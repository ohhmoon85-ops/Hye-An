/**
 * 절대 규칙이 실제 DB에서 지켜지는지 검사한다.
 *
 *   npm run verify:security
 *
 * 스키마를 바꾼 뒤에는 반드시 돌린다. 0001 에서 컬럼 단위 revoke 가
 * 아무 효과가 없었는데도 아무도 몰랐던 일이 있었다 — 코드 리뷰로는
 * 잡히지 않고, 실제 DB에 물어봐야만 드러나는 종류의 결함이다.
 */

import { readFileSync } from 'node:fs'

function loadEnv() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m) env[m[1]] = m[2]
  }
  return env
}

const env = loadEnv()
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!URL_BASE || !ANON) {
  console.error('.env.local 에 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 가 없다.')
  process.exit(1)
}

const headers = { apikey: ANON, Authorization: `Bearer ${ANON}` }

async function rest(path) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, { headers })
  return { status: res.status, body: await res.text() }
}

async function rpc(fn, args) {
  const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  return { status: res.status, body: await res.text() }
}

const results = []
function check(name, passed, detail = '') {
  results.push({ name, passed, detail })
  console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

console.log('\n혜안 · 보안 규칙 검증')
console.log(`대상 ${URL_BASE}\n`)

console.log('절대규칙 1 — 본문은 권한 통과 시에만 나간다')

{
  const r = await rest('documents?select=slug,body_md&limit=1')
  check('익명이 body_md 를 직접 요구하면 거부된다', r.status >= 400, `HTTP ${r.status}`)
}
{
  const r = await rest('documents?select=*&limit=1')
  const leaked = r.status === 200 && r.body.includes('body_md')
  check('select=* 로 우회할 수 없다', !leaked, `HTTP ${r.status}`)
}
{
  const r = await rest('documents?select=slug,summary_md&limit=1')
  check('요약과 메타는 정상 조회된다', r.status === 200, `HTTP ${r.status}`)
}
{
  const r = await rpc('get_document_body', { doc_slug: 'archive-nss-2025-original' })
  const ok = r.status === 200 && r.body !== 'null' && r.body.length > 10
  check('무료 문건의 본문은 RPC 로 나온다', ok, ok ? '' : '표본 문건이 없으면 무시')
}
{
  const r = await rpc('get_document_body', { doc_slug: 'octa-2026-transition' })
  check('권한 없는 멤버십 문건 본문은 null 이다', r.body.trim() === 'null')
}

console.log('\n절대규칙 2·콘텐츠 등급 — C·D 등급과 미발행은 드러나지 않는다')

{
  const r = await rest('documents?select=slug,rights_tier')
  const rows = r.status === 200 ? JSON.parse(r.body) : []
  const bad = rows.filter((d) => d.rights_tier === 'C' || d.rights_tier === 'D')
  check('목록에 C·D 등급이 없다', bad.length === 0, bad.map((d) => d.slug).join(', '))
}
{
  const r = await rest('documents?slug=eq.draft-internal-note&select=slug')
  check('D등급을 직접 지목해도 빈 결과다', r.body.trim() === '[]')
}
{
  const r = await rpc('get_document_body', { doc_slug: 'draft-internal-note' })
  check('D등급 본문은 null 이다', r.body.trim() === 'null')
}

console.log('\n절대규칙 3 — Storage 는 private, 경로도 내보내지 않는다')

{
  const r = await rest('attachments?select=id,storage_path&limit=1')
  check('익명이 storage_path 를 읽을 수 없다', r.status >= 400, `HTTP ${r.status}`)
}
{
  const r = await fetch(`${URL_BASE}/storage/v1/object/public/documents/`, { headers })
  check('공개 버킷 경로가 열려 있지 않다', r.status >= 400, `HTTP ${r.status}`)
}

console.log('\n권한 테이블 — 클라이언트가 스스로 권한을 만들 수 없다')

{
  const res = await fetch(`${URL_BASE}/rest/v1/entitlements`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000', scope: 'all', source: 'grant' }),
  })
  check('익명이 entitlements 를 삽입할 수 없다', res.status >= 400, `HTTP ${res.status}`)
}

const failed = results.filter((r) => !r.passed)
console.log(`\n${results.length - failed.length}/${results.length} 통과`)

if (failed.length > 0) {
  console.error(`\n실패 ${failed.length}건:`)
  for (const f of failed) console.error(`  · ${f.name}`)
  process.exit(1)
}
console.log('모든 규칙이 지켜지고 있다.\n')
