import { getPetById } from '~~/server/services/pet.service'
import { requireObjectIdParam } from '~~/server/utils/params'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const id = requireObjectIdParam(event, 'id', 'pet')

  await connectDB()

  const pet = await getPetById(id, user.id)

  return pet
})
