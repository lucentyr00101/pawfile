import { beforeAll, describe, expect, test } from 'bun:test'

// h3's createError is a Nitro auto-import; stub it for unit tests
beforeAll(() => {
  (globalThis as Record<string, unknown>).createError = (opts: { statusCode: number, statusMessage: string }) =>
    Object.assign(new Error(opts.statusMessage), opts)
})

const load = () => import('../server/utils/health-record')
const recordDate = new Date('2026-01-10T00:00:00.000Z')

describe('parseHealthRecordMetadata', () => {
  test('keeps only the record type\'s fields, trims strings, drops empties, parses dates', async () => {
    const { parseHealthRecordMetadata } = await load()
    const result = parseHealthRecordMetadata('vaccination', {
      vaccineName: '  Rabies ',
      batchNumber: '',
      clinicName: 'belongs to vet visits',
      nextDueDate: '2027-01-10',
      $where: 'ignored',
    }, recordDate)
    expect(result).toEqual({ vaccineName: 'Rabies', nextDueDate: new Date('2027-01-10') })
  })

  test('returns undefined for null/undefined', async () => {
    const { parseHealthRecordMetadata } = await load()
    expect(parseHealthRecordMetadata('vet_visit', null, recordDate)).toBeUndefined()
    expect(parseHealthRecordMetadata('vet_visit', undefined, recordDate)).toBeUndefined()
  })

  test.each([
    ['a non-object', 'text', 'metadata must be an object'],
    ['an array', [1], 'metadata must be an object'],
    ['a non-string field (operator injection)', { clinicName: { $gt: '' } }, 'metadata.clinicName must be a string'],
    ['an over-long field', { diagnosis: 'x'.repeat(2001) }, 'metadata.diagnosis must be 2000 characters or fewer'],
    ['an invalid date', { followUpDate: 'soon' }, 'metadata.followUpDate must be a valid date'],
    ['a follow-up before the visit', { followUpDate: '2026-01-01' }, 'metadata.followUpDate must be after date'],
  ])('rejects %s', async (_label, input, message) => {
    const { parseHealthRecordMetadata } = await load()
    expect(() => parseHealthRecordMetadata('vet_visit', input, recordDate)).toThrow(message)
  })
})

describe('parseHealthRecordNotes', () => {
  test('trims, clears on empty/null, and leaves undefined untouched', async () => {
    const { parseHealthRecordNotes } = await load()
    expect(parseHealthRecordNotes('  hi ')).toBe('hi')
    expect(parseHealthRecordNotes('   ')).toBeNull()
    expect(parseHealthRecordNotes(null)).toBeNull()
    expect(parseHealthRecordNotes(undefined)).toBeUndefined()
  })

  test('rejects non-strings and over-long notes', async () => {
    const { parseHealthRecordNotes } = await load()
    expect(() => parseHealthRecordNotes(42)).toThrow('notes must be a string')
    expect(() => parseHealthRecordNotes('x'.repeat(5001))).toThrow('notes must be 5000 characters or fewer')
  })
})
