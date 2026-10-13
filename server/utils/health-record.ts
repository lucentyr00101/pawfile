import type {
  HealthRecordMetadata,
  HealthRecordType,
} from '~~/server/models/health-record.model'

const METADATA_FIELDS = {
  vet_visit: {
    strings: { clinicName: 200, vetName: 200, diagnosis: 2000 },
    dates: ['followUpDate'],
  },
  vaccination: {
    strings: { vaccineName: 200, batchNumber: 100 },
    dates: ['nextDueDate'],
  },
} as const satisfies Record<HealthRecordType, { strings: Record<string, number>, dates: readonly string[] }>

function badRequest(statusMessage: string): never {
  throw createError({ statusCode: 400, statusMessage })
}

/**
 * Validates client-supplied metadata for a record type and returns a clean object containing
 * only that type's fields. Empty strings are dropped, dates are parsed and must fall after
 * `recordDate`. Returns undefined for null/undefined input (i.e. "no metadata").
 */
export function parseHealthRecordMetadata(
  type: HealthRecordType,
  raw: unknown,
  recordDate: Date,
): HealthRecordMetadata | undefined {
  if (raw === undefined || raw === null) return undefined
  if (typeof raw !== 'object' || Array.isArray(raw)) badRequest('metadata must be an object')

  const input = raw as Record<string, unknown>
  const fields = METADATA_FIELDS[type]
  const result: Record<string, string | Date> = {}

  for (const [key, maxLength] of Object.entries(fields.strings)) {
    const value = input[key]
    if (value === undefined || value === null) continue
    if (typeof value !== 'string') badRequest(`metadata.${key} must be a string`)
    const trimmed = value.trim()
    if (trimmed.length > maxLength) badRequest(`metadata.${key} must be ${maxLength} characters or fewer`)
    if (trimmed) result[key] = trimmed
  }

  for (const key of fields.dates) {
    const value = input[key]
    if (value === undefined || value === null || value === '') continue
    const date = new Date(value as string)
    if (isNaN(date.getTime())) badRequest(`metadata.${key} must be a valid date`)
    if (date <= recordDate) badRequest(`metadata.${key} must be after date`)
    result[key] = date
  }

  return result as HealthRecordMetadata
}

/** Validates optional notes: a string (trimmed, ≤ 5000 chars) or null/'' to clear. */
export function parseHealthRecordNotes(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined
  if (raw === null) return null
  if (typeof raw !== 'string') badRequest('notes must be a string')
  const trimmed = raw.trim()
  if (trimmed.length > 5000) badRequest('notes must be 5000 characters or fewer')
  return trimmed || null
}
