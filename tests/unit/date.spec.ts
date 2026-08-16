import { describe, it, expect, vi, afterEach } from 'vitest'
import { monthsSince, formatRelativeTime } from '@/utils/date'

describe('monthsSince', () => {
  afterEach(() => vi.useRealTimers())

  it('returns 0 for a missing date', () => {
    expect(monthsSince(undefined)).toBe(0)
  })

  it('counts whole calendar months between the date and now', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-12T00:00:00Z'))

    expect(monthsSince('2026-05-12')).toBe(3)
    expect(monthsSince('2025-08-12')).toBe(12)
  })
})

describe('formatRelativeTime', () => {
  afterEach(() => vi.useRealTimers())

  it('returns an empty string for a missing date', () => {
    expect(formatRelativeTime(undefined)).toBe('')
  })

  it('labels same-day dates as "today"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-12T12:00:00Z'))

    expect(formatRelativeTime('2026-08-12T08:00:00Z')).toBe('today')
  })

  it('labels exactly one day ago as "yesterday"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-12T12:00:00Z'))

    expect(formatRelativeTime('2026-08-11T12:00:00Z')).toBe('yesterday')
  })

  it('labels 2-29 days ago in days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-12T12:00:00Z'))

    expect(formatRelativeTime('2026-08-05T12:00:00Z')).toBe('7 days ago')
  })

  it('labels 30+ days ago in months', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-12T12:00:00Z'))

    expect(formatRelativeTime('2026-06-01T12:00:00Z')).toBe('2 months ago')
  })

  it('labels a year or more ago in years, pluralised', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-12T12:00:00Z'))

    expect(formatRelativeTime('2024-08-12T12:00:00Z')).toBe('2 years ago')
    expect(formatRelativeTime('2025-06-12T12:00:00Z')).toBe('1 year ago')
  })
})
