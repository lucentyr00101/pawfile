import { describe, expect, test } from 'bun:test'
import type { HealthRecord } from '../shared/types/models'
import { dueLabel, dueStatus, getDueItems } from '../app/utils/health'

// Local noon on 2026-10-13 — "today" for every test
const NOW = new Date(2026, 9, 13, 12)

let seq = 0
function record(partial: Partial<HealthRecord> & Pick<HealthRecord, 'type' | 'date'>): HealthRecord {
  seq++
  return { _id: `r${seq}`, petId: 'pet1', title: `Record ${seq}`, createdAt: partial.date, ...partial }
}

describe('dueStatus', () => {
  test('classifies by days remaining', () => {
    expect(dueStatus(-1)).toBe('overdue')
    expect(dueStatus(0)).toBe('due-soon')
    expect(dueStatus(7)).toBe('due-soon')
    expect(dueStatus(8)).toBe('ok')
  })
})

describe('dueLabel', () => {
  test('reads naturally', () => {
    expect(dueLabel(-1)).toBe('Overdue by 1 day')
    expect(dueLabel(-3)).toBe('Overdue by 3 days')
    expect(dueLabel(0)).toBe('Due today')
    expect(dueLabel(1)).toBe('Due tomorrow')
    expect(dueLabel(5)).toBe('Due in 5 days')
  })
})

describe('getDueItems', () => {
  test('a due date of today is "due today", not overdue (UTC-midnight storage)', () => {
    const r = record({ type: 'vaccination', date: '2025-10-13T00:00:00.000Z', metadata: { nextDueDate: '2026-10-13T00:00:00.000Z' } })
    const [item] = getDueItems([r], NOW)
    expect(item?.days).toBe(0)
    expect(item?.status).toBe('due-soon')
  })

  test('only the latest dose of a vaccine counts', () => {
    const oldDose = record({ type: 'vaccination', date: '2024-01-01T00:00:00.000Z', metadata: { vaccineName: 'Rabies', nextDueDate: '2025-01-01T00:00:00.000Z' } })
    const newDose = record({ type: 'vaccination', date: '2025-01-05T00:00:00.000Z', metadata: { vaccineName: 'rabies ', nextDueDate: '2026-01-05T00:00:00.000Z' } })
    const items = getDueItems([newDose, oldDose], NOW)
    expect(items.map(i => i.record._id)).toEqual([newDose._id])
    expect(items[0]?.status).toBe('overdue')
  })

  test('doses of different vaccines or pets are tracked separately', () => {
    const rabies = record({ type: 'vaccination', date: '2026-01-01T00:00:00.000Z', metadata: { vaccineName: 'Rabies', nextDueDate: '2027-01-01T00:00:00.000Z' } })
    const dhpp = record({ type: 'vaccination', date: '2026-02-01T00:00:00.000Z', metadata: { vaccineName: 'DHPP', nextDueDate: '2026-11-01T00:00:00.000Z' } })
    const otherPet = record({ type: 'vaccination', petId: 'pet2', date: '2026-03-01T00:00:00.000Z', metadata: { vaccineName: 'Rabies', nextDueDate: '2026-10-20T00:00:00.000Z' } })
    const items = getDueItems([rabies, dhpp, otherPet], NOW)
    // Sorted soonest first
    expect(items.map(i => i.record._id)).toEqual([otherPet._id, dhpp._id, rabies._id])
  })

  test('a follow-up is done once a later vet visit is logged', () => {
    const visit = record({ type: 'vet_visit', date: '2026-08-01T00:00:00.000Z', metadata: { followUpDate: '2026-09-01T00:00:00.000Z' } })
    expect(getDueItems([visit], NOW)).toHaveLength(1)

    const laterVisit = record({ type: 'vet_visit', date: '2026-09-02T00:00:00.000Z' })
    expect(getDueItems([visit, laterVisit], NOW)).toHaveLength(0)
  })

  test('records without due dates are ignored', () => {
    const r = record({ type: 'vet_visit', date: '2026-08-01T00:00:00.000Z' })
    expect(getDueItems([r], NOW)).toEqual([])
  })
})
