import mongoose from 'mongoose'
import { getPublicPetById } from '~~/server/services/pet.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || !mongoose.isValidObjectId(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pet ID' })
  }

  await connectDB()

  const pet = await getPublicPetById(id)

  return pet
})
