-- =====================================================================
-- 혜안 (HYEAN) — 0004 기록 함수의 실행 권한을 실제로 회수한다
--
-- 0003 의 `revoke execute ... from anon, authenticated` 는 효과가 없었다.
-- PostgreSQL 은 함수를 만들 때 EXECUTE 를 **PUBLIC 에** 부여한다. anon 과
-- authenticated 는 PUBLIC 에 속하므로, 그 둘에게서만 회수해도 PUBLIC 을 통해
-- 그대로 실행할 수 있다. 실제로 익명 키로 호출하니 204 가 떨어졌다 —
-- 누구나 조회수를 원하는 만큼 부풀리고 접속기록을 위조할 수 있는 상태였다.
--
-- 0002 의 컬럼 권한과 같은 종류의 실수다. 넓은 권한이 남아 있으면 좁은 회수는
-- 아무 일도 하지 않는다. PUBLIC 에서 걷어내고 필요한 역할에만 다시 부여한다.
-- =====================================================================

revoke execute on function record_access(uuid, uuid, text, text) from public;
revoke execute on function record_access(uuid, uuid, text, text) from anon, authenticated;
grant  execute on function record_access(uuid, uuid, text, text) to service_role;

revoke execute on function increment_view_count(uuid) from public;
revoke execute on function increment_view_count(uuid) from anon, authenticated;
grant  execute on function increment_view_count(uuid) to service_role;

-- 아래 셋은 공개 함수가 맞다. 다만 PUBLIC 이 아니라 필요한 역할에만 명시적으로
-- 부여해, 앞으로 권한 상태를 한눈에 읽을 수 있게 한다.
--   has_access / get_document_body — security definer 로 스스로 권한을 판정한다
--   search_documents               — 요약까지만 반환한다
revoke execute on function has_access(text) from public;
grant  execute on function has_access(text) to anon, authenticated, service_role;

revoke execute on function get_document_body(text) from public;
grant  execute on function get_document_body(text) to anon, authenticated, service_role;

revoke execute on function search_documents(text, int) from public;
grant  execute on function search_documents(text, int) to anon, authenticated, service_role;

revoke execute on function is_admin() from public;
grant  execute on function is_admin() to anon, authenticated, service_role;
