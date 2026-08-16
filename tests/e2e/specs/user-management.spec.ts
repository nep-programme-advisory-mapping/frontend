import { test, expect } from '@playwright/test'
import { UserManagementPage } from '../pages/UserManagementPage'
import { storageStatePath } from '../fixtures/users'
import { seedAuthenticatedPage } from '../fixtures/authContext'

test.use({ storageState: storageStatePath('admin') })
// storageState only restores localStorage/cookies, not sessionStorage —
// see fixtures/authContext.ts for why this second step is required too.
test.beforeEach(async ({ page }) => {
  await seedAuthenticatedPage(page, 'admin')
})

/**
 * Creates a uniquely-named user per test run and deletes it again at the
 * end (via test.afterEach, so cleanup still runs if an assertion fails
 * partway through) — this suite runs against the shared local dev
 * database (see docs/E2E_TESTING.md), so it must not leave residue behind.
 */
test.describe('User Management CRUD', () => {
  const email = `e2e-${Date.now()}@example.test`

  test.afterEach(async ({ page }) => {
    const users = new UserManagementPage(page)
    await users.goto()
    await users.search(email)
    // .count() alone raced the search field's filtering (likely debounced)
    // and could read 0 before the list actually refetched, silently
    // skipping cleanup and leaking a row into the shared dev DB — wait for
    // the row the same way the create test itself does, and only then
    // decide whether there's anything to delete.
    const row = users.rowFor(email)
    const found = await row
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false)
    if (found) {
      await users.deleteUser(email)
      await expect(row).toHaveCount(0)
    }
  })

  test('admin can create a member_org user, see it in the list, then delete it', async ({ page }) => {
    const users = new UserManagementPage(page)
    await users.goto()

    await users.openCreateModal()
    await users.nameInput.fill('E2E Test User')
    await users.emailInput.fill(email)
    await users.passwordInput.fill('E2ePassword123!')
    await users.selectRole(/Member Organisation/i)
    // Organisation becomes required once the member_org role is selected
    // (UserFormModal.vue's showOrganisationField/organisationRequired) —
    // leaving it unset blocks submission client-side with "Organisation is
    // required for member users.", which is what the form is correctly
    // supposed to do; this test needs an org selected to reach create.
    await users.organisationSelect.selectOption({ index: 1 })
    await users.submitButton.click()

    // Modal closes and the new row shows up in the (freshly refetched) list.
    // Generous timeout: this POST + the subsequent list refetch both queue
    // behind php artisan serve's single-threaded dev server, same as the
    // role-picker load in openCreateModal() above.
    await expect(users.nameInput).toHaveCount(0, { timeout: 20_000 })
    await users.search(email)
    await expect(users.rowFor(email)).toBeVisible()
    await expect(users.rowFor(email)).toContainText('E2E Test User')
  })

  test('creating a user with an already-registered email shows a field error and does not close the modal', async ({
    page,
  }) => {
    const users = new UserManagementPage(page)
    await users.goto()

    await users.openCreateModal()
    await users.nameInput.fill('Duplicate Admin')
    await users.emailInput.fill('admin@example.com') // already exists
    await users.passwordInput.fill('Whatever123!')
    await users.selectRole(/NEP Administrator/i)
    await users.submitButton.click()

    await expect(users.nameInput).toBeVisible() // modal stayed open
    // .first(): the same "already taken" message renders in more than one
    // place (the inline field error under Email, and useUsers.ts's
    // toast.error() surfacing the same backend message) — any one of them
    // being visible is sufficient to prove the duplicate-email error reached the user.
    await expect(page.getByText(/already|taken|registered/i).first()).toBeVisible()
  })
})
