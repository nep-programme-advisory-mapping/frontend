import { computed } from 'vue'
import { useAuth } from './useAuth'

/**
 * Centralized frontend permission checks — wraps the auth store's
 * effective ability list (shipped by the backend on login/session/user).
 *
 * hasPermission()/hasAnyPermission() are the primary API; use them to hide
 * menu items, disable buttons, and guard routes. This is UI/UX only — the
 * backend's PermissionMiddleware is what actually enforces access on every
 * protected endpoint, so a hidden button never has to be "trusted".
 *
 * isAdmin/isCoordinator/isMember/hasRole remain for call sites that only
 * ever cared about the three built-in roles; prefer hasPermission() in new
 * code so a custom/dynamic role works without touching this file.
 */
export function usePermission() {
  const { userRole, isAuthenticated, isSuperAdmin, hasPermission, hasAnyPermission } = useAuth()

  const isAdmin = computed(() => userRole.value === 'nep_admin')
  const isCoordinator = computed(() => userRole.value === 'nep_coordinator')
  const isMember = computed(() => userRole.value === 'member_org')

  /**
   * Returns true if the current user's role matches any of the provided roles.
   */
  function hasRole(...roles: string[]): boolean {
    return roles.includes(userRole.value)
  }

  return {
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isCoordinator,
    isMember,
    hasRole,
    hasPermission,
    hasAnyPermission,
    userRole,
  }
}
