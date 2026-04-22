import {
  HealthRecord,
  type HealthRecordMetadata,
  type HealthRecordType,
} from '~~/server/models/health-record.model'
import { getPetById } from '~~/server/services/pet.service'
import { deleteFile } from '~~/server/utils/storage'

export interface CreateRecordInput {
  type: HealthRecordType
  title: string
  date: Date
  notes?: string
  metadata?: HealthRecordMetadata
  attachments?: string[]
}

export type UpdateRecordInput = Partial<CreateRecordInput>

export interface GetRecordsFilters {
  type?: HealthRecordType
}

export async function createRecord(userId: string, petId: string, data: CreateRecordInput) {
  await getPetById(petId, userId)
  return HealthRecord.create({ userId, petId, ...data })
}

export async function getRecordsByPet(
  userId: string,
  petId: string,
  filters: GetRecordsFilters = {},
) {
  await getPetById(petId, userId)
  const query: Record<string, unknown> = { petId, userId }
  if (filters.type) query.type = filters.type
  return HealthRecord.find(query).sort({ date: -1 })
}

export async function getRecordById(userId: string, recordId: string) {
  const record = await HealthRecord.findOne({ _id: recordId, userId })
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Health record not found' })
  }
  return record
}

export async function updateRecord(userId: string, recordId: string, data: UpdateRecordInput) {
  const record = await HealthRecord.findOneAndUpdate({ _id: recordId, userId }, data, {
    new: true,
    runValidators: true,
  })
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Health record not found' })
  }
  return record
}

export async function addAttachment(userId: string, petId: string, recordId: string, fileUrl: string) {
  const record = await HealthRecord.findOneAndUpdate(
    { _id: recordId, userId, petId },
    { $push: { attachments: fileUrl } },
    { new: true },
  )
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Health record not found' })
  }
  return record
}

export async function removeAttachment(userId: string, petId: string, recordId: string, url: string) {
  const record = await HealthRecord.findOne({ _id: recordId, userId, petId })
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Health record not found' })
  }

  if (!record.attachments?.includes(url)) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment not found in health record' })
  }

  await deleteFile(url)

  const updated = await HealthRecord.findOneAndUpdate(
    { _id: recordId, userId, petId },
    { $pull: { attachments: url } },
    { new: true },
  )

  return updated
}

export async function deleteRecord(userId: string, recordId: string) {
  const record = await HealthRecord.findOneAndDelete({ _id: recordId, userId })
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Health record not found' })
  }

  if (record.attachments?.length) {
    // Best-effort: record is already deleted, so orphaned blobs are preferable to a failed API response.
    await Promise.allSettled(record.attachments.map((url: string) => deleteFile(url)))
  }

  return record
}
