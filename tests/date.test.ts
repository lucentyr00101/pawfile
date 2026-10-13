import { describe, expect, test } from 'bun:test'
import { daysUntil, formatDate, formatPetAge, toDateInputValue } from '../app/utils/date'

describe('formatDate', () => {
  test('uses the stored calendar day regardless of local time zone', () => {
    expect(formatDate('2026-03-01T00:00:00.000Z')).toBe('Mar 1, 2026')
    expect(formatDate('2026-03-01T00:00:00.000Z', 'long')).toBe('March 1, 2026')
  })
})

describe('daysUntil', () => {
  const now = new Date(2026, 9, 13, 23, 30) // late evening local time

  test('counts whole calendar days from local today', () => {
    expect(daysUntil('2026-10-13T00:00:00.000Z', now)).toBe(0)
    expect(daysUntil('2026-10-14T00:00:00.000Z', now)).toBe(1)
    expect(daysUntil('2026-10-10T00:00:00.000Z', now)).toBe(-3)
  })

  test('accepts plain YYYY-MM-DD input values', () => {
    expect(daysUntil('2026-10-15', now)).toBe(2)
  })
})

describe('toDateInputValue', () => {
  test('formats for <input type="date">', () => {
    expect(toDateInputValue('2026-10-13T00:00:00.000Z')).toBe('2026-10-13')
    expect(toDateInputValue(null)).toBe('')
  })
})

describe('formatPetAge', () => {
  const now = new Date(2026, 9, 13)

  test('years once at least one year old', () => {
    expect(formatPetAge('2023-10-13T00:00:00.000Z', now)).toBe('3 years old')
    expect(formatPetAge('2025-10-13T00:00:00.000Z', now)).toBe('1 year old')
  })

  test('months for younger pets, not counting an unfinished month', () => {
    expect(formatPetAge('2026-05-14T00:00:00.000Z', now)).toBe('4 months old')
    expect(formatPetAge('2026-09-13T00:00:00.000Z', now)).toBe('1 month old')
    expect(formatPetAge('2026-10-01T00:00:00.000Z', now)).toBe('0 months old')
  })
})
