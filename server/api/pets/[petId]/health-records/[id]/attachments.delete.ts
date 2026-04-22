import mongoose from 'mongoose'
import { removeAttachment } from '~~/server/services/health-record.service'

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

  const body = await readBody(event)
  const url = body?.url

  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'url is required' })
  }

  await connectDB()

  return removeAttachment(session.user.id, petId, id, url)
})
