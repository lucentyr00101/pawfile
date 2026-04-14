import { getPetsByUser } from '~~/server/services/pet.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await connectDB()

  const pets = await getPetsByUser(session.user.id)

  return pets
})
