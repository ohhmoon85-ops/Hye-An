/**
 * 공유 카드 이미지(og:image)를 만들어 app/opengraph-image.png 로 저장한다.
 *
 *   node scripts/build-og-image.mjs
 *
 * 결과물을 저장소에 커밋하므로 운영에서는 폰트를 내려받지도, 이미지를
 * 생성하지도 않는다. 브랜드 표기가 바뀔 때만 다시 돌리면 된다.
 *
 * 카카오톡 모바일은 og:image 가 없으면 미리보기 카드를 아예 접는다.
 * (PC 판은 제목·설명만으로도 카드를 그려서 문제가 늦게 드러난다.)
 */

import { writeFileSync } from 'node:fs'
import { createElement as h } from 'react'
import { ImageResponse } from 'next/og.js'

const FONT_URL =
  'https://fonts.gstatic.com/s/gowunbatang/v12/ijwNs5nhRMIjYsdSgcMa3wRZ4J7awg.ttf'

const INK = '#141E1C'
const GROUND = '#F2F4F1'
const BRASS = '#CBA765'
const ACCENT = '#5FA898'

const font = Buffer.from(await (await fetch(FONT_URL)).arrayBuffer())

/** 낙관 형식 인장 — 사이트의 Seal 컴포넌트와 같은 형태 */
function seal(size) {
  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        border: `${Math.round(size / 20)}px solid ${BRASS}`,
        borderRadius: 4,
        color: BRASS,
        lineHeight: 1,
      },
    },
    h('div', { style: { fontSize: size * 0.4, display: 'flex' } }, '慧'),
    h('div', { style: { fontSize: size * 0.4, display: 'flex', marginTop: size * 0.04 } }, '眼')
  )
}

const card = h(
  'div',
  {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      // 가운데로 모은다. 카카오톡 등이 썸네일을 중앙으로 잘라내도
      // 인장과 매체명이 살아남아야 한다.
      justifyContent: 'center',
      gap: 60,
      background: INK,
      color: GROUND,
      padding: '64px 80px',
      fontFamily: 'Gowun Batang',
    },
  },
  // 위 — 인장과 매체명
  h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 28 } },
    seal(104),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      h('div', { style: { fontSize: 62, fontWeight: 700, lineHeight: 1.1 } }, '혜안'),
      h(
        'div',
        { style: { fontSize: 22, letterSpacing: 8, color: BRASS, marginTop: 10 } },
        'HYEAN'
      )
    )
  ),
  // 아래 — 슬로건과 한 줄 정의
  h(
    'div',
    { style: { display: 'flex', flexDirection: 'column' } },
    h('div', { style: { fontSize: 30, color: ACCENT, marginBottom: 18, display: 'flex' } }, '─'),
    h(
      'div',
      { style: { fontSize: 56, fontWeight: 700, lineHeight: 1.35, display: 'flex' } },
      '현상 너머의 구조를 읽는다'
    ),
    h(
      'div',
      { style: { fontSize: 26, color: '#9AA6A2', marginTop: 20, display: 'flex' } },
      '국제정세·안보전략 분석 저널'
    )
  )
)

const response = new ImageResponse(card, {
  width: 1200,
  height: 630,
  fonts: [{ name: 'Gowun Batang', data: font, weight: 700, style: 'normal' }],
})

const png = Buffer.from(await response.arrayBuffer())
writeFileSync(new URL('../app/opengraph-image.png', import.meta.url), png)
console.log(`app/opengraph-image.png 생성 — ${(png.length / 1024).toFixed(0)}KB`)
