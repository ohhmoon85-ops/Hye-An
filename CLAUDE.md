# 혜안 (HYEAN) — 프로젝트 지침

이 파일은 Claude Code가 매 세션 자동으로 읽는 프로젝트 규칙이다.
전체 기획 배경은 `docs/PLAN.md`, DB 스키마는 `supabase/schema.sql`을 참조한다.

---

## 무엇을 만드는가

국제정세·안보전략 분석 문건 253건을 유료 구독으로 제공하는 콘텐츠 플랫폼.
운영자는 1인(저자 겸 관리자)이다. **기능을 늘리지 말고 읽기·검색·결제 세 가지를 흠 없이 만든다.**

- 서비스명: 혜안 (慧眼) / 영문 HYEAN
- 도메인: hyean.kr
- 서명: 개인명을 노출하지 않는다. 바이라인·인용 서식·구조화 데이터의 저자는 모두 매체명 '혜안'으로 통일한다 (`lib/site.ts`의 `SITE.name`)

---

## 기술 스택 (변경 금지)

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript | Pages Router 사용 금지 |
| 호스팅 | Vercel Pro | Hobby는 상업적 이용 불가 |
| DB / 인증 / 스토리지 | Supabase (Postgres + Auth + Storage) | Pro 플랜 |
| 스타일 | Tailwind CSS | CSS 변수로 토큰 정의 후 Tailwind에서 참조 |
| 결제 | 토스페이먼츠 빌링키 (정기결제) | 1순위. 포트원은 확장 시 |
| 예약 작업 | Supabase `pg_cron` | 정기 청구 스케줄러 |
| 이메일 | Resend | 발행 알림·결제 통지 |

---

## 절대 규칙

### 1. 본문은 서버에서만 판정한다
유료 본문(`documents.body_md`)을 클라이언트로 보낸 뒤 CSS(`blur`, `max-height`, `overflow:hidden`)로
가리는 구현은 **금지**한다. 개발자도구로 즉시 뚫린다.

- 권한 판정은 Server Component 또는 Route Handler에서 수행한다.
- 권한이 없으면 본문을 **응답 페이로드에 아예 담지 않는다**.
- 판정 로직은 `lib/entitlement.ts`의 단일 함수로만 구현하고, 다른 곳에서 중복 구현하지 않는다.

### 2. 권한은 `entitlements` 테이블만 조회한다
`subscriptions.status`를 직접 보고 접근을 허용하지 말 것.
구독·기관 라이선스·무료 체험·기자단 계정이 모두 `entitlements` 한 겹으로 수렴해야
나중에 코드 수정 없이 정책을 추가할 수 있다.

### 3. Storage는 항상 private 버킷
공개 URL을 생성하지 않는다. 파일 접근은 `/api/files/[id]`에서 권한 확인 후
**유효기간 60초 Signed URL**을 발급한다.

### 4. 요약은 공개, 본문은 비공개
`summary_md`는 검색엔진 색인을 **허용해야 한다** (유입 경로이자, 전자상거래법상 미리보기 제공 요건).
구조화 데이터에 `schema.org/Article` + `isAccessibleForFree: false`를 넣는다.

### 5. 해지는 1클릭
계정 페이지에 해지 버튼을 숨기지 않는다. 해지해도 **결제 기간 만료일까지 열람은 유지**한다.

### 6. 카드 정보를 서버에 저장하지 않는다
빌링키만 암호화 저장한다. 카드번호·CVC는 어떤 형태로도 자사 DB에 남기지 않는다.

---

## 디자인 토큰

먹빛 청록(靑綠) + 황동(黃銅). 정부기관 사이트의 관성적인 남색을 쓰지 않는다.

```css
/* light */
--ink:#141E1C; --ground:#F2F4F1; --surface:#FFFFFF;
--accent:#1D4E46; --brass:#8C6D33; --rule:#D3DAD5;
/* dark */
--ink:#E8ECE9; --ground:#0D1312; --surface:#151D1B;
--accent:#5FA898; --brass:#CBA765; --rule:#26312E;
```

서체 (모두 Google Fonts, 무료):
- 제목·인용 — `Gowun Batang`
- 본문 — `IBM Plex Sans KR`
- 수치·라벨·문서번호 — `IBM Plex Mono`

레이아웃 원칙:
- 모바일 우선. 본문 폭 68자 고정.
- 표·도표는 각각 `overflow-x:auto` 컨테이너에 넣는다. 페이지 본문이 가로로 스크롤되면 안 된다.
- 페이월은 **화면 하단 고정 바가 아니라 본문 흐름 안에** 배치한다 (iOS 사파리 주소창 충돌).
- 다크 모드는 `prefers-color-scheme` + `data-theme` 양방향 모두 지원한다.

---

## 디렉터리 구조

```
app/
  (public)/          홈 · 목록 · about · pricing
  doc/[slug]/        문건 상세 — RSC에서 권한 판정
  archive/           전체 카탈로그 · 필터 · 전문검색
  account/           구독 관리 (인증 필요)
  admin/             발행 도구 (role=admin)
  api/
    payments/webhook/  결제 웹훅
    files/[id]/        Signed URL 발급
lib/
  supabase/          server.ts · client.ts
  entitlement.ts     열람 권한 단일 판정 함수
  watermark.ts       PDF 개인화 워터마크
components/
supabase/migrations/ SQL 마이그레이션 (버전 관리)
```

---

## 콘텐츠 등급 (`documents.rights_tier`)

문건마다 저작권 지위가 다르다. 이 필드를 무시하고 일괄 공개하는 코드를 작성하지 말 것.

| 등급 | 대상 | 기본 처리 |
|---|---|---|
| `A` | 저자 본인 작성 분석보고서 | 유료 공개 |
| `B` | 미 정부 공개 원문 (NSS, NDS, Project 2025) | 무료 공개. 과금 대상 아님 |
| `C` | 타인 명의 저작 (타 저자 기조연설·공저 원고·기업 자료) | **비공개**. 동의 확보 후 수동 해제 |
| `D` | 내부 문서 (서한, 미완 초안, 팀 과제) | 영구 비공개 |

`C`·`D`는 관리자 UI에서도 실수로 공개되지 않도록 발행 버튼을 비활성화한다.

---

## 개발 순서

지금 어느 단계인지 확인하고, 앞 단계가 끝나지 않았으면 뒤 단계를 먼저 만들지 않는다.

1. **발행 기반 (4주)** — 스키마, 관리자 발행 도구, 홈·목록·상세, 전 문건 무료 공개, SEO
2. **과금 (4주)** — 인증, 페이월, 빌링키 연동, 계정·해지, 약관
3. **아카이브 완성 (6주)** — 253건 등록, 워터마크 다운로드, 전문검색, 이메일 알림
4. **확장** — 기관 라이선스, 스폰서십, 영문 요약

---

## 작업 규칙

- 마이그레이션은 반드시 `supabase/migrations/`에 SQL 파일로 남긴다. 대시보드에서 직접 수정하지 않는다.
- 환경변수는 `.env.local`에 두고 절대 커밋하지 않는다. `SUPABASE_SERVICE_ROLE_KEY`는 서버 코드에서만 사용한다.
- 새 패키지를 추가하기 전에 표준 라이브러리나 이미 설치된 패키지로 가능한지 먼저 확인한다.
- 커밋 메시지는 한국어로 쓴다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
