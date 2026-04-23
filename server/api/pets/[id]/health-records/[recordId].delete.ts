import mongoose from 'mongoose'
import { deleteRecord } from '~~/server/services/health-record.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const petId = getRouterParam(event, 'id')
  const recordId = getRouterParam(event, 'recordId')

  if (!petId || !mongoose.isValidObjectId(petId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pet ID' })
  }

  if (!recordId || !mongoose.isValidObjectId(recordId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid health record ID' })
  }

  await connectDB()

  await deleteRecord(session.user.id, recordId)

  return { message: 'Health record deleted successfully' }
})
