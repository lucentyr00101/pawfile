import mongoose from 'mongoose'
import type { HealthRecordMetadata } from '~~/server/models/health-record.model'
import {
  getRecordById,
  updateRecord,
  type UpdateRecordInput,
} from '~~/server/services/health-record.service'

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

  await connectDB()

  const existing = await getRecordById(session.user.id, recordId)

  if (existing.type === 'vaccination' && metadata?.nextDueDate !== undefined) {
    const nextDueDate = new Date(metadata.nextDueDate)
    if (isNaN(nextDueDate.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'metadata.nextDueDate must be a valid date',
      })
    }
    const baseDate = parsedDate ?? existing.date
    if (nextDueDate <= baseDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'metadata.nextDueDate must be after date',
      })
    }
  }

  const input: UpdateRecordInput = {}
  if (title !== undefined) input.title = title.trim()
  if (parsedDate !== undefined) input.date = parsedDate
  if (notes !== undefined) input.notes = notes
  if (metadata !== undefined) input.metadata = metadata as HealthRecordMetadata

  return updateRecord(session.user.id, recordId, input)
})
