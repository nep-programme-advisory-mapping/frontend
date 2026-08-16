import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { USERS } from '../fixtures/users'
import { newAuthenticatedContext } from '../fixtures/authContext'

test.describe('Authentication', () => {
  // Successful login + the correct per-role dashboard redirect is already
  // exercised by global.setup.ts (which every other spec's storageState
  // depends on) — not repeated here with fresh real logins, to stay under
  // the backend's throttle:5,1 login rate limit within one suite run. See
  // the Automation Testing Report's "Known Limitations" for that tradeoff.

  // An unknown email is deliberately NOT covered here too (only the wrong-
  // password case below): the backend returns the identical generic 401
  // for both (AuthController::login — an account-enumeration guard), so a
  // second real /login call here would only re-prove the same UI wiring
  // while eating into the shared login-throttle budget. The
  // enumeration-safety property itself is asserted at the API level in
  // NegativeAndEdgeCaseTest::test_login_with_non_existent_email_is_rejected_without_leaking_account_existence.
  test('a wrong password is rejected with a visible error', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()

    await login.login(USERS.admin.email, 'definitely-the-wrong-password')

    await expect(page).toHaveURL(/\/login$/)
    await expect(login.authErrorBanner).toBeVisible()
  })

  test('empty submission is blocked client-side with field-level errors, no request needed', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()

    await login.submitButton.click()

    await expect(page.getByText('Email is required.')).toBeVisible()
    await expect(page.getByText('Password is required.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('visiting a protected route while unauthenticated redirects to /login', async ({ page }) => {
    await page.goto('/admin/dashboard')

    await expect(page).toHaveURL(/\/login$/)
  })

  test('an already-authenticated admin visiting /login is bounced straight to their dashboard', async ({
    browser,
  }) => {
    const context = await newAuthenticatedContext(browser, 'admin')
    const page = await context.newPage()

    await page.goto('/login')

    await expect(page).toHaveURL(/\/admin\/dashboard$/)
    await context.close()
  })

  test('logout clears the session and returns to /login', async ({ page }) => {
    // Deliberately logs in fresh here rather than reusing storageState('admin'):
    // logout deletes the current access token server-side, which would
    // silently poison that shared fixture for every other admin-role test
    // reusing the same file. Isolation over reuse for anything destructive.
    const login = new LoginPage(page)
    await login.goto()
    await login.login(USERS.admin.email, USERS.admin.password)
    await expect(page).toHaveURL(new RegExp(`${USERS.admin.dashboardPath}$`))

    await page.getByTitle('Log out').click()
    await expect(page).toHaveURL(/\/login$/)

    // The cleared session must actually stick — reloading a protected URL
    // afterwards must not silently let a stale token back in.
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })
})
