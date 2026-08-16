import { describe, it, expect } from 'vitest'
import { unwrapData } from '@/utils/apiHelpers'

describe('unwrapData', () => {
  it('returns the nested .data when present (typical Laravel resource response)', () => {
    expect(unwrapData({ data: { id: 1, name: 'Entry' } })).toEqual({ id: 1, name: 'Entry' })
  })

  it('returns the payload itself when there is no .data key', () => {
    const payload = { id: 1, name: 'Entry' }
    expect(unwrapData(payload)).toEqual(payload)
  })

  it('returns the payload as-is when .data is falsy but present', () => {
    // Nullish coalescing: an explicit `data: null` should fall through to
    // the whole payload rather than returning null.
    expect(unwrapData({ data: null, message: 'ok' })).toEqual({ data: null, message: 'ok' })
  })

  it('handles null/undefined input without throwing', () => {
    expect(unwrapData(null)).toBeNull()
    expect(unwrapData(undefined)).toBeUndefined()
  })

  it('unwraps a paginated list response only one level deep', () => {
    const paginated = { data: [{ id: 1 }, { id: 2 }], current_page: 1, total: 2 }
    expect(unwrapData(paginated)).toEqual([{ id: 1 }, { id: 2 }])
  })
})
