-- =====================================================================
-- 혜안 (HYEAN) — 0001 초기 스키마
-- 적용: supabase db push  (대시보드에서 직접 수정하지 않는다)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 사용자
-- ---------------------------------------------------------------------
create type user_role as enum ('reader', 'admin');

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  org         text,                         -- 소속 (기관 라이선스 매칭용)
  role        user_role not null default 'reader',
  created_at  timestamptz not null default now()
);

-- 가입 시 프로필 자동 생성. 최초 관리자는 아래 SQL로 수동 승격한다.
--   update profiles set role = 'admin' where email = '<운영자 이메일>';
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 관리자 판정 헬퍼. RLS 정책 안에서 profiles 를 다시 읽으므로 security definer
-- 로 두어 정책 재귀를 피한다.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 2. 분류
-- ---------------------------------------------------------------------
create table categories (
  id          serial primary key,
  slug        text unique not null,
  name_ko     text not null,
  name_en     text,
  sort_order  int not null default 0
);

insert into categories (slug, name_ko, name_en, sort_order) values
  ('alliance',   '한미동맹',        'ROK-US Alliance',            1),
  ('us-strategy','미국 전략',       'US Strategy',                2),
  ('order',      '미중·국제질서',   'US-China & World Order',     3),
  ('warfare',    '전쟁 사례연구',   'Conflict Studies',           4),
  ('future-war', '미래전·군사혁신', 'Future Warfare',             5),
  ('policy',     '국방정책·제도',   'Defense Policy',             6),
  ('essays',     '강연·기고',       'Lectures & Essays',          7);

-- ---------------------------------------------------------------------
-- 3. 문건
-- ---------------------------------------------------------------------
create type doc_type     as enum ('brief', 'report', 'archive', 'series');
create type rights_tier  as enum ('A', 'B', 'C', 'D');  -- CLAUDE.md 참조
create type access_level as enum ('free', 'member', 'institution');

create sequence doc_no_seq;

create table documents (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  doc_no        text unique,        -- HY-2026-0001. 트리거가 자동 부여
  title         text not null,
  subtitle      text,
  category_id   int references categories(id),

  summary_md    text not null,      -- 무료 공개. 검색엔진 색인 대상
  body_md       text,               -- 유료 본문. 권한 통과 시에만 전송
  method        text,               -- 예: 'AI 보조 작성 · 저자 검증'

  doc_type      doc_type      not null default 'report',
  rights_tier   rights_tier   not null default 'A',
  access_level  access_level  not null default 'member',

  published_at  timestamptz,        -- null이면 미발행
  free_until    timestamptz,        -- 브리프 무료 공개 종료 시각
  source_path   text,               -- 원본 폴더 경로 (추적용)
  tags          text[] not null default '{}',
  view_count    int not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- C·D 등급은 어떤 경로로도 발행 상태가 될 수 없다. 관리자 UI의 비활성화
  -- 버튼만으로는 부족하므로 DB에 최종 방어선을 둔다.
  constraint restricted_tier_never_published
    check (rights_tier not in ('C', 'D') or published_at is null)
);

create index documents_published_idx on documents (published_at desc nulls last);
create index documents_category_idx  on documents (category_id);
create index documents_tags_idx      on documents using gin (tags);

-- 전문검색. 한국어 형태소 사전이 없으므로 simple 구성으로 색인하고
-- search_documents() 에서 부분일치(ilike)를 함께 건다.
alter table documents add column search_tsv tsvector
  generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(subtitle,'')
                          || ' ' || coalesce(summary_md,''))
  ) stored;
create index documents_search_idx on documents using gin (search_tsv);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_touch_updated_at
  before update on documents
  for each row execute function touch_updated_at();

-- 문서번호 — 자료의 '기록물' 성격을 드러내는 표식
create or replace function assign_doc_no()
returns trigger language plpgsql as $$
begin
  if new.doc_no is null then
    new.doc_no := 'HY-' || to_char(now() at time zone 'Asia/Seoul', 'YYYY')
                        || '-' || lpad(nextval('doc_no_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger documents_assign_doc_no
  before insert on documents
  for each row execute function assign_doc_no();

-- ---------------------------------------------------------------------
-- 4. 첨부 (PDF · PPTX · HWPX)
-- ---------------------------------------------------------------------
create type attachment_kind as enum ('pdf', 'pptx', 'hwpx', 'docx', 'image', 'other');

create table attachments (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references documents(id) on delete cascade,
  storage_path text not null,        -- private 버킷 경로. 공개 URL 생성 금지
  kind         attachment_kind not null,
  filename     text not null,
  bytes        bigint,
  is_public    boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index attachments_document_idx on attachments (document_id, sort_order);

-- ---------------------------------------------------------------------
-- 5. 요금제 · 구독 · 결제   (2단계에서 사용. 스키마는 미리 확정해 둔다)
-- ---------------------------------------------------------------------
create table plans (
  id         serial primary key,
  code       text unique not null,   -- free | member_m | member_y | inst
  name       text not null,
  price_krw  int not null,
  period     text not null,          -- month | year | none
  seats      int not null default 1
);

insert into plans (code, name, price_krw, period, seats) values
  ('free',     '열람',            0,      'none',  1),
  ('member_m', '멤버십 (월간)',   12900,  'month', 1),
  ('member_y', '멤버십 (연간)',   129000, 'year',  1),
  ('inst',     '기관 라이선스',   0,      'year',  5);   -- 금액은 계약별 협의

create type sub_status as enum ('active', 'past_due', 'canceled');

create table subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  plan_id             int  not null references plans(id),
  status              sub_status not null default 'active',
  billing_key         text,          -- 암호화 저장. 카드번호는 절대 저장 금지
  current_period_end  timestamptz not null,
  canceled_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index subscriptions_due_idx on subscriptions (current_period_end)
  where status in ('active', 'past_due');

create table payments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete set null,
  subscription_id  uuid references subscriptions(id) on delete set null,
  pg_tx_id         text unique not null,
  amount_krw       int not null,
  status           text not null,     -- paid | failed | canceled | refunded
  paid_at          timestamptz,
  receipt_url      text,
  raw              jsonb,             -- PG 원본 응답 보존
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. 열람 권한  ★ 접근 판정은 오직 이 테이블만 조회한다
-- ---------------------------------------------------------------------
create type ent_scope  as enum ('all', 'category', 'document');
create type ent_source as enum ('subscription', 'institution', 'grant', 'trial');

create table entitlements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  scope       ent_scope  not null default 'all',
  scope_id    text,                    -- category slug 또는 document id
  source      ent_source not null,
  expires_at  timestamptz,             -- null = 무기한
  created_at  timestamptz not null default now()
);

create index entitlements_user_idx on entitlements (user_id, expires_at desc);

-- ---------------------------------------------------------------------
-- 7. 접근 기록 (남용 탐지 · 기관 정산 근거)
-- ---------------------------------------------------------------------
create table access_logs (
  id           bigserial primary key,
  user_id      uuid references profiles(id) on delete set null,
  document_id  uuid references documents(id) on delete set null,
  action       text not null,          -- view | download
  ip_hash      text,                   -- 원본 IP 저장 금지. 해시만 보관
  at           timestamptz not null default now()
);

create index access_logs_user_at_idx on access_logs (user_id, at desc);
create index access_logs_doc_at_idx  on access_logs (document_id, at desc);

-- =====================================================================
-- RLS
-- =====================================================================
alter table profiles      enable row level security;
alter table documents     enable row level security;
alter table attachments   enable row level security;
alter table subscriptions enable row level security;
alter table payments      enable row level security;
alter table entitlements  enable row level security;
alter table access_logs   enable row level security;

-- 본인 프로필만 (관리자는 전체 조회)
create policy "own_profile" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "own_profile_update" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- 발행된 문건의 메타·요약은 누구나 조회 가능
create policy "doc_public_read" on documents
  for select using (published_at is not null and published_at <= now());
create policy "doc_admin_all" on documents
  for all using (is_admin()) with check (is_admin());

-- ★ 본문 컬럼은 일반 권한에서 회수한다. get_document_body() 로만 조회 가능.
--   따라서 문건 질의에 select * 를 쓰면 권한 오류가 난다. lib/queries.ts 의
--   컬럼 목록 상수만 사용할 것.
revoke select (body_md) on documents from anon, authenticated;

-- 본인 구독·결제·권한만
create policy "own_subscriptions" on subscriptions
  for select using (user_id = auth.uid());
create policy "own_payments" on payments
  for select using (user_id = auth.uid());
create policy "own_entitlements" on entitlements
  for select using (user_id = auth.uid());
-- 쓰기 정책 없음 = 클라이언트가 스스로 권한을 만들 수 없다. service_role 전용.

-- 첨부는 문건이 공개된 경우에만 메타 조회 가능 (실제 파일은 Signed URL)
create policy "attachment_read" on attachments
  for select using (
    exists (select 1 from documents d
            where d.id = attachments.document_id
              and d.published_at is not null
              and d.published_at <= now())
  );
create policy "attachment_admin_all" on attachments
  for all using (is_admin()) with check (is_admin());

create policy "own_access_logs" on access_logs
  for select using (user_id = auth.uid() or is_admin());

-- =====================================================================
-- 권한 판정 함수 — lib/entitlement.ts 가 유일한 호출자
-- =====================================================================
create or replace function has_access(doc_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  d documents%rowtype;
begin
  select * into d from documents where slug = doc_slug;
  if not found then return false; end if;

  -- 미발행 또는 C·D등급은 관리자만
  if d.published_at is null or d.published_at > now()
     or d.rights_tier in ('C', 'D') then
    return is_admin();
  end if;

  -- 무료 문건 또는 무료 공개 기간 중
  if d.access_level = 'free'
     or (d.free_until is not null and d.free_until > now()) then
    return true;
  end if;

  -- 유효한 열람 권한 보유 여부
  return exists (
    select 1 from entitlements e
    where e.user_id = auth.uid()
      and (e.expires_at is null or e.expires_at > now())
      and (
        e.scope = 'all'
        or (e.scope = 'document' and e.scope_id = d.id::text)
        or (e.scope = 'category' and e.scope_id = (
              select slug from categories c where c.id = d.category_id))
      )
  );
end;
$$;

create or replace function get_document_body(doc_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if has_access(doc_slug) then
    return (select body_md from documents where slug = doc_slug);
  end if;
  return null;   -- 권한 없으면 본문을 아예 반환하지 않는다
end;
$$;

grant execute on function has_access(text)         to anon, authenticated;
grant execute on function get_document_body(text)  to anon, authenticated;
grant execute on function is_admin()               to anon, authenticated;

-- 조회수는 일반 권한으로 갱신할 수 없으므로 함수로만 증가시킨다.
-- lib/access-log.ts 가 유일한 호출자다.
create or replace function increment_view_count(doc_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update documents set view_count = view_count + 1
   where id = doc_id and published_at is not null and published_at <= now();
$$;

grant execute on function increment_view_count(uuid) to anon, authenticated;

-- =====================================================================
-- 전문검색 RPC — 요약까지만 반환한다. 본문은 어떤 경우에도 반환하지 않는다.
-- =====================================================================
create or replace function search_documents(q text, lim int default 40)
returns table (
  slug text, doc_no text, title text, subtitle text, summary_md text,
  doc_type doc_type, access_level access_level, published_at timestamptz,
  category_slug text, category_name_ko text, rank real
)
language sql
stable
set search_path = public
as $$
  select d.slug, d.doc_no, d.title, d.subtitle, d.summary_md,
         d.doc_type, d.access_level, d.published_at,
         c.slug, c.name_ko,
         ts_rank(d.search_tsv, plainto_tsquery('simple', q)) as rank
    from documents d
    left join categories c on c.id = d.category_id
   where d.published_at is not null and d.published_at <= now()
     and (d.search_tsv @@ plainto_tsquery('simple', q)
          or d.title      ilike '%' || q || '%'
          or d.summary_md ilike '%' || q || '%')
   order by rank desc, d.published_at desc
   limit least(lim, 100);
$$;

grant execute on function search_documents(text, int) to anon, authenticated;

-- =====================================================================
-- Storage — 항상 private 버킷. 공개 URL을 생성하지 않는다.
-- 접근은 /api/files/[id] 에서 권한 확인 후 60초 Signed URL 발급.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

-- 이 버킷에는 storage.objects 정책을 만들지 않는다.
-- = anon·authenticated 의 직접 접근 전면 차단. 업로드와 Signed URL 발급은
--   service_role 키를 쥔 서버 코드에서만 수행한다.
