import mongoose from 'mongoose'
import type {
  HealthRecordType,
  HealthRecordMetadata,
} from '~~/server/models/health-record.model'
import { createRecord, type CreateRecordInput } from '~~/server/services/health-record.service'

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

  const body = await readBody(event)
  const { type, title, date, notes, metadata } = body ?? {}

  if (!type || !title || !date) {
    throw createError({ statusCode: 400, statusMessage: 'type, title, and date are required' })
  }

  if (!ALLOWED_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `type must be one of: ${ALLOWED_TYPES.join(', ')}`,
    })
  }

  if (typeof title !== 'string' || title.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'title must be a non-empty string' })
  }

  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'date must be a valid date' })
  }
  if (parsedDate > new Date()) {
    throw createError({ statusCode: 400, statusMessage: 'date cannot be in the future' })
  }

  if (type === 'vaccination' && metadata?.nextDueDate !== undefined) {
    const nextDueDate = new Date(metadata.nextDueDate)
    if (isNaN(nextDueDate.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'metadata.nextDueDate must be a valid date',
      })
    }
    if (nextDueDate <= parsedDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'metadata.nextDueDate must be after date',
      })
    }
  }

  await connectDB()

  const input: CreateRecordInput = {
    type: type as HealthRecordType,
    title: title.trim(),
    date: parsedDate,
  }
  if (notes !== undefined) input.notes = notes
  if (metadata !== undefined) input.metadata = metadata as HealthRecordMetadata

  const record = await createRecord(session.user.id, petId, input)

  setResponseStatus(event, 201)
  return record
})
