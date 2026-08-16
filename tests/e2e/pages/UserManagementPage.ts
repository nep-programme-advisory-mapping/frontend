import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page Object for /admin/users (UserManagementPanel.vue + UserFormModal.vue
 * + ConfirmDeleteUserModal.vue).
 */
export class UserManagementPage {
  readonly page: Page
  readonly createButton: Locator
  readonly searchInput: Locator
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly organisationSelect: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.createButton = page.locator('#create-user-btn')
    this.searchInput = page.locator('#user-search')
    this.nameInput = page.locator('#um-name')
    this.emailInput = page.locator('#um-email')
    this.passwordInput = page.locator('#um-password')
    this.organisationSelect = page.locator('#um-organisation')
    // Scoped to the form: '#create-user-btn' (opens the modal) and the
    // modal's own submit button share the exact same accessible name
    // ("Create User"), which is a strict-mode ambiguous match otherwise.
    this.submitButton = page.locator('form').getByRole('button', { name: 'Create User' })
  }

  async goto() {
    await this.page.goto('/admin/users')
    await expect(this.createButton).toBeVisible()
  }

  async openCreateModal() {
    await this.createButton.click()
    await expect(this.nameInput).toBeVisible()
    // The role picker only renders once GET /admin/roles resolves, which
    // fires alongside /admin/users and /admin/organisations right after
    // navigation — three concurrent requests php artisan serve's
    // single-threaded dev server can take a while to work through. A
    // generous timeout here specifically (rather than raising the suite's
    // default) keeps that slack local to the one operation that needs it.
    await expect(this.page.locator('button[aria-pressed]').first()).toBeVisible({ timeout: 20_000 })
  }

  async selectRole(roleDisplayName: string | RegExp) {
    await this.page.getByRole('button', { name: roleDisplayName }).click()
  }

  async search(query: string) {
    await this.searchInput.fill(query)
  }

  rowFor(email: string): Locator {
    return this.page.locator('tr', { hasText: email })
  }

  async deleteUser(email: string) {
    await this.search(email)
    await this.rowFor(email).getByTitle('Delete account').click()

    // ConfirmDeleteUserModal has no dialog role (BaseModal renders a bare
    // Teleported <div>, not role="dialog") and its "Delete" confirm button
    // shares its accessible name with the (CSS-hidden but still-mounted)
    // mobile row action — scope by the modal's own heading instead of a
    // bare name match to avoid a strict-mode ambiguous-locator error.
    const confirmHeading = this.page.getByRole('heading', { name: 'Delete Account' })
    await expect(confirmHeading).toBeVisible()
    await confirmHeading
      .locator('xpath=following::button[normalize-space(text())="Delete"]')
      .first()
      .click()
  }
}
