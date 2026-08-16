import { test as setup, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { USERS, storageStatePath } from './fixtures/users'
import { captureSessionStorage } from './fixtures/authContext'

/**
 * Logs in once per role through the real UI and saves the resulting
 * storage state (localStorage token + sessionStorage session flags) so
 * every other spec can start already authenticated via
 * `test.use({ storageState: storageStatePath('admin') })` instead of
 * re-driving the login form in every test.
 *
 * This is also the one place that asserts each role lands on its correct
 * dashboard — auth.spec.ts doesn't repeat that with its own fresh logins,
 * specifically to keep this suite's total real /login calls under the
 * backend's throttle:5,1 (routes/api.php) within a single run.
 */
for (const role of Object.keys(USERS) as Array<keyof typeof USERS>) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const user = USERS[role]
    const login = new LoginPage(page)

    await login.goto()
    await login.login(user.email, user.password)

    await expect(page).toHaveURL(new RegExp(`${user.dashboardPath}$`))

    await page.context().storageState({ path: storageStatePath(role) })
    await captureSessionStorage(page, role)
  })
}
