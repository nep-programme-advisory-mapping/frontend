import { ref } from 'vue'
import { userService } from '@/services/user.service'
import type { OrganisationOption } from '@/types/user'
import { useToast } from '@/utils/toast'
import type { User, CreateUserPayload, UpdateUserPayload } from '@/types/user'

/**
 * Composable that manages users API requests, pagination, search, and validation.
 */
export function useUsers() {
  const toast = useToast()

  const users = ref<User[]>([])
  const organisations = ref<OrganisationOption[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  // Search and Pagination State
  const searchQuery = ref('')
  const roleFilter = ref('')
  const statusFilter = ref('')
  const currentPage = ref(1)
  const lastPage = ref(1)
  const totalItems = ref(0)
  const perPage = ref(50)

  // Validation/Error States
  const fieldErrors = ref<Record<string, string[]>>({})

  /** Clear any validation or field errors. */
  function clearErrors() {
    fieldErrors.value = {}
  }

  let _fetchOrgsPromise: Promise<void> | null = null

  /** Fetch available organisations for selection. */
  async function fetchOrganisations(): Promise<void> {
    if (_fetchOrgsPromise) return _fetchOrgsPromise
    _fetchOrgsPromise = (async () => {
      try {
        const res = await userService.getOrganisations()
        organisations.value = res.data.data ?? []
      } catch (err) {
        console.error('Failed to load organisations:', err)
      } finally {
        _fetchOrgsPromise = null
      }
    })()
    return _fetchOrgsPromise
  }

  let _fetchUsersPromise: Promise<void> | null = null
  let _fetchUsersPage = 1

  /** Fetch the paginated and filtered list of users from backend. */
  async function fetchUsers(page = currentPage.value): Promise<void> {
    if (_fetchUsersPromise && _fetchUsersPage === page) return _fetchUsersPromise
    _fetchUsersPage = page
    _fetchUsersPromise = (async () => {
      isLoading.value = true
      clearErrors()
      try {
        const res = await userService.getUsers(page, searchQuery.value, {
          role: roleFilter.value || undefined,
          status: statusFilter.value || undefined,
          per_page: perPage.value,
        })
        const payload = res.data

        users.value = payload.data ?? []
        currentPage.value = payload.current_page ?? 1
        lastPage.value = payload.last_page ?? 1
        totalItems.value = payload.total ?? 0
        perPage.value = payload.per_page ?? 50
      } catch (err: any) {
        if (err.response?.status === 403) {
          toast.error('Access denied. Admin only.')
        } else {
          toast.error('Failed to load users. Please try again.')
        }
      } finally {
        isLoading.value = false
        if (_fetchUsersPage === page) {
          _fetchUsersPromise = null
        }
      }
    })()
    return _fetchUsersPromise
  }

  /** Create a new user. Returns true on success. */
  async function createUser(payload: CreateUserPayload): Promise<boolean> {
    isSaving.value = true
    clearErrors()
    try {
      const response = await userService.createUser(payload)
      const tempPassword = response.data.temporary_password

      toast.success(response.data.message ?? 'User created successfully.')
      if (tempPassword) {
        toast.info(`Temporary password: ${tempPassword}`, 10000)
      }

      await fetchUsers(1)
      return true
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        fieldErrors.value = err.response.data.errors
        toast.error(err.response.data.message ?? 'Please correct the errors below.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to create user.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Update an existing user. Returns true on success. */
  async function updateUser(id: number, payload: UpdateUserPayload): Promise<boolean> {
    isSaving.value = true
    clearErrors()
    try {
      const response = await userService.updateUser(id, payload)
      toast.success(response.data.message ?? 'User updated successfully.')
      await fetchUsers(currentPage.value)
      return true
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        fieldErrors.value = err.response.data.errors
        toast.error(err.response.data.message ?? 'Please correct the errors below.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to update user.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Permanently delete a user. Returns true on success. */
  async function deleteUser(id: number): Promise<boolean> {
    isSaving.value = true
    try {
      const response = await userService.deleteUser(id)
      toast.success(response.data.message ?? 'User deleted successfully.')
      await fetchUsers(currentPage.value)
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to delete user.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Deactivate a user account. Returns true on success. */
  async function deactivateUser(id: number): Promise<boolean> {
    isSaving.value = true
    try {
      const response = await userService.deactivateUser(id)
      toast.success(response.data.message ?? 'User deactivated successfully.')
      await fetchUsers(currentPage.value)
      return true
    } catch (err: any) {
      if (err.response?.status === 422) {
        toast.error(err.response.data?.message ?? 'User is already inactive.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to deactivate user.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Reactivate a user account. Returns true on success. */
  async function reactivateUser(id: number): Promise<boolean> {
    isSaving.value = true
    try {
      const response = await userService.reactivateUser(id)
      toast.success(response.data.message ?? 'User reactivated successfully.')
      await fetchUsers(currentPage.value)
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to reactivate user.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Reset a user's credentials and revoke current tokens. */
  async function resetCredentials(id: number): Promise<boolean> {
    isSaving.value = true
    try {
      const response = await userService.resetCredentials(id)
      const tempPassword = response.data.temporary_password

      toast.success(response.data.message ?? 'Credentials reset successfully.')
      if (tempPassword) {
        toast.info(`Temporary password: ${tempPassword}`, 10000)
      }

      await fetchUsers(currentPage.value)
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to reset credentials.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    users,
    organisations,
    isLoading,
    isSaving,
    searchQuery,
    roleFilter,
    statusFilter,
    currentPage,
    lastPage,
    totalItems,
    perPage,
    fieldErrors,
    clearErrors,
    fetchOrganisations,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    deactivateUser,
    reactivateUser,
    resetCredentials,
  }
}

