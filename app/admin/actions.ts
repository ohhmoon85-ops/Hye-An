'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient, STORAGE_BUCKET } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { isPublishable, type AttachmentKind, type RightsTier } from '@/lib/types'

export type ActionState = { ok: boolean; message: string; slug?: string }

function str(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? ''
}

export async function saveDocument(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  await requireAdmin()

  const id = str(form, 'id')
  const title = str(form, 'title')
  const summary = str(form, 'summary_md')
  const tier = (str(form, 'rights_tier') || 'A') as RightsTier

  if (!title) return { ok: false, message: '제목을 입력한다.' }
  if (!summary) return { ok: false, message: '핵심 요약은 비워둘 수 없다. 무료로 공개되는 부분이자 미리보기 제공 의무의 근거다.' }

  const slug = slugify(str(form, 'slug') || title)
  if (!slug) return { ok: false, message: '슬러그를 만들 수 없다. 직접 입력한다.' }

  const categoryId = str(form, 'category_id')
  const publishAt = str(form, 'published_at')

  // C·D 등급은 어떤 경로로도 발행 상태가 되지 않는다.
  const published_at = isPublishable(tier) && publishAt ? new Date(publishAt).toISOString() : null
  const freeUntil = str(form, 'free_until')

  const payload = {
    slug,
    title,
    subtitle: str(form, 'subtitle') || null,
    category_id: categoryId ? Number(categoryId) : null,
    summary_md: summary,
    body_md: str(form, 'body_md') || null,
    method: str(form, 'method') || null,
    doc_type: str(form, 'doc_type') || 'report',
    rights_tier: tier,
    access_level: str(form, 'access_level') || 'member',
    published_at,
    free_until: freeUntil ? new Date(freeUntil).toISOString() : null,
    source_path: str(form, 'source_path') || null,
    tags: str(form, 'tags')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  }

  const admin = createAdminClient()

  if (id) {
    const { error } = await admin.from('documents').update(payload).eq('id', id)
    if (error) return { ok: false, message: `저장 실패 — ${error.message}` }
  } else {
    const { data, error } = await admin.from('documents').insert(payload).select('id').single()
    if (error) return { ok: false, message: `저장 실패 — ${error.message}` }
    revalidatePath('/admin')
    redirect(`/admin/${data.id}`)
  }

  revalidatePath('/admin')
  revalidatePath(`/doc/${slug}`)
  revalidatePath('/')
  return { ok: true, message: '저장했다.', slug }
}

export async function setPublished(form: FormData): Promise<void> {
  await requireAdmin()
  const id = str(form, 'id')
  const publish = str(form, 'publish') === 'true'

  const admin = createAdminClient()
  const { data: doc } = await admin
    .from('documents')
    .select('slug, rights_tier')
    .eq('id', id)
    .maybeSingle()

  if (!doc) return
  // 서버에서도 다시 막는다. UI 비활성화만 믿지 않는다.
  if (publish && !isPublishable(doc.rights_tier as RightsTier)) return

  await admin
    .from('documents')
    .update({ published_at: publish ? new Date().toISOString() : null })
    .eq('id', id)

  revalidatePath('/admin')
  revalidatePath(`/admin/${id}`)
  revalidatePath(`/doc/${doc.slug}`)
  revalidatePath('/')
  revalidatePath('/archive')
}

export async function deleteDocument(form: FormData): Promise<void> {
  await requireAdmin()
  const id = str(form, 'id')

  const admin = createAdminClient()
  const { data: files } = await admin
    .from('attachments')
    .select('storage_path')
    .eq('document_id', id)

  if (files?.length) {
    await admin.storage.from(STORAGE_BUCKET).remove(files.map((f) => f.storage_path))
  }
  await admin.from('documents').delete().eq('id', id)

  revalidatePath('/admin')
  revalidatePath('/')
  redirect('/admin')
}

const KIND_BY_EXT: Record<string, AttachmentKind> = {
  pdf: 'pdf',
  pptx: 'pptx',
  ppt: 'pptx',
  hwpx: 'hwpx',
  hwp: 'hwpx',
  docx: 'docx',
  doc: 'docx',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
}

export async function uploadAttachment(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  await requireAdmin()

  const documentId = str(form, 'document_id')
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: '파일을 고른다.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const kind = KIND_BY_EXT[ext] ?? 'other'
  // 버킷은 private 이다. 경로를 알아도 공개 URL로는 열 수 없다.
  const storagePath = `${documentId}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined, upsert: false })

  if (uploadError) return { ok: false, message: `업로드 실패 — ${uploadError.message}` }

  const { error } = await admin.from('attachments').insert({
    document_id: documentId,
    storage_path: storagePath,
    kind,
    filename: file.name,
    bytes: file.size,
    is_public: str(form, 'is_public') === 'on',
  })

  if (error) {
    await admin.storage.from(STORAGE_BUCKET).remove([storagePath])
    return { ok: false, message: `등록 실패 — ${error.message}` }
  }

  revalidatePath(`/admin/${documentId}`)
  return { ok: true, message: `${file.name} 업로드 완료.` }
}

export async function deleteAttachment(form: FormData): Promise<void> {
  await requireAdmin()
  const id = str(form, 'attachment_id')

  const admin = createAdminClient()
  const { data: file } = await admin
    .from('attachments')
    .select('storage_path, document_id')
    .eq('id', id)
    .maybeSingle()

  if (!file) return
  await admin.storage.from(STORAGE_BUCKET).remove([file.storage_path])
  await admin.from('attachments').delete().eq('id', id)

  revalidatePath(`/admin/${file.document_id}`)
}
