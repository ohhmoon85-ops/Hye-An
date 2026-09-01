import { setPublished } from '@/app/admin/actions'
import { DeleteDocumentButton } from '@/components/admin/DeleteDocumentButton'
import { formatDate } from '@/lib/format'
import { isPublishable, RIGHTS_TIER_LABEL, type DocumentAdminRow } from '@/lib/types'

/**
 * 발행 버튼. C·D 등급이면 비활성화한다.
 * 같은 판정을 서버 액션과 DB 제약이 각각 한 번 더 한다 — 실수로 공개되는 경로를
 * 세 겹으로 막는다.
 */
export function PublishControls({ doc }: { doc: DocumentAdminRow }) {
  const publishable = isPublishable(doc.rights_tier)
  const published = doc.published_at !== null

  return (
    <section className="border border-rule bg-surface">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[0.65rem] tracking-[0.15em] text-ink-faint uppercase">
            상태
          </p>
          <p className="mt-1 text-sm">
            {published ? (
              <span className="text-accent">발행됨 · {formatDate(doc.published_at)}</span>
            ) : (
              <span className="text-ink-soft">초안 — 관리자에게만 보인다</span>
            )}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {publishable ? (
            <form action={setPublished}>
              <input type="hidden" name="id" value={doc.id} />
              <input type="hidden" name="publish" value={published ? 'false' : 'true'} />
              <button
                type="submit"
                className={
                  published
                    ? 'border border-rule px-4 py-2 text-sm text-ink-soft hover:border-brass hover:text-brass'
                    : 'bg-accent px-5 py-2 text-sm font-medium text-ground hover:opacity-90'
                }
              >
                {published ? '발행 취소' : '지금 발행'}
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled
              title={`${RIGHTS_TIER_LABEL[doc.rights_tier]} — 발행할 수 없다`}
              className="cursor-not-allowed border border-rule px-5 py-2 text-sm text-ink-faint opacity-50"
            >
              발행 불가 ({doc.rights_tier}등급)
            </button>
          )}

          <DeleteDocumentButton id={doc.id} docNo={doc.doc_no} title={doc.title} />
        </div>
      </div>

      {!publishable && (
        <p className="border-t border-rule bg-brass-soft px-5 py-3 text-sm leading-relaxed text-ink-soft">
          {doc.rights_tier === 'C'
            ? '권리자의 서면 동의를 확보하기 전에는 공개할 수 없다. 동의 확보 후 등급을 A로 올리면 발행 버튼이 열린다.'
            : '내부 문서다. 공개 대상이 아니다.'}
        </p>
      )}
    </section>
  )
}
