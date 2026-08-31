'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { saveDocument, type ActionState } from '@/app/admin/actions'
import {
  ACCESS_LEVEL_LABEL,
  DOC_TYPE_LABEL,
  RIGHTS_TIER_LABEL,
  isPublishable,
  type AccessLevel,
  type Category,
  type DocType,
  type DocumentAdminRow,
  type RightsTier,
} from '@/lib/types'

const initial: ActionState = { ok: false, message: '' }

/** timestamptz → datetime-local 입력값 (KST 기준) */
function toLocalInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const kst = new Date(date.getTime() + 9 * 3600 * 1000)
  return kst.toISOString().slice(0, 16)
}

export function DocumentForm({
  doc,
  categories,
}: {
  doc: DocumentAdminRow | null
  categories: Category[]
}) {
  const [state, formAction, pending] = useActionState(saveDocument, initial)
  const [tier, setTier] = useState<RightsTier>(doc?.rights_tier ?? 'A')
  const publishable = isPublishable(tier)

  return (
    <form action={formAction} className="space-y-8">
      {doc && <input type="hidden" name="id" value={doc.id} />}

      {/* ─── 원고 ───────────────────────────────────────────────── */}
      <Fieldset legend="원고">
        <Field label="제목" required>
          <input
            name="title"
            defaultValue={doc?.title ?? ''}
            required
            className={inputClass}
            placeholder="전시작전통제권 전환, 2026년의 실제 쟁점"
          />
        </Field>

        <Field label="부제">
          <input name="subtitle" defaultValue={doc?.subtitle ?? ''} className={inputClass} />
        </Field>

        <Field
          label="핵심 요약"
          required
          hint="무료로 전문 공개된다. 검색엔진 색인 대상이자 청약철회 관련 미리보기 제공의 근거다. Markdown."
        >
          <textarea
            name="summary_md"
            defaultValue={doc?.summary_md ?? ''}
            required
            rows={8}
            className={`${inputClass} font-mono text-[0.8rem] leading-relaxed`}
          />
        </Field>

        <Field label="본문" hint="권한을 통과한 요청에만 전송된다. Markdown — 표는 자동으로 가로 스크롤 처리된다.">
          <textarea
            name="body_md"
            defaultValue={doc?.body_md ?? ''}
            rows={20}
            className={`${inputClass} font-mono text-[0.8rem] leading-relaxed`}
          />
        </Field>
      </Fieldset>

      {/* ─── 분류 ───────────────────────────────────────────────── */}
      <Fieldset legend="분류">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="섹션">
            <select name="category_id" defaultValue={doc?.category_id ?? ''} className={inputClass}>
              <option value="">— 선택 —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ko}
                </option>
              ))}
            </select>
          </Field>

          <Field label="유형">
            <select name="doc_type" defaultValue={doc?.doc_type ?? 'report'} className={inputClass}>
              {(Object.keys(DOC_TYPE_LABEL) as DocType[]).map((t) => (
                <option key={t} value={t}>
                  {DOC_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="슬러그" hint="비워두면 제목에서 만든다. 발행 후에는 바꾸지 않는다 — 링크가 끊긴다.">
          <input
            name="slug"
            defaultValue={doc?.slug ?? ''}
            className={`${inputClass} font-mono text-[0.8rem]`}
            placeholder="octa-2026-transition"
          />
        </Field>

        <Field label="태그" hint="쉼표로 구분">
          <input
            name="tags"
            defaultValue={doc?.tags.join(', ') ?? ''}
            className={inputClass}
            placeholder="전작권, 한미동맹, 연합사"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="작성 방법" hint="AI 보조를 받았다면 반드시 적는다">
            <input
              name="method"
              defaultValue={doc?.method ?? ''}
              className={inputClass}
              placeholder="AI 보조 작성 · 저자 검증"
            />
          </Field>
          <Field label="원본 경로" hint="추적용. 공개되지 않는다.">
            <input
              name="source_path"
              defaultValue={doc?.source_path ?? ''}
              className={`${inputClass} font-mono text-[0.8rem]`}
            />
          </Field>
        </div>
      </Fieldset>

      {/* ─── 권리·공개 ──────────────────────────────────────────── */}
      <Fieldset legend="권리 등급과 공개">
        <Field label="저작권 등급" required>
          <select
            name="rights_tier"
            value={tier}
            onChange={(e) => setTier(e.target.value as RightsTier)}
            className={inputClass}
          >
            {(Object.keys(RIGHTS_TIER_LABEL) as RightsTier[]).map((t) => (
              <option key={t} value={t}>
                {RIGHTS_TIER_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>

        {!publishable && (
          <div className="border-l-2 border-brass bg-brass-soft px-4 py-3">
            <p className="font-mono text-[0.7rem] tracking-[0.15em] text-brass uppercase">
              발행 불가
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {tier === 'C'
                ? '타인 명의 저작물이다. 권리자의 서면 동의를 확보해 A등급으로 올린 뒤에야 발행할 수 있다. 지금은 업로드만 해둔다.'
                : '내부 문서다. 공개 대상이 아니다.'}{' '}
              공개일을 지정해도 저장 시 무시되며, DB 제약이 한 번 더 막는다.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="열람 범위">
            <select
              name="access_level"
              defaultValue={doc?.access_level ?? 'member'}
              className={inputClass}
            >
              {(Object.keys(ACCESS_LEVEL_LABEL) as AccessLevel[]).map((a) => (
                <option key={a} value={a}>
                  {ACCESS_LEVEL_LABEL[a]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="공개일" hint="비워두면 초안">
            <input
              type="datetime-local"
              name="published_at"
              defaultValue={toLocalInput(doc?.published_at ?? null)}
              disabled={!publishable}
              className={`${inputClass} disabled:opacity-40`}
            />
          </Field>
        </div>

        <Field label="무료 공개 종료" hint="브리프용. 이 시각까지는 전문이 무료로 열린다.">
          <input
            type="datetime-local"
            name="free_until"
            defaultValue={toLocalInput(doc?.free_until ?? null)}
            disabled={!publishable}
            className={`${inputClass} disabled:opacity-40`}
          />
        </Field>
      </Fieldset>

      {/* ─── 저장 ───────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-rule bg-ground py-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-accent px-6 py-2.5 text-sm font-medium text-ground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? '저장 중…' : '저장'}
        </button>
        {doc && (
          <Link
            href={`/doc/${doc.slug}`}
            className="border border-rule px-4 py-2.5 text-sm text-ink-soft hover:border-accent hover:text-accent"
          >
            문건 보기
          </Link>
        )}
        {state.message && (
          <p className={`text-sm ${state.ok ? 'text-accent' : 'text-brass'}`}>{state.message}</p>
        )}
      </div>
    </form>
  )
}

const inputClass =
  'w-full border border-rule bg-surface px-3 py-2 text-sm outline-none placeholder:text-ink-faint focus:border-accent'

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 w-full border-b border-ink pb-2 font-mono text-[0.72rem] tracking-[0.18em] uppercase">
        {legend}
      </legend>
      {children}
    </fieldset>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-brass">*</span>}
      </span>
      {hint && <span className="mb-1.5 block text-xs leading-relaxed text-ink-faint">{hint}</span>}
      {children}
    </label>
  )
}
