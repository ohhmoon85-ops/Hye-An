'use client'

import { useActionState } from 'react'
import {
  deleteAttachment,
  uploadAttachment,
  type ActionState,
} from '@/app/admin/actions'
import { formatBytes } from '@/lib/format'
import type { Attachment } from '@/lib/types'

const initial: ActionState = { ok: false, message: '' }

export function AttachmentManager({
  documentId,
  attachments,
}: {
  documentId: string
  attachments: Attachment[]
}) {
  const [state, formAction, pending] = useActionState(uploadAttachment, initial)

  return (
    <section>
      <h2 className="mb-3 w-full border-b border-ink pb-2 font-mono text-[0.72rem] tracking-[0.18em] uppercase">
        첨부
      </h2>

      {attachments.length > 0 && (
        <ul className="mb-4 divide-y divide-rule border border-rule bg-surface">
          {attachments.map((file) => (
            <li key={file.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-12 shrink-0 font-mono text-[0.65rem] tracking-wide text-brass uppercase">
                {file.kind}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{file.filename}</span>
              {file.is_public && (
                <span className="shrink-0 font-mono text-[0.65rem] text-accent">공개</span>
              )}
              <span className="shrink-0 font-mono text-[0.65rem] text-ink-faint">
                {formatBytes(file.bytes)}
              </span>
              <form action={deleteAttachment}>
                <input type="hidden" name="attachment_id" value={file.id} />
                <button
                  type="submit"
                  className="font-mono text-[0.7rem] text-ink-faint hover:text-brass"
                >
                  삭제
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-3 border border-rule bg-surface p-4">
        <input type="hidden" name="document_id" value={documentId} />

        <input
          type="file"
          name="file"
          required
          className="block w-full text-sm file:mr-3 file:border file:border-rule file:bg-surface-sunken file:px-3 file:py-1.5 file:text-sm file:text-ink-soft"
        />

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="is_public" className="accent-[var(--accent)]" />
          무료 공개 첨부 (B등급 원문 등)
        </label>

        <p className="font-mono text-[0.65rem] leading-relaxed text-ink-faint">
          private 버킷에 올라간다. 다운로드는 /api/files/[id] 에서 권한 확인 후 60초 Signed URL 로만
          제공된다.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="border border-accent px-4 py-2 text-sm text-accent hover:bg-accent hover:text-ground disabled:opacity-50"
          >
            {pending ? '올리는 중…' : '업로드'}
          </button>
          {state.message && (
            <p className={`text-sm ${state.ok ? 'text-accent' : 'text-brass'}`}>{state.message}</p>
          )}
        </div>
      </form>
    </section>
  )
}
