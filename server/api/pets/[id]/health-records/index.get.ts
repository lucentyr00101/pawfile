import type { HealthRecordType } from '~~/server/models/health-record.model'
import { getRecordsByPet, type GetRecordsFilters } from '~~/server/services/health-record.service'
import { requireObjectIdParam } from '~~/server/utils/params'

const ALLOWED_TYPES = ['vet_visit', 'vaccination'] as const satisfies readonly HealthRecordType[]

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const petId = requireObjectIdParam(event, 'id', 'pet')

  const { type } = getQuery(event)

  const filters: GetRecordsFilters = {}
  if (type !== undefined) {
    if (typeof type !== 'string' || !ALLOWED_TYPES.includes(type as HealthRecordType)) {
      throw createError({
        statusCode: 400,
        statusMessage: `type must be one of: ${ALLOWED_TYPES.join(', ')}`,
      })
    }
    filters.type = type as HealthRecordType
  }

  await connectDB()

  return getRecordsByPet(user.id, petId, filters)
})
