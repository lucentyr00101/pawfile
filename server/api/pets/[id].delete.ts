import { deletePet } from '~~/server/services/pet.service'
import { deleteFile } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Pet ID is required' })
  }

  await connectDB()

  const pet = await deletePet(id, session.user.id)

  if (pet.photo) {
    await deleteFile(pet.photo)
  }

  return { message: 'Pet deleted successfully' }
})
