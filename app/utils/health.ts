import type { HealthRecord } from '#shared/types/models'
import { daysUntil } from './date'

export type DueStatus = 'overdue' | 'due-soon' | 'ok'
export type DueKind = 'vaccination' | 'follow_up'

export interface DueItem {
  record: HealthRecord
  kind: DueKind
  dueDate: string
  days: number
  status: DueStatus
}

/** Window (in days) in which an upcoming due date counts as "due soon". */
export const DUE_SOON_DAYS = 7

export function dueStatus(days: number): DueStatus {
  if (days < 0) return 'overdue'
  if (days <= DUE_SOON_DAYS) return 'due-soon'
  return 'ok'
}

function vaccineKey(record: HealthRecord): string {
  return `${record.petId}:${(record.metadata?.vaccineName || record.title).trim().toLowerCase()}`
}

/**
 * Due dates that still need action. A vaccination's next-due date only counts for the latest
 * dose of that vaccine (per pet); a vet follow-up only counts if no later visit was logged.
 * Sorted soonest (most overdue) first.
 */
export function getDueItems(records: HealthRecord[], now: Date = new Date()): DueItem[] {
  const latestDose = new Map<string, HealthRecord>()
  const lastVisit = new Map<string, number>()

  for (const r of records) {
    const time = new Date(r.date).getTime()
    if (r.type === 'vaccination') {
      const key = vaccineKey(r)
      const current = latestDose.get(key)
      if (!current || time > new Date(current.date).getTime()) latestDose.set(key, r)
    }
    else {
      lastVisit.set(r.petId, Math.max(lastVisit.get(r.petId) ?? 0, time))
    }
  }

  const items: DueItem[] = []
  for (const r of records) {
    let dueDate: string | undefined
    let kind: DueKind
    if (r.type === 'vaccination') {
      if (latestDose.get(vaccineKey(r)) !== r) continue
      dueDate = r.metadata?.nextDueDate
      kind = 'vaccination'
    }
    else {
      if ((lastVisit.get(r.petId) ?? 0) > new Date(r.date).getTime()) continue
      dueDate = r.metadata?.followUpDate
      kind = 'follow_up'
    }
    if (!dueDate) continue
    const days = daysUntil(dueDate, now)
    items.push({ record: r, kind, dueDate, days, status: dueStatus(days) })
  }

  return items.sort((a, b) => a.days - b.days)
}

/** Human label for a due date relative to today, e.g. "Overdue by 3 days", "Due today", "Due in 5 days". */
export function dueLabel(days: number): string {
  if (days < 0) return `Overdue by ${-days} ${days === -1 ? 'day' : 'days'}`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}
