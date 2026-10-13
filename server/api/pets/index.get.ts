import { getPetsByUser } from '~~/server/services/pet.service'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  await connectDB()

  const pets = await getPetsByUser(user.id)

  return pets
})
