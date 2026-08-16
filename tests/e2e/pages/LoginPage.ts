import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page Object for /login (src/views/auth/LoginView.vue ->
 * src/components/login/LoginForm.vue).
 *
 * Note: the form's <label> elements aren't associated with their inputs via
 * a `for` attribute (BaseFormField.vue renders a bare <label>, and
 * BaseInput.vue never receives one to point it at) — Playwright's
 * accessible-label locators (getByLabel) can't find these fields as a
 * result. Falls back to the stable #email/#password/#login-submit ids that
 * are actually in the DOM; see the Automation Testing Report for the
 * accessibility bug this reflects.
 */
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly authErrorBanner: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.submitButton = page.locator('#login-submit')
    this.authErrorBanner = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('/login')
    await expect(this.emailInput).toBeVisible()
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
