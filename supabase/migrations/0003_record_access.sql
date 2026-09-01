-- =====================================================================
-- 혜안 (HYEAN) — 0003 접속 기록을 한 번의 호출로 합친다
--
-- 기록은 응답이 나간 뒤(after())에 처리하는데, 서버리스에서는 그 시간이
-- 넉넉하지 않다. 실제로 access_logs 삽입과 increment_view_count 를 잇달아
-- 호출했더니 앞의 것만 남고 뒤의 것이 통째로 잘렸다 (5회 요청 → 로그 3건,
-- 조회수 0 증가).
--
-- 두 작업을 하나의 함수로 합쳐 왕복을 1회로 줄이고, 한 트랜잭션 안에서
-- 처리해 절반만 기록되는 일이 없게 한다.
-- =====================================================================

create or replace function record_access(
  doc_id  uuid,
  viewer  uuid default null,
  act     text default 'view',
  ip      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into access_logs (document_id, user_id, action, ip_hash)
  values (doc_id, viewer, act, ip);

  if act = 'view' then
    update documents
       set view_count = view_count + 1
     where id = doc_id
       and published_at is not null
       and published_at <= now();
  end if;
end;
$$;

-- 서버(service_role)에서만 호출한다. 클라이언트가 조회수를 부풀리지 못하도록
-- anon·authenticated 에는 실행 권한을 주지 않는다.
revoke execute on function record_access(uuid, uuid, text, text) from anon, authenticated;

-- 0001 의 increment_view_count 는 record_access 로 대체되었다.
-- 클라이언트가 직접 조회수를 올릴 수 있던 통로이기도 하므로 함께 회수한다.
revoke execute on function increment_view_count(uuid) from anon, authenticated;
