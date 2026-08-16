import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { connectRealtimeForRole, disconnectRealtime } from '@/realtime'
import { useNotificationStore } from '@/stores/notification'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref<boolean>(sessionStorage.getItem('isLoggedIn') === 'true')
  const currentUserId = ref<string | null>(sessionStorage.getItem('currentUserId'))
  const currentUser = ref<Record<string, unknown> | null>(null)
  const authError = ref('')
  const networkError = ref('')
  const fieldErrors = ref<Record<string, string[]>>({})
  const loading = ref(false)
  const fetchingUser = ref(false)
  const loggingOut = ref(false)
  const userRole = ref<string>(sessionStorage.getItem('userRole') ?? '')
  // The backend computes this user's effective ability list (role-derived or
  // direct overrides, super admin implicitly holding everything) and ships
  // it on login/session/user responses — see User::effectivePermissionNames().
  const permissions = ref<string[]>(JSON.parse(sessionStorage.getItem('permissions') ?? '[]'))
  const isSuperAdmin = ref<boolean>(sessionStorage.getItem('isSuperAdmin') === 'true')

  const isAuthenticated = computed(() => isLoggedIn.value)
  // Legacy role-name convenience getters — kept for call sites that only
  // ever cared about the three built-in roles. New code should prefer
  // hasPermission() so a custom/dynamic role works without a code change.
  const isAdmin = computed(() => userRole.value === 'nep_admin')
  const isCoordinatorOrAdmin = computed(() => ['nep_admin', 'nep_coordinator'].includes(userRole.value))

  /**
   * The single source of truth for "can this user do X" on the frontend.
   * This is UI/UX only — hiding a button never substitutes for the backend's
   * PermissionMiddleware, which enforces the real authorization on every
   * protected endpoint regardless of what the UI shows.
   */
  function hasPermission(permission: string): boolean {
    if (isSuperAdmin.value) return true
    return permissions.value.includes(permission)
  }

  /** True if the user holds any of the given permissions. */
  function hasAnyPermission(...perms: string[]): boolean {
    return perms.some((p) => hasPermission(p))
  }

  function clearErrors() {
    authError.value = ''
    networkError.value = ''
    fieldErrors.value = {}
  }

  function rememberUser(user: Record<string, unknown> | null) {
    currentUser.value = user
    userRole.value = typeof user?.role === 'string' ? user.role : ''
    currentUserId.value = user?.id ? String(user.id) : null
    isLoggedIn.value = Boolean(user)
    const rawPerms = Array.isArray(user?.permissions) ? user.permissions : []
    permissions.value = rawPerms.map((p: unknown) =>
      typeof p === 'string' ? p : (p as { name: string }).name
    )
    isSuperAdmin.value = Boolean(user?.is_super_admin)

    if (user) {
      sessionStorage.setItem('isLoggedIn', 'true')
      sessionStorage.setItem('userRole', userRole.value)
      sessionStorage.setItem('permissions', JSON.stringify(permissions.value))
      sessionStorage.setItem('isSuperAdmin', String(isSuperAdmin.value))
      if (currentUserId.value) sessionStorage.setItem('currentUserId', currentUserId.value)
      connectRealtimeForRole(userRole.value, currentUserId.value).catch(err => {
        console.error('[Auth] Failed to connect realtime:', err)
      })
    } else {
      disconnectRealtime()
      localStorage.removeItem('token')
      sessionStorage.removeItem('isLoggedIn')
      sessionStorage.removeItem('userRole')
      sessionStorage.removeItem('currentUserId')
      sessionStorage.removeItem('permissions')
      sessionStorage.removeItem('isSuperAdmin')
    }
  }

  function clearAuthState(redirectToLogin = false) {
    if (redirectToLogin && window.location.pathname !== '/login') {
      sessionStorage.removeItem('isLoggedIn')
      sessionStorage.removeItem('userRole')
      sessionStorage.removeItem('currentUserId')
      try {
        disconnectRealtime()
        useNotificationStore().stopPolling()
      } catch (err) {
        console.error('Failed to disconnect realtime:', err)
      }
      window.location.assign('/login')
      return
    }
    rememberUser(null)
  }

  let loginPromise: Promise<boolean> | null = null
  let fetchUserPromise: Promise<unknown> | null = null

  async function login(email: string, password: string) {
    if (loginPromise) return loginPromise
    loginPromise = _doLogin(email, password).finally(() => { loginPromise = null })
    return loginPromise
  }

  async function _doLogin(email: string, password: string): Promise<boolean> {
    loading.value = true
    clearErrors()
    try {
      await authApi.getCsrfCookie()
      const response = await authApi.login({ email, password })
      const token = response.data.token
      if (token) localStorage.setItem('token', token)
      rememberUser(response.data.user ?? null)
      return true
    } catch (error) {
      const axiosError = error as {
        code?: string
        message?: string
        response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }
      }
      const res = axiosError.response
      if (!res || axiosError.code === 'ERR_NETWORK' || axiosError.message?.includes('Network Error') || axiosError.code === 'ECONNREFUSED') {
        networkError.value = 'Unable to connect to the server. Please check your internet connection or try again later.'
        return false
      }
      if (res.status === 401) {
        authError.value = 'Invalid email or password.'
        return false
      }
      if (res.status === 422 && res.data?.errors) {
        fieldErrors.value = res.data.errors
        authError.value = res.data.message ?? 'Please correct the errors below.'
        return false
      }
      authError.value = res.data?.message ?? 'Something went wrong on database. Please try again.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (loggingOut.value) return
    loggingOut.value = true
    authApi.logout().catch((err) => {
      console.error('Failed to notify backend on logout:', err)
    })
    clearAuthState(true)
  }

  async function fetchCurrentUser() {
    if (fetchUserPromise) return fetchUserPromise
    fetchUserPromise = _doFetchUser().finally(() => { fetchUserPromise = null })
    return fetchUserPromise
  }

  async function _doFetchUser() {
    fetchingUser.value = true
    try {
      const response = await authApi.getUser()
      const user = response.data.data || response.data
      rememberUser(user ?? null)
      return user
    } catch (error) {
      console.error('Failed to fetch current user profile:', error)
      clearAuthState(false)
      throw error
    } finally {
      fetchingUser.value = false
    }
  }

  async function changePassword(payload: { current_password: string; new_password: string; new_password_confirmation: string }) {
    loading.value = true
    clearErrors()
    try {
      await authApi.changePassword(payload)
      return { success: true as const }
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }
      }
      const res = axiosError.response
      if (res?.status === 401) {
        authError.value = 'Current password is incorrect'
      } else if (res?.status === 422 && res.data?.errors) {
        fieldErrors.value = res.data.errors
        authError.value = res.data.message ?? 'Please correct the errors below.'
      } else {
        authError.value = res?.data?.message ?? 'Failed to update password. Please try again.'
      }
      return { success: false as const, error: authError.value }
    } finally {
      loading.value = false
    }
  }

  return {
    isLoggedIn,
    currentUserId,
    currentUser,
    authError,
    networkError,
    fieldErrors,
    loading,
    isAuthenticated,
    isAdmin,
    isCoordinatorOrAdmin,
    userRole,
    permissions,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    login,
    logout,
    clearAuthState,
    clearErrors,
    fetchCurrentUser,
    changePassword,
  }
})

