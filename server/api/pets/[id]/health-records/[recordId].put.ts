import {
  getRecordById,
  updateRecord,
  type UpdateRecordInput,
} from '~~/server/services/health-record.service'
import { parseHealthRecordMetadata, parseHealthRecordNotes } from '~~/server/utils/health-record'
import { requireObjectIdParam } from '~~/server/utils/params'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const petId = requireObjectIdParam(event, 'id', 'pet')
  const recordId = requireObjectIdParam(event, 'recordId', 'health record')

  const body = await readBody(event)
  const { type, title, date, notes, metadata } = body ?? {}

  if (type !== undefined) {
    throw createError({ statusCode: 400, statusMessage: 'type cannot be changed after creation' })
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'title must be a non-empty string' })
    }
    if (title.trim().length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'title must be 200 characters or fewer' })
    }
  }

  let parsedDate: Date | undefined
  if (date !== undefined) {
    parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'date must be a valid date' })
    }
    if (parsedDate > new Date()) {
      throw createError({ statusCode: 400, statusMessage: 'date cannot be in the future' })
    }
  }

  const parsedNotes = parseHealthRecordNotes(notes)

  await connectDB()

  const existing = await getRecordById(user.id, petId, recordId)

  // Metadata is replaced wholesale when sent. When only the date changes, re-check the
  // existing due dates against it so they can't end up before the record date.
  const metadataSource = metadata !== undefined
    ? metadata
    : parsedDate ? existing.metadata?.toObject?.() : undefined
  const parsedMetadata = parseHealthRecordMetadata(existing.type, metadataSource, parsedDate ?? existing.date)

  const input: UpdateRecordInput = {}
  if (title !== undefined) input.title = title.trim()
  if (parsedDate !== undefined) input.date = parsedDate
  if (parsedNotes !== undefined) input.notes = parsedNotes
  if (metadata !== undefined) input.metadata = parsedMetadata ?? null

  return updateRecord(user.id, petId, recordId, input)
})
