import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePermission } from '@/composables/usePermission'
import { useAuthStore } from '@/stores/auth'

describe('usePermission', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('grants every permission to a super admin regardless of their ability list', () => {
    const auth = useAuthStore()
    auth.isSuperAdmin = true
    auth.permissions = []

    const { hasPermission, hasAnyPermission } = usePermission()

    expect(hasPermission('users.delete')).toBe(true)
    expect(hasAnyPermission('anything.at.all')).toBe(true)
  })

  it('hasPermission only allows permissions present in the ability list for a non-super-admin', () => {
    const auth = useAuthStore()
    auth.isSuperAdmin = false
    auth.permissions = ['programmes.view', 'programmes.create']

    const { hasPermission } = usePermission()

    expect(hasPermission('programmes.view')).toBe(true)
    expect(hasPermission('programmes.delete')).toBe(false)
  })

  it('hasAnyPermission is true if the user holds at least one of the listed permissions', () => {
    const auth = useAuthStore()
    auth.isSuperAdmin = false
    auth.permissions = ['dashboard.view']

    const { hasAnyPermission } = usePermission()

    expect(hasAnyPermission('reports.view', 'dashboard.view')).toBe(true)
    expect(hasAnyPermission('reports.view', 'reports.export')).toBe(false)
  })

  it('derives isAdmin/isCoordinator/isMember from the built-in role names', () => {
    const auth = useAuthStore()
    auth.userRole = 'nep_coordinator'

    const { isAdmin, isCoordinator, isMember } = usePermission()

    expect(isAdmin.value).toBe(false)
    expect(isCoordinator.value).toBe(true)
    expect(isMember.value).toBe(false)
  })

  it('hasRole matches against any of the given role names', () => {
    const auth = useAuthStore()
    auth.userRole = 'member_org'

    const { hasRole } = usePermission()

    expect(hasRole('nep_admin', 'member_org')).toBe(true)
    expect(hasRole('nep_admin', 'nep_coordinator')).toBe(false)
  })

  it('a custom (non-built-in) role holds no permission until granted one explicitly', () => {
    const auth = useAuthStore()
    auth.userRole = 'regional_reviewer'
    auth.isSuperAdmin = false
    auth.permissions = []

    const { isAdmin, isCoordinator, isMember, hasPermission } = usePermission()

    expect(isAdmin.value).toBe(false)
    expect(isCoordinator.value).toBe(false)
    expect(isMember.value).toBe(false)
    expect(hasPermission('reports.view')).toBe(false)

    auth.permissions = ['reports.view']
    expect(hasPermission('reports.view')).toBe(true)
  })
})
