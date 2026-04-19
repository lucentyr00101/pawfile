import mongoose from 'mongoose'
import type { HealthRecordType } from '~~/server/models/health-record.model'
import { getRecordsByPet, type GetRecordsFilters } from '~~/server/services/health-record.service'

const ALLOWED_TYPES = ['vet_visit', 'vaccination'] as const satisfies readonly HealthRecordType[]

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const petId = getRouterParam(event, 'petId')

  if (!petId || !mongoose.isValidObjectId(petId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pet ID' })
  }

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

  return getRecordsByPet(session.user.id, petId, filters)
})
