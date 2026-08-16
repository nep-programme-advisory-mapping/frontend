/**
 * Known accounts from the backend's own dev seed data
 * (backend-api/database/seeders/UserSeeder.php) — reused rather than
 * inventing separate E2E-only fixtures, so these tests exercise exactly the
 * same accounts/organisations a developer already has locally.
 *
 * The password is the seeder's fixed dev-only value, never a real secret;
 * override via E2E_* env vars for any other target environment.
 */
export const USERS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'password',
    role: 'nep_admin' as const,
    dashboardPath: '/admin/dashboard',
  },
  coordinator: {
    email: process.env.E2E_COORDINATOR_EMAIL || 'coordinator@example.com',
    password: process.env.E2E_COORDINATOR_PASSWORD || 'password',
    role: 'nep_coordinator' as const,
    dashboardPath: '/manager/dashboard',
  },
  member: {
    email: process.env.E2E_MEMBER_EMAIL || 'ddsp@example.com',
    password: process.env.E2E_MEMBER_PASSWORD || 'password',
    role: 'member_org' as const,
    dashboardPath: '/dashboard',
  },
} as const

export type UserKey = keyof typeof USERS

export function storageStatePath(user: UserKey): string {
  return `tests/e2e/.auth/${user}.json`
}
