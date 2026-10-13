import mongoose from 'mongoose'
import { getPetById, updatePet } from '~~/server/services/pet.service'
import { deleteFile } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')

  if (!id || !mongoose.isValidObjectId(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pet ID' })
  }

  await connectDB()

  const pet = await getPetById(id, session.user.id)

  if (!pet.photo) {
    throw createError({ statusCode: 400, statusMessage: 'Pet has no photo' })
  }

  // Clear the reference first so a storage failure can't leave the pet pointing at a deleted file
  const updated = await updatePet(id, session.user.id, { photo: null })

  // Best-effort: the pet no longer references the file
  await deleteFile(pet.photo).catch(err => console.error('[photo] Failed to delete photo:', err))

  return updated
})
