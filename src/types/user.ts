import type { Organisation } from './organisations'

export type OrganisationOption = Pick<Organisation, 'id' | 'name'>

/**
 * A user's primary role is a dynamic string that must match a `roles.name`
 * row on the backend (validated server-side via `exists:roles,name`) — it is
 * NOT limited to the three built-in roles. Those three still exist as data,
 * seeded by RolePermissionSeeder, but an admin can create/rename/delete
 * roles freely through the Roles admin page.
 */
export type UserRole = string

export type UserStatus = 'active' | 'inactive'

export interface Permission {
  id: number
  name: string
  display_name: string
  group: string
  description?: string | null
}

export interface Role {
  id: number
  name: string
  display_name: string
  description?: string | null
  is_system: boolean
  /** Holds every permission implicitly; only ever true for the highest-privilege role(s). */
  is_super_admin?: boolean
  permissions?: Permission[]
  users_count?: number
}

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
  organisation_id: number | null
  organisation: {
    id: number
    name: string
  } | null
  roles?: Role[]
  /** Individually-assigned permissions (authoritative when present). */
  permissions?: Permission[]
  created_at: string
  updated_at: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password?: string
  role: UserRole
  organisation_id: number | null
  /** Permission IDs to assign directly to this user. */
  permissions?: number[]
}

export interface UpdateUserPayload {
  name: string
  email: string
  role: UserRole
  organisation_id: number | null
  password?: string
  status?: UserStatus
  /** Permission IDs; an empty array clears individually assigned permissions. */
  permissions?: number[]
}

export interface AdminUserActionResponse {
  message: string
  user?: User
  temporary_password?: string
}

/** Shape returned by the API list endpoint */
export interface UserListResponse {
  current_page: number
  data: User[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: unknown[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}
