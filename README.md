# 혜안 (慧眼 · HYEAN)

국제정세·안보전략 분석 저널. 요약은 공개, 본문은 서버에서 판정한다.

- 기획 배경 — [docs/PLAN.md](docs/PLAN.md)
- 작업 규칙 — [CLAUDE.md](CLAUDE.md)
- 스키마 — [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql)

현재 **1단계 · 발행 기반**. 결제는 아직 붙이지 않았다.

---

## 시작하기

### 1. 의존성

```bash
npm install
```

### 2. Supabase 프로젝트

**혜안은 자기 조직 · 자기 프로젝트를 쓴다.** 두 가지가 다른 이유로 각각 필요하다.

*프로젝트를 따로 쓰는 이유* — 이 스키마는 `public` 에 `profiles` ·
`subscriptions` · `payments` · `plans` 를 만들어 회원제 서비스와 이름이 겹친다.
더 위험한 것은 `handle_new_user()` 와 `is_admin()` 이다. Supabase 공식 튜토리얼이
쓰는 이름이라 남의 프로젝트에 같은 이름이 있을 확률이 높고, `create or replace`
가 **말없이 덮어쓴다**. 그리고 `auth` 스키마는 나눌 수 없어 프로젝트를 공유하면
`auth.users` 도 공유된다 — 한쪽 가입자가 다른 쪽 계정이 되고, 구독자가 쌓인 뒤에
떼어내려면 전원 재가입이다. 기획서 §10 이 PG 빌링키를 두고 경고한 것과 같은
성격의 비용이다.

*조직을 따로 쓰는 이유* — Supabase 과금은 프로젝트가 아니라 **조직 단위**다.
조직 하나에 플랜 하나가 붙고, 추가 프로젝트는 각자 컴퓨트 비용이 붙는다.
다른 서비스와 조직을 공유하면 2단계에서 Pro 로 올릴 때 그 조직의 프로젝트
전부가 과금 대상이 된다. 전용 조직에 두면 Pro 업그레이드가 한 프로젝트
$25/월 로 끝나 기획서 §12 의 고정비 표가 그대로 성립한다.

절차는 조직 생성 → 프로젝트 생성이다. 리전은 독자가 국내이므로
**ap-northeast-2 (Seoul)** 를 고른다.

```bash
npx supabase login          # 브라우저가 열린다. 한 번만 하면 된다
npm run db:link             # 목록에서 hyean 프로젝트를 고른다
npm run db:push             # supabase/migrations/ 를 적용한다
npm run db:seed             # (선택) 개발용 표본 문건까지 함께 넣는다
```

대시보드 SQL 편집기에서 직접 고치지 않는다. 스키마 변경은 항상
`supabase/migrations/` 에 새 파일로 남긴다 — `npm run db:diff <이름>` 이
현재 DB와의 차이를 마이그레이션 파일로 뽑아준다.

> **플랜.** 1단계는 Free 로 진행하고 2단계(과금) 진입 시 혜안 조직만 Pro 로
> 올린다. Free 의 제약은 세 가지다 — 활성 프로젝트 2개, **7일간 요청이 없으면
> 일시정지**, DB 500MB · 스토리지 1GB. 프로젝트 한도에 걸리면 쓰지 않는 프로젝트를
> 일시정지하면 된다. 일시정지된 프로젝트는 한도에 포함되지 않고, 데이터는 유지되며
> 1년 안에는 Studio 에서 버튼 하나로 복구된다.
>
> 1단계 중 DB 가 일시정지되어도 사이트가 죽지는 않는다. supabase-js 는 질의 실패를
> 예외로 던지지 않고 결과에 담아 돌려주고 `lib/queries.ts` 가 빈 배열로 받으므로,
> 목록이 빈 화면으로 뜰 뿐 500 이 나지 않는다. 다만 방문자에게는 빈 사이트로
> 보이니 검색 유입을 본격적으로 노리는 시점에는 Pro 로 올린다.

### 3. 환경변수

`.env.local` 이 없으면 `.env.local.example` 을 복사해 만든다.

```bash
cp .env.local.example .env.local
```

| 키 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 조회·인증 |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용.** 관리자 작업·Signed URL 발급 |
| `SUPABASE_STORAGE_BUCKET` | 첨부 private 버킷 이름 (기본 `documents`) |
| `NEXT_PUBLIC_SITE_URL` | 정규 URL·사이트맵 |
| `HYEAN_FREE_ALL` | 1단계 전면 공개 스위치. 2단계에서 `false` 로 바꾸면 페이월이 켜진다 |

`.env.local` 은 커밋하지 않는다.

### 4. 관리자 계정

`/login` 에서 이메일 접속 링크로 한 번 로그인한 뒤, 그 계정을 승격한다.

```sql
update profiles set role = 'admin' where email = '<운영자 이메일>';
```

### 5. 실행

```bash
npm run dev        # http://localhost:3000
npm run build      # 배포 빌드
npm run typecheck  # tsc --noEmit
npx eslint .
```

---

## 화면

| 경로 | 내용 |
| --- | --- |
| `/` | 최신 브리프 · 섹션 7 · 아카이브 카운터 · 구독 CTA |
| `/brief` | 현안 브리프 목록 |
| `/topics/[slug]` | 섹션별 목록 |
| `/archive` | 전체 카탈로그 · 섹션/유형/연도 필터 · 전문검색 |
| `/doc/[slug]` | 문건 상세 — **RSC 에서 권한 판정** |
| `/pricing` · `/about` | 요금제 · 저자와 편집 원칙 |
| `/admin` | 발행 도구 (`role = admin`) |
| `/api/files/[id]` | 첨부 — 권한 확인 후 60초 Signed URL |

---

## 배포 (Vercel)

Supabase 와 Vercel 사이에 특별한 연동 설정은 없다. 앱이 HTTPS 로 Supabase API 를
호출할 뿐이므로, **환경변수를 옮기는 것이 곧 연결**이다. 다만 양쪽에 각각 할 일이
있고, 한쪽만 하면 로그인이 조용히 실패한다.

### 1. Vercel — 환경변수

Project Settings → Environment Variables 에 `.env.local` 과 같은 값을 넣는다.
Production · Preview · Development 세 환경 모두에 적용한다.

| 키 | 값 | 비고 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` 과 동일 | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` 과 동일 | 브라우저 노출 전제. RLS 가 막는다 |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` 과 동일 | **`NEXT_PUBLIC_` 을 붙이지 않는다** |
| `SUPABASE_STORAGE_BUCKET` | `documents` | |
| `NEXT_PUBLIC_SITE_URL` | 배포 주소 | 도메인 등록 전에는 `https://<프로젝트>.vercel.app` |
| `HYEAN_FREE_ALL` | `true` | 1단계 전면 공개. 2단계에 `false` |

`NEXT_PUBLIC_SITE_URL` 은 정규 URL(canonical)과 사이트맵의 기준이다. 아직 없는
도메인을 적어두면 검색엔진이 죽은 주소를 색인하므로, 도메인 등록 전에는 실제
배포 주소를 넣고 등록 후에 바꾼다.

### 2. Supabase — 인증 리다이렉트

Authentication → URL Configuration 에 **배포 주소를 추가**한다. 이걸 빼먹으면
로컬에서 겪었던 것과 똑같이 로그인 링크가 돌아오지 못한다.

- Site URL → 배포 주소
- Redirect URLs → `https://<배포주소>/auth/callback` 과 `https://<배포주소>/auth/confirm`
  (localhost 항목은 지우지 말고 함께 둔다)

### 3. 함수 리전

`vercel.json` 이 `icn1`(서울)로 고정한다. Vercel 함수의 기본값은
`iad1`(워싱턴 DC)이고, DB 는 서울에 있다. 문건 상세는 권한을 매 요청 판정하느라
DB 를 여러 번 왕복하므로 기본값으로 두면 왕복마다 태평양을 건넌다.
프로젝트 설정(Settings → Functions)에서도 같은 값을 지정할 수 있다.

### 4. 플랜

Vercel Hobby 는 상업적 이용이 허용되지 않는다. 결제를 붙이는 2단계 전에는
Pro($20/월)로 올려야 한다.

---

## 지켜야 할 선

이 네 가지는 편의를 위해서라도 무르지 않는다. 자세한 근거는 [CLAUDE.md](CLAUDE.md).

1. **본문은 서버에서만 판정한다.** 권한이 없으면 `body_md` 를 응답에 담지 않는다.
   클라이언트로 보낸 뒤 `blur`·`max-height` 로 가리는 구현은 개발자도구 한 번이면 뚫린다.
   판정은 [lib/entitlement.ts](lib/entitlement.ts) 한 곳에서만 한다.
2. **권한은 `entitlements` 만 본다.** `subscriptions.status` 를 직접 보고 열어주지 않는다.
   구독·기관 라이선스·체험·기자단이 한 겹으로 수렴해야 정책을 코드 수정 없이 얹을 수 있다.
3. **Storage 는 항상 private.** 공개 URL 을 만들지 않는다.
4. **요약은 공개, 본문은 비공개.** `summary_md` 는 색인을 허용해야 유입이 생긴다.
   구조화 데이터에 `isAccessibleForFree: false` 를 넣어 유료 콘텐츠임을 알린다.

C·D 등급 문건이 실수로 공개되는 경로는 세 겹으로 막혀 있다 —
관리자 UI 버튼 비활성화, 서버 액션의 재검증, DB의 `restricted_tier_never_published` 제약.

---

## 다음 단계

1단계 완료 판정은 **A등급 문건 50건 업로드 · 검색 유입 발생**이다. 그 전에 결제를 붙이지 않는다.

오픈 전 처리할 항목: 도메인(hyean.kr) 등록, 사업자등록·통신판매업 신고,
토스페이먼츠 가맹 심사(빌링키는 PG 이관이 불가하므로 오픈 전 확정), 약관·개인정보 처리방침 게시.
