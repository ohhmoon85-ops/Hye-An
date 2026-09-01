'use client'

import { deleteDocument } from '@/app/admin/actions'

/**
 * 삭제는 되돌릴 수 없고 첨부 파일까지 함께 지운다. 1인 운영이라 실수했을 때
 * 되살려 줄 사람도 없다. 그래서 문서번호와 제목을 보여주고 한 번 묻는다.
 */
export function DeleteDocumentButton({
  id,
  docNo,
  title,
}: {
  id: string
  docNo: string | null
  title: string
}) {
  return (
    <form
      action={deleteDocument}
      onSubmit={(event) => {
        const label = docNo ? `${docNo} 「${title}」` : `「${title}」`
        const ok = window.confirm(
          `${label} 을(를) 영구 삭제한다.\n\n첨부 파일도 함께 지워지며 되돌릴 수 없다.\n계속하겠는가?`
        )
        if (!ok) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="font-mono text-[0.7rem] text-ink-faint hover:text-brass">
        삭제
      </button>
    </form>
  )
}
