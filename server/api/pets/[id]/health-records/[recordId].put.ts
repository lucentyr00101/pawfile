import mongoose from 'mongoose'
import {
  getRecordById,
  updateRecord,
  type UpdateRecordInput,
} from '~~/server/services/health-record.service'
import { parseHealthRecordMetadata, parseHealthRecordNotes } from '~~/server/utils/health-record'

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

  const existing = await getRecordById(session.user.id, recordId)

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

  return updateRecord(session.user.id, recordId, input)
})
