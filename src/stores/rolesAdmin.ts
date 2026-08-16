import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userService } from '@/services/user.service'
import { useToast } from '@/utils/toast'
import type { Permission, Role } from '@/types/user'

/**
 * Extract the backend error message from an unknown error.
 */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response
    return res?.data?.message ?? fallback
  }
  return fallback
}

/**
 * Admin store for the Roles & Permissions settings page.
 */
export const useRolesAdminStore = defineStore('rolesAdmin', () => {
  const toast = useToast()

  const roles = ref<Role[]>([])
  const allPermissions = ref<Permission[]>([])
  const isLoading = ref(false)
  const savingRoleId = ref<number | null>(null)
  const isMutatingRole = ref(false)
  const isMutatingPermission = ref(false)

  /** Load roles (with permissions) and the flat permission list once. */
  async function fetchAll(): Promise<void> {
    if (roles.value.length > 0 && allPermissions.value.length > 0) return

    isLoading.value = true
    try {
      const [rolesRes, permsRes] = await Promise.all([
        userService.getRoles(),
        userService.getPermissions(),
      ])
      roles.value = rolesRes.data
      // The backend groups permissions by category; flatten for a flat, ungrouped list.
      allPermissions.value = Object.values(permsRes.data).flat()
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to load roles and permissions.'))
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Just the role list, for consumers that only need role names/ids (e.g.
   * the user create/edit form's role picker) and may not hold
   * permissions.view — the backend's GET /admin/roles also accepts
   * users.create/users.update for exactly this case.
   */
  async function fetchRoles(): Promise<void> {
    if (roles.value.length > 0) return

    try {
      const res = await userService.getRoles()
      roles.value = res.data
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to load roles.'))
    }
  }

  /** Persist a role's permission set and update it in place on success. */
  async function savePermissions(role: Role, permissionIds: number[]): Promise<boolean> {
    savingRoleId.value = role.id
    try {
      const res = await userService.updateRolePermissions(role.id, permissionIds)
      const idx = roles.value.findIndex((r) => r.id === role.id)
      if (idx >= 0) roles.value[idx] = res.data
      toast.success(`${role.display_name || role.name} permissions saved.`)
      return true
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save permissions.'))
      return false
    } finally {
      savingRoleId.value = null
    }
  }

  /** Create a brand new role — no code change required, it's admin data from here on. */
  async function createRole(payload: { name: string; display_name: string; description?: string | null }): Promise<boolean> {
    isMutatingRole.value = true
    try {
      const res = await userService.createRole(payload)
      roles.value.push(res.data)
      toast.success(`Role "${res.data.display_name}" created.`)
      return true
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to create role.'))
      return false
    } finally {
      isMutatingRole.value = false
    }
  }

  /** Update a role's display name/description (system roles keep their identity). */
  async function updateRoleDetails(role: Role, payload: { display_name?: string; description?: string | null }): Promise<boolean> {
    isMutatingRole.value = true
    try {
      const res = await userService.updateRoleDetails(role.id, payload)
      const idx = roles.value.findIndex((r) => r.id === role.id)
      if (idx >= 0) roles.value[idx] = { ...roles.value[idx], ...res.data }
      toast.success('Role updated.')
      return true
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to update role.'))
      return false
    } finally {
      isMutatingRole.value = false
    }
  }

  /** Delete a role. The backend blocks this for system roles, the last super-admin role, or roles still assigned to users. */
  async function deleteRole(role: Role): Promise<boolean> {
    isMutatingRole.value = true
    try {
      await userService.deleteRole(role.id)
      roles.value = roles.value.filter((r) => r.id !== role.id)
      toast.success(`Role "${role.display_name || role.name}" deleted.`)
      return true
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to delete role.'))
      return false
    } finally {
      isMutatingRole.value = false
    }
  }

  /** Create a new permission — lets an admin add abilities for a new module without a code change. */
  async function createPermission(payload: { name: string; display_name: string; group: string; description?: string | null }): Promise<boolean> {
    isMutatingPermission.value = true
    try {
      const res = await userService.createPermission(payload)
      allPermissions.value.push(res.data)
      toast.success(`Permission "${res.data.display_name}" created.`)
      return true
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to create permission.'))
      return false
    } finally {
      isMutatingPermission.value = false
    }
  }

  async function updatePermission(permission: Permission, payload: { display_name?: string; group?: string; description?: string | null }): Promise<boolean> {
    isMutatingPermission.value = true
    try {
      const res = await userService.updatePermission(permission.id, payload)
      const idx = allPermissions.value.findIndex((p) => p.id === permission.id)
      if (idx >= 0) allPermissions.value[idx] = res.data
      toast.success('Permission updated.')
      return true
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to update permission.'))
      return false
    } finally {
      isMutatingPermission.value = false
    }
  }

  async function deletePermission(permission: Permission): Promise<boolean> {
    isMutatingPermission.value = true
    try {
      await userService.deletePermission(permission.id)
      allPermissions.value = allPermissions.value.filter((p) => p.id !== permission.id)
      // Drop it from any locally-cached role permission lists too.
      roles.value = roles.value.map((r) => ({
        ...r,
        permissions: r.permissions?.filter((p) => p.id !== permission.id),
      }))
      toast.success(`Permission "${permission.display_name}" deleted.`)
      return true
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to delete permission.'))
      return false
    } finally {
      isMutatingPermission.value = false
    }
  }

  return {
    roles,
    allPermissions,
    isLoading,
    savingRoleId,
    isMutatingRole,
    isMutatingPermission,
    fetchAll,
    fetchRoles,
    savePermissions,
    createRole,
    updateRoleDetails,
    deleteRole,
    createPermission,
    updatePermission,
    deletePermission,
  }
})
