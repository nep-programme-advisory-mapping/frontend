import { describe, it, expect, vi } from 'vitest'

/**
 * BUG-11 regression guard: axios.ts and realtime/echo.ts used to each
 * hardcode a different fallback ('http://nep-server.org/api' vs
 * 'http://localhost:8000/api') for when VITE_API_BASE_URL is unset, so the
 * two could silently target different hosts. Both now import
 * API_BASE_URL from this one module — this test pins its fallback value
 * and confirms an explicit env var still wins.
 */
describe('API_BASE_URL', () => {
  it('falls back to the same-origin relative path when VITE_API_BASE_URL is unset', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.resetModules()
    const { API_BASE_URL } = await import('@/constants/apiBaseUrl')

    expect(API_BASE_URL).toBe('/api')
  })

  it('uses VITE_API_BASE_URL when it is set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.org/api')
    vi.resetModules()
    const { API_BASE_URL } = await import('@/constants/apiBaseUrl')

    expect(API_BASE_URL).toBe('https://api.example.org/api')
  })
})
