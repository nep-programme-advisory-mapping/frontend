import { describe, it, expect } from 'vitest'
import { formatBudget, formatDate } from '@/utils/format'

describe('formatBudget', () => {
  it('returns the band label unchanged when present', () => {
    expect(formatBudget('$50k-$100k')).toBe('$50k-$100k')
  })

  it('returns an em-dash placeholder for null/undefined/empty', () => {
    expect(formatBudget(null)).toBe('—')
    expect(formatBudget(undefined)).toBe('—')
    expect(formatBudget('')).toBe('—')
  })
})

describe('formatDate', () => {
  it('returns an em-dash placeholder when no date is given', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('formats an ISO date as "D MMM YYYY" (en-GB)', () => {
    expect(formatDate('2026-01-15')).toBe('15 Jan 2026')
  })

  it('does not throw for an unparseable date (renders "Invalid Date" rather than crashing)', () => {
    // new Date('not-a-real-date') doesn't throw, and V8's toLocaleDateString
    // doesn't either — it returns the literal string "Invalid Date" — so
    // formatDate's try/catch fallback to the raw input is unreachable here.
    // Pinned so a future engine/format change is caught either way.
    expect(() => formatDate('not-a-real-date')).not.toThrow()
    expect(formatDate('not-a-real-date')).toBe('Invalid Date')
  })
})
