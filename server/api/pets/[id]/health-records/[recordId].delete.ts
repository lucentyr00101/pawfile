import { deleteRecord } from '~~/server/services/health-record.service'
import { requireObjectIdParam } from '~~/server/utils/params'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const petId = requireObjectIdParam(event, 'id', 'pet')
  const recordId = requireObjectIdParam(event, 'recordId', 'health record')

  await connectDB()

  await deleteRecord(user.id, petId, recordId)

  return { message: 'Health record deleted successfully' }
})
