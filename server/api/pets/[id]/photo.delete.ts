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

  await deleteFile(pet.photo)

  const updated = await updatePet(id, session.user.id, { photo: null })

  return updated
})
