import api from '../api/axios'
import type { Permission, Role, User, UserListResponse, CreateUserPayload, UpdateUserPayload, AdminUserActionResponse } from '@/types/user'
import { organisationService } from './organisation.service'

const BASE = '/admin/users'

export const userService = {
  getUsers(page = 1, search = '', filters: { role?: string; status?: string; per_page?: number } = {}) {
    return api.get<UserListResponse>(BASE, { params: { page, search, ...filters } })
  },

  getUser(id: number) {
    return api.get<User>(`${BASE}/${id}`)
  },

  createUser(payload: CreateUserPayload) {
    return api.post<AdminUserActionResponse>(BASE, payload)
  },

  updateUser(id: number, payload: UpdateUserPayload) {
    return api.patch<AdminUserActionResponse>(`${BASE}/${id}`, payload)
  },

  deleteUser(id: number) {
    return api.delete<{ message: string }>(`${BASE}/${id}`)
  },

  deactivateUser(id: number) {
    return api.post<AdminUserActionResponse>(`${BASE}/${id}/deactivate`)
  },

  reactivateUser(id: number) {
    return api.post<AdminUserActionResponse>(`${BASE}/${id}/reactivate`)
  },

  resetCredentials(id: number) {
    return api.post<AdminUserActionResponse>(`${BASE}/${id}/reset-credentials`)
  },

  getRoles() {
    return api.get<Role[]>('/admin/roles')
  },

  /** All permissions, grouped by group. Flatten in the store for a flat list. */
  getPermissions() {
    return api.get<Record<string, Permission[]>>('/admin/permissions')
  },

  /** Sync a role's permission set (allowed for system roles too). */
  updateRolePermissions(roleId: number, permissionIds: number[]) {
    return api.patch<Role>(`/admin/roles/${roleId}`, { permissions: permissionIds })
  },

  /** Create a brand new, fully dynamic role — no code change required. */
  createRole(payload: { name: string; display_name: string; description?: string | null }) {
    return api.post<Role>('/admin/roles', payload)
  },

  /** Update a role's identity (name/description are fixed for system roles). */
  updateRoleDetails(roleId: number, payload: { display_name?: string; description?: string | null }) {
    return api.patch<Role>(`/admin/roles/${roleId}`, payload)
  },

  /** Delete a role. Blocked server-side while system, last-super-admin, or still assigned to users. */
  deleteRole(roleId: number) {
    return api.delete<{ message: string }>(`/admin/roles/${roleId}`)
  },

  /** Create a new permission — module/feature authors can add abilities without touching code. */
  createPermission(payload: { name: string; display_name: string; group: string; description?: string | null }) {
    return api.post<Permission>('/admin/permissions', payload)
  },

  updatePermission(permissionId: number, payload: { display_name?: string; group?: string; description?: string | null }) {
    return api.patch<Permission>(`/admin/permissions/${permissionId}`, payload)
  },

  deletePermission(permissionId: number) {
    return api.delete<{ message: string }>(`/admin/permissions/${permissionId}`)
  },

  /** Fetch active organisations for dropdowns — delegates to organisationService. */
  getOrganisations() {
    return organisationService.getOrganisations(1, '', { status: 'active', per_page: 500 })
  },
}
