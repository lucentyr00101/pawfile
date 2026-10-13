import { addAttachment } from '~~/server/services/health-record.service'
import { uploadFile } from '~~/server/utils/storage'
import { requireObjectIdParam } from '~~/server/utils/params'
import { assertUploadSize } from '~~/server/utils/upload'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const petId = requireObjectIdParam(event, 'id', 'pet')
  const recordId = requireObjectIdParam(event, 'recordId', 'health record')

  assertUploadSize(event, MAX_FILE_SIZE, 'file')

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find((p) => p.name === 'file')

  if (!filePart?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'file is required' })
  }

  const contentType = filePart.type || ''

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw createError({ statusCode: 400, statusMessage: 'file must be a JPEG, PNG, WebP image, or PDF' })
  }

  if (filePart.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'file must be 5MB or smaller' })
  }

  await connectDB()

  const ext = MIME_TO_EXT[contentType]
  const uuid = crypto.randomUUID()
  const filename = `health-records/${user.id}/${recordId}/${uuid}.${ext}`
  const fileUrl = await uploadFile(filePart.data, filename, contentType)

  return addAttachment(user.id, petId, recordId, fileUrl)
})
