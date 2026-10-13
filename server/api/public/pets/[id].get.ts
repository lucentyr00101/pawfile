import { getPublicPetById } from '~~/server/services/pet.service'
import { requireObjectIdParam } from '~~/server/utils/params'

export default defineEventHandler(async (event) => {
  const id = requireObjectIdParam(event, 'id', 'pet')

  await connectDB()

  const pet = await getPublicPetById(id)

  return pet
})
