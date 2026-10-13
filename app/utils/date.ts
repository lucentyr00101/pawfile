// Calendar dates (record dates, due dates, birthdays) are stored as UTC midnight of the chosen day.
// Always read their *UTC* components so they don't shift a day in other time zones.

const DAY_MS = 86_400_000

/** Formats a stored calendar date, e.g. "Oct 13, 2026" (short) or "October 13, 2026" (long). */
export function formatDate(value: string | Date, month: 'short' | 'long' = 'short'): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** Whole days from the user's local "today" to a stored calendar date (negative = past, 0 = today). */
export function daysUntil(value: string | Date, now: Date = new Date()): number {
  const target = new Date(value)
  const targetDay = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate())
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((targetDay - today) / DAY_MS)
}

/** Value for an <input type="date"> from a stored calendar date. */
export function toDateInputValue(value?: string | Date | null): string {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

/** "3 years old" / "5 months old" from a stored birthday. */
export function formatPetAge(birthday: string | Date, now: Date = new Date()): string {
  const birth = new Date(birthday)
  const by = birth.getUTCFullYear()
  const bm = birth.getUTCMonth()
  const bd = birth.getUTCDate()

  let months = (now.getFullYear() - by) * 12 + (now.getMonth() - bm)
  if (now.getDate() < bd) months--
  months = Math.max(months, 0)

  const years = Math.floor(months / 12)
  if (years >= 1) return `${years} ${years === 1 ? 'year' : 'years'} old`
  return `${months} ${months === 1 ? 'month' : 'months'} old`
}
