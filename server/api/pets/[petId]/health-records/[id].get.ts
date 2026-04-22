import mongoose from 'mongoose'
import { getRecordById } from '~~/server/services/health-record.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const petId = getRouterParam(event, 'petId')
  const id = getRouterParam(event, 'id')

  if (!petId || !mongoose.isValidObjectId(petId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pet ID' })
  }

  if (!id || !mongoose.isValidObjectId(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid health record ID' })
  }

  await connectDB()

  return getRecordById(session.user.id, id)
})
