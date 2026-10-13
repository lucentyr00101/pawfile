import { getRecordById } from '~~/server/services/health-record.service'
import { requireObjectIdParam } from '~~/server/utils/params'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const petId = requireObjectIdParam(event, 'id', 'pet')
  const recordId = requireObjectIdParam(event, 'recordId', 'health record')

  await connectDB()

  return getRecordById(user.id, petId, recordId)
})
