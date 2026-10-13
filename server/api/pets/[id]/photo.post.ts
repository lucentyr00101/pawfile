import mongoose from 'mongoose'
import { getPetById, updatePet } from '~~/server/services/pet.service'
import { generateFilePath, uploadFile, deleteFile } from '~~/server/utils/storage'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')

  if (!id || !mongoose.isValidObjectId(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pet ID' })
  }

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find((p) => p.name === 'photo')

  if (!filePart?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'photo file is required' })
  }

  const contentType = filePart.type || ''

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw createError({ statusCode: 400, statusMessage: 'photo must be a JPEG, PNG, or WebP image' })
  }

  if (filePart.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'photo must be 5MB or smaller' })
  }

  await connectDB()

  const pet = await getPetById(id, session.user.id)
  const previousPhoto = pet.photo

  // Upload and save the new photo before touching the old one, so a failed upload
  // never leaves the pet pointing at a deleted file.
  const ext = MIME_TO_EXT[contentType]
  const filename = generateFilePath(session.user.id, `photo.${ext}`)
  const photoUrl = await uploadFile(filePart.data, filename, contentType)

  const updated = await updatePet(id, session.user.id, { photo: photoUrl })

  if (previousPhoto) {
    // Best-effort: the pet already references the new photo
    await deleteFile(previousPhoto).catch(err => console.error('[photo] Failed to delete old photo:', err))
  }

  return updated
})
