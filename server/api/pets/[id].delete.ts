import { deletePet } from '~~/server/services/pet.service'

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

  await deletePet(id, session.user.id)

  return { message: 'Pet deleted successfully' }
})
