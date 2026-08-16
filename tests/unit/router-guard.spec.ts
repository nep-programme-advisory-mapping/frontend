import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { authGuard } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'

/** Builds just enough of a RouteLocationNormalized for the guard to read (.name, .meta). */
function toRoute(partial: { name?: string; meta?: Record<string, unknown> }): RouteLocationNormalized {
  return {
    name: partial.name,
    meta: partial.meta ?? {},
    path: '/',
    fullPath: '/',
    hash: '',
    query: {},
    params: {},
    matched: [],
    redirectedFrom: undefined,
  } as unknown as RouteLocationNormalized
}

describe('router authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    // init() would otherwise hit the real notifications API.
    vi.spyOn(useNotificationStore(), 'init').mockImplementation(async () => {})
  })

  it('redirects an unauthenticated user away from a route that requires auth', async () => {
    const auth = useAuthStore()
    auth.isLoggedIn = false

    const result = await authGuard(toRoute({ name: 'admin-dashboard', meta: { requiresAuth: true } }))

    expect(result).toEqual({ name: 'login' })
  })

  it('lets an unauthenticated user reach a route that does not require auth', async () => {
    const auth = useAuthStore()
    auth.isLoggedIn = false

    const result = await authGuard(toRoute({ name: 'login', meta: { requiresAuth: false } }))

    expect(result).toBe(true)
  })

  it('bounces an already-authenticated admin away from /login to the admin dashboard', async () => {
    const auth = useAuthStore()
    auth.isLoggedIn = true
    auth.userRole = 'nep_admin'
    auth.currentUser = { id: 1, role: 'nep_admin' }

    const result = await authGuard(toRoute({ name: 'login', meta: { requiresAuth: false } }))

    expect(result).toEqual({ name: 'admin-dashboard' });
  })

  it('bounces an already-authenticated coordinator away from /login to the manager dashboard', async () => {
    const auth = useAuthStore()
    auth.isLoggedIn = true
    auth.userRole = 'nep_coordinator'
    auth.currentUser = { id: 1, role: 'nep_coordinator' }

    const result = await authGuard(toRoute({ name: 'login', meta: { requiresAuth: false } }))

    expect(result).toEqual({ name: 'manager-dashboard' })
  })

  it('bounces every other authenticated role away from /login to the member dashboard', async () => {
    const auth = useAuthStore()
    auth.isLoggedIn = true
    auth.userRole = 'member_org'
    auth.currentUser = { id: 1, role: 'member_org' }

    const result = await authGuard(toRoute({ name: 'login', meta: { requiresAuth: false } }))

    expect(result).toEqual({ name: 'dashboard' })
  })

  it('fetches the current user when authenticated but not yet loaded, then proceeds', async () => {
    const auth = useAuthStore()
    auth.isLoggedIn = true
    auth.userRole = 'member_org'
    auth.currentUser = null
    auth.fetchCurrentUser = vi.fn().mockResolvedValue(undefined)

    const result = await authGuard(toRoute({ name: 'dashboard', meta: { requiresAuth: true } }))

    expect(auth.fetchCurrentUser).toHaveBeenCalledTimes(1)
    expect(result).toBe(true)
  })

  it('logs the user out and redirects to login if fetching the current user fails', async () => {
    const auth = useAuthStore()
    auth.isLoggedIn = true
    auth.currentUser = null
    auth.fetchCurrentUser = vi.fn().mockRejectedValue(new Error('401'))
    auth.clearAuthState = vi.fn()

    const result = await authGuard(toRoute({ name: 'dashboard', meta: { requiresAuth: true } }))

    expect(auth.clearAuthState).toHaveBeenCalledWith(false)
    expect(result).toEqual({ name: 'login' })
  })

  describe('permission-based guard', () => {
    it('blocks a user missing the required permission', async () => {
      const auth = useAuthStore()
      auth.isLoggedIn = true
      auth.currentUser = { id: 1 }
      auth.isSuperAdmin = false
      auth.permissions = ['programmes.view']

      const result = await authGuard(toRoute({ name: 'admin-users', meta: { requiresAuth: true, permission: 'users.view' } }))

      expect(result).toEqual({ name: 'forbidden' })
    })

    it('allows a user who holds the required permission', async () => {
      const auth = useAuthStore()
      auth.isLoggedIn = true
      auth.currentUser = { id: 1 }
      auth.isSuperAdmin = false
      auth.permissions = ['users.view']

      const result = await authGuard(toRoute({ name: 'admin-users', meta: { requiresAuth: true, permission: 'users.view' } }))

      expect(result).toBe(true)
    })

    it('a super admin bypasses the permission check even with an empty ability list', async () => {
      const auth = useAuthStore()
      auth.isLoggedIn = true
      auth.currentUser = { id: 1 }
      auth.isSuperAdmin = true
      auth.permissions = []

      const result = await authGuard(toRoute({ name: 'admin-users', meta: { requiresAuth: true, permission: 'users.view' } }))

      expect(result).toBe(true)
    })

    it('accepts any one of several permissions when meta.permission is an array', async () => {
      const auth = useAuthStore()
      auth.isLoggedIn = true
      auth.currentUser = { id: 1 }
      auth.isSuperAdmin = false
      auth.permissions = ['reports.export']

      const result = await authGuard(
        toRoute({ name: 'reports', meta: { requiresAuth: true, permission: ['reports.view', 'reports.export'] } }),
      )

      expect(result).toBe(true)
    })
  })

  describe('legacy role-based guard', () => {
    it('blocks a role not present in meta.roles', async () => {
      const auth = useAuthStore()
      auth.isLoggedIn = true
      auth.currentUser = { id: 1 }
      auth.userRole = 'member_org'

      const result = await authGuard(
        toRoute({ name: 'admin-taxonomy', meta: { requiresAuth: true, roles: ['nep_admin'] } }),
      )

      expect(result).toEqual({ name: 'forbidden' })
    })

    it('allows a role present in meta.roles', async () => {
      const auth = useAuthStore()
      auth.isLoggedIn = true
      auth.currentUser = { id: 1 }
      auth.userRole = 'nep_admin'

      const result = await authGuard(
        toRoute({ name: 'admin-taxonomy', meta: { requiresAuth: true, roles: ['nep_admin'] } }),
      )

      expect(result).toBe(true)
    })
  })
})
