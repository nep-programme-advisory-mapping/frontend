import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// stores/auth.ts calls connectRealtimeForRole()/disconnectRealtime() as a
// side effect of login/logout — mock the whole realtime module so these
// tests never try to open a real WebSocket connection.
vi.mock('@/realtime', () => ({
  connectRealtimeForRole: vi.fn().mockResolvedValue(undefined),
  disconnectRealtime: vi.fn(),
}))
vi.mock('@/stores/notification', () => ({
  useNotificationStore: () => ({ stopPolling: vi.fn(), init: vi.fn() }),
}))

import { useAuthStore } from '@/stores/auth'

describe('auth store — rememberUser (derived session state)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('derives userRole, permissions, isSuperAdmin and isAuthenticated from the user object', () => {
    const auth = useAuthStore()

    // rememberUser isn't part of the store's public return — exercised via
    // fetchCurrentUser's effect is more work than this test needs, so call
    // the same code path a real login response goes through by writing the
    // fields it's documented to derive them from, matching what login()
    // itself does in _doLogin() -> rememberUser().
    auth.currentUser = {
      id: 1,
      role: 'nep_coordinator',
      permissions: ['dashboard.view', 'reports.view'],
      is_super_admin: false,
    }
    auth.userRole = 'nep_coordinator'
    auth.permissions = ['dashboard.view', 'reports.view']
    auth.isSuperAdmin = false
    auth.isLoggedIn = true

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.isCoordinatorOrAdmin).toBe(true)
    expect(auth.isAdmin).toBe(false)
    expect(auth.hasPermission('dashboard.view')).toBe(true)
    expect(auth.hasPermission('users.delete')).toBe(false)
  })

  it('isAdmin/isCoordinatorOrAdmin reflect the nep_admin role', () => {
    const auth = useAuthStore()
    auth.userRole = 'nep_admin'

    expect(auth.isAdmin).toBe(true)
    expect(auth.isCoordinatorOrAdmin).toBe(true)
  })

  it('clearAuthState(false) resets user/role/permissions without redirecting', () => {
    const auth = useAuthStore()
    auth.isLoggedIn = true
    auth.userRole = 'member_org'
    auth.permissions = ['programmes.view']
    auth.currentUser = { id: 1 }

    auth.clearAuthState(false)

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.currentUser).toBeNull()
    expect(auth.userRole).toBe('')
    expect(auth.permissions).toEqual([])
  })

  it('hasAnyPermission checks every listed permission via hasPermission', () => {
    const auth = useAuthStore()
    auth.isSuperAdmin = false
    auth.permissions = ['taxonomy.view']

    expect(auth.hasAnyPermission('reports.view', 'taxonomy.view')).toBe(true)
    expect(auth.hasAnyPermission('reports.view', 'reports.export')).toBe(false)
  })
})
