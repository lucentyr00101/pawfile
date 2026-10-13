import { removeAttachment } from '~~/server/services/health-record.service'
import { requireObjectIdParam } from '~~/server/utils/params'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const petId = requireObjectIdParam(event, 'id', 'pet')
  const recordId = requireObjectIdParam(event, 'recordId', 'health record')

  const body = await readBody(event)
  const url = body?.url

  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'url is required' })
  }

  await connectDB()

  return removeAttachment(user.id, petId, recordId, url)
})
