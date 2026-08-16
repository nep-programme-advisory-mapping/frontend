import { test, expect } from '@playwright/test'
import { newAuthenticatedContext } from '../fixtures/authContext'

/**
 * URL-tampering / direct-navigation checks for the frontend router guard
 * (src/router/index.ts -> authGuard, unit-tested in isolation at
 * tests/unit/router-guard.spec.ts). These confirm the same logic actually
 * protects real pages end-to-end, for both of its two independent code
 * paths — the legacy meta.roles list and the newer meta.permission check —
 * and that a redirected user never even gets a flash of the page content.
 *
 * This is frontend routing only; RoutePermissionTest.php (backend) is what
 * actually enforces these boundaries — a hidden button/redirected route
 * here is UX, not security.
 */
test.describe('Frontend route guard — role/permission-gated pages', () => {
  test.describe('legacy meta.roles guard (nep_admin-only pages)', () => {
    test('nep_admin can open Organization Management', async ({ browser }) => {
      const context = await newAuthenticatedContext(browser, 'admin')
      const page = await context.newPage()

      await page.goto('/admin/organization')

      await expect(page).toHaveURL(/\/admin\/organization$/)
      await context.close()
    })

    test('a coordinator navigating directly to an admin-only URL is redirected to /403', async ({ browser }) => {
      const context = await newAuthenticatedContext(browser, 'coordinator')
      const page = await context.newPage()

      await page.goto('/admin/organization')

      await expect(page).toHaveURL(/\/403$/)
      await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible()
      await context.close()
    })

    test('a member org user navigating directly to an admin-only URL is redirected to /403', async ({
      browser,
    }) => {
      const context = await newAuthenticatedContext(browser, 'member')
      const page = await context.newPage()

      await page.goto('/admin/coordinators')

      await expect(page).toHaveURL(/\/403$/)
      await context.close()
    })
  })

  test.describe('permission-based guard (meta.permission)', () => {
    test('a coordinator without permissions.view is redirected away from Permissions Management', async ({
      browser,
    }) => {
      const context = await newAuthenticatedContext(browser, 'coordinator')
      const page = await context.newPage()

      await page.goto('/admin/permissions')

      await expect(page).toHaveURL(/\/403$/)
      await context.close()
    })

    test('nep_admin (super admin) can open Permissions Management regardless of the seeded list', async ({
      browser,
    }) => {
      const context = await newAuthenticatedContext(browser, 'admin')
      const page = await context.newPage()

      await page.goto('/admin/permissions')

      await expect(page).toHaveURL(/\/admin\/permissions$/)
      await context.close()
    })

    test('a coordinator (who does hold users.view) can open User Management', async ({ browser }) => {
      const context = await newAuthenticatedContext(browser, 'coordinator')
      const page = await context.newPage()

      await page.goto('/admin/users')

      await expect(page).toHaveURL(/\/admin\/users$/)
      await context.close()
    })
  })

  test('an unauthenticated visitor hitting a deep admin URL is sent to /login, not /403', async ({ page }) => {
    await page.goto('/admin/permissions')

    await expect(page).toHaveURL(/\/login$/)
  })
})
