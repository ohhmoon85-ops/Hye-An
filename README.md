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

Pro 플랜으로 프로젝트를 만든 뒤 스키마를 적용한다.
대시보드 SQL 편집기에서 직접 고치지 않는다 — 변경은 항상 `supabase/migrations/` 에 남긴다.

```bash
# Supabase CLI 를 쓰는 경우
supabase link --project-ref <ref>
supabase db push

# 또는 psql 로 직접
psql "$DATABASE_URL" -f supabase/schema.sql
```

개발용 표본 문건을 넣으려면:

```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

### 3. 환경변수

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
