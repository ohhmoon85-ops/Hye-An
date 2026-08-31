import { formatBytes } from '@/lib/format'
import type { Attachment } from '@/lib/types'

const KIND_LABEL: Record<Attachment['kind'], string> = {
  pdf: 'PDF',
  pptx: 'PPTX',
  hwpx: 'HWPX',
  docx: 'DOCX',
  image: 'IMG',
  other: 'FILE',
}

/**
 * 파일은 직접 링크하지 않는다. /api/files/[id] 가 권한을 확인한 뒤
 * 유효기간 60초 Signed URL 로 넘긴다.
 */
export function AttachmentList({
  attachments,
  canDownload,
}: {
  attachments: Attachment[]
  canDownload: boolean
}) {
  return (
    <ul className="border border-rule bg-surface divide-y divide-rule">
      {attachments.map((file) => {
        const allowed = canDownload || file.is_public
        return (
          <li key={file.id} className="flex items-center gap-3 px-4 py-3">
            <span className="w-12 shrink-0 font-mono text-[0.65rem] tracking-wide text-brass">
              {KIND_LABEL[file.kind]}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{file.filename}</span>
            <span className="shrink-0 font-mono text-[0.65rem] text-ink-faint">
              {formatBytes(file.bytes)}
            </span>
            {allowed ? (
              <a
                href={`/api/files/${file.id}`}
                className="shrink-0 font-mono text-[0.7rem] text-accent hover:underline"
              >
                내려받기
              </a>
            ) : (
              <span className="shrink-0 font-mono text-[0.7rem] text-ink-faint">멤버십</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
