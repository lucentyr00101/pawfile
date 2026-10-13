import type { HealthRecordType } from '~~/server/models/health-record.model'
import { createRecord, type CreateRecordInput } from '~~/server/services/health-record.service'
import { parseHealthRecordMetadata, parseHealthRecordNotes } from '~~/server/utils/health-record'
import { requireObjectIdParam } from '~~/server/utils/params'

const ALLOWED_TYPES = ['vet_visit', 'vaccination'] as const satisfies readonly HealthRecordType[]

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const petId = requireObjectIdParam(event, 'id', 'pet')

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

  if (title.trim().length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'title must be 200 characters or fewer' })
  }

  const parsedMetadata = parseHealthRecordMetadata(type as HealthRecordType, metadata, parsedDate)
  const parsedNotes = parseHealthRecordNotes(notes)

  await connectDB()

  const input: CreateRecordInput = {
    type: type as HealthRecordType,
    title: title.trim(),
    date: parsedDate,
  }
  if (parsedNotes) input.notes = parsedNotes
  if (parsedMetadata) input.metadata = parsedMetadata

  const record = await createRecord(user.id, petId, input)

  setResponseStatus(event, 201)
  return record
})
