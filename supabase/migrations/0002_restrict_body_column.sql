-- =====================================================================
-- 혜안 (HYEAN) — 0002 본문 컬럼 권한 회수 (긴급)
--
-- 0001 의 `revoke select (body_md) on documents from anon, authenticated`
-- 는 아무 효과가 없었다. PostgreSQL 에서 컬럼 단위 revoke 는 **컬럼 단위로
-- 부여된 권한만** 회수한다. Supabase 는 public 스키마의 테이블에 테이블 단위
-- SELECT 를 부여하므로, 컬럼 하나를 revoke 해도 테이블 권한이 그대로 남아
-- 전체 컬럼을 계속 읽을 수 있다.
--
-- 실제로 다음 한 줄이면 유료 본문 전체가 나왔다:
--   curl "$URL/rest/v1/documents?select=slug,body_md" -H "apikey: <anon>"
--
-- 올바른 방법은 테이블 권한을 걷어내고 허용할 컬럼만 다시 부여하는 것이다.
-- 앞으로 documents 에 컬럼을 추가하면 이 목록에도 반드시 추가해야 한다.
-- 빠뜨리면 그 컬럼은 조회되지 않는다 (본문이 새는 쪽이 아니라 막히는 쪽으로
-- 실패하므로 안전한 기본값이다).
-- =====================================================================

revoke select on documents from anon, authenticated;

grant select (
  id, slug, doc_no, title, subtitle, category_id,
  summary_md,          -- 무료 공개. 검색엔진 색인 대상
  -- body_md          ← 절대 부여하지 않는다. get_document_body() 로만 나간다
  method, doc_type, rights_tier, access_level,
  published_at, free_until, source_path, tags, view_count,
  created_at, updated_at, search_tsv
) on documents to anon, authenticated;

-- 첨부의 storage_path 도 같은 이유로 가린다. private 버킷이라 경로만으로는
-- 열 수 없지만, 굳이 내보낼 이유가 없다. 파일은 /api/files/[id] 가
-- service_role 로 읽어 60초 Signed URL 로만 내보낸다.
revoke select on attachments from anon, authenticated;

grant select (
  id, document_id,
  -- storage_path     ← 부여하지 않는다
  kind, filename, bytes, is_public, sort_order, created_at
) on attachments to anon, authenticated;
