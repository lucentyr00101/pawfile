import mongoose from 'mongoose'
import { addAttachment } from '~~/server/services/health-record.service'
import { uploadFile } from '~~/server/utils/storage'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const petId = getRouterParam(event, 'petId')
  const id = getRouterParam(event, 'id')

  if (!petId || !mongoose.isValidObjectId(petId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pet ID' })
  }

  if (!id || !mongoose.isValidObjectId(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid health record ID' })
  }

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
  const filename = `health-records/${session.user.id}/${id}/${uuid}.${ext}`
  const fileUrl = await uploadFile(filePart.data, filename, contentType)

  return addAttachment(session.user.id, petId, id, fileUrl)
})
