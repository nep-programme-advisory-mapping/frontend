import fs from 'node:fs'
import type { Browser, BrowserContext, Page } from '@playwright/test'
import { storageStatePath, type UserKey } from './users'

/**
 * Playwright's `storageState` only persists cookies + localStorage — it
 * does NOT capture sessionStorage. This app's auth store
 * (src/stores/auth.ts) keeps the bearer token in localStorage but
 * isLoggedIn/userRole/permissions/isSuperAdmin in sessionStorage, so a bare
 * `browser.newContext({ storageState: storageStatePath(role) })` restores a
 * valid token with no session flags — authStore.isAuthenticated reads
 * false, and the router guard redirects to /login before the (valid!)
 * token is ever used. First diagnosed by comparing network logs: no
 * /api/user call was even attempted before the redirect.
 *
 * This file captures the real sessionStorage snapshot alongside the
 * standard storageState (see global.setup.ts) and re-seeds it via
 * addInitScript, which — unlike storageState — runs before the app's own
 * scripts on every navigation.
 */
export function sessionStoragePath(user: UserKey): string {
  return `tests/e2e/.auth/${user}.session.json`
}

export async function captureSessionStorage(page: Page, role: UserKey) {
  const snapshot = await page.evaluate(() => ({ ...window.sessionStorage }))
  fs.writeFileSync(sessionStoragePath(role), JSON.stringify(snapshot))
}

function readSnapshot(role: UserKey): Record<string, string> {
  return JSON.parse(fs.readFileSync(sessionStoragePath(role), 'utf8'))
}

function seedScript(data: Record<string, string>) {
  for (const [key, value] of Object.entries(data)) {
    window.sessionStorage.setItem(key, value)
  }
}

/** Full replacement for `browser.newContext({ storageState: ... })` that also restores sessionStorage. */
export async function newAuthenticatedContext(browser: Browser, role: UserKey): Promise<BrowserContext> {
  const context = await browser.newContext({ storageState: storageStatePath(role) })
  // Context-level (not page-level): applies to every page opened from this
  // context, run before any of the app's own scripts on each navigation.
  await context.addInitScript(seedScript, readSnapshot(role))
  return context
}

/** For specs using the built-in `page` fixture with `test.use({ storageState })` — call once before the first `page.goto()`. */
export async function seedAuthenticatedPage(page: Page, role: UserKey) {
  await page.addInitScript(seedScript, readSnapshot(role))
}
