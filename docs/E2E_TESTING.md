# E2E Testing (Playwright)

## What this is

`tests/e2e/` drives the real app in a real browser against a real running
Laravel API — login, RBAC route guards, and user management CRUD today (see
`tests/e2e/specs/`). It complements, not replaces:

- `backend-api/tests/` (PHPUnit) — the actual authorization enforcement and
  business logic. If this suite disagrees with PHPUnit about what's
  allowed, PHPUnit is right; this suite only proves the frontend routing
  reacts correctly to what the API already allows/denies.
- `tests/unit/` and `tests/component/` (Vitest) — fast, no-browser checks of
  pure logic and individual components.

## Prerequisites

1. **Backend running and seeded**, on `http://127.0.0.1:8000`:
   ```bash
   cd backend-api
   php artisan serve --port=8000
   ```
   In another terminal, seed it at least once (idempotent — safe to rerun):
   ```bash
   php artisan db:seed --force
   ```
   This suite logs in as the seeder's own dev accounts
   (`database/seeders/UserSeeder.php`) — `admin@example.com`,
   `coordinator@example.com`, `ddsp@example.com`, all password `password`.
   Override via `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` (and the
   `E2E_COORDINATOR_*`/`E2E_MEMBER_*` equivalents) if you're pointing this
   at an environment with different credentials.

2. **Playwright browsers installed** (once):
   ```bash
   cd web-app
   npx playwright install chromium
   ```

## Running

```bash
cd web-app
npm run test:e2e            # headless, boots the Vite dev server for you
npm run test:e2e:ui         # interactive UI mode — best for writing/debugging
npm run test:e2e:report     # open the last HTML report
```

`playwright.config.ts` starts the frontend dev server itself
(`webServer`); it does **not** start the backend — that's a separate
process/repository this config can't reach into.

## Why this suite runs serially by default

`workers` defaults to **1**. `php artisan serve` (Laravel's built-in dev
server) is single-threaded; running this suite with 2+ workers against it
was measured to intermittently push otherwise-instant requests (login,
role-list loads) past their timeout, purely from queuing — not a bug in
the app. Override with `E2E_WORKERS=2` (or higher) if your backend is
fronted by something that can actually take concurrent load (php-fpm +
nginx, `php artisan octane:start`, etc.).

## Why some tests use `newAuthenticatedContext()` instead of `test.use({ storageState })`

Playwright's `storageState` only persists **cookies and localStorage** —
not `sessionStorage`. This app's auth store
(`src/stores/auth.ts`) keeps the bearer token in `localStorage` but
`isLoggedIn`/`userRole`/`permissions`/`isSuperAdmin` in `sessionStorage`.
A bare `browser.newContext({ storageState: ... })` therefore restores a
perfectly valid token with **no session flags** —
`authStore.isAuthenticated` reads `false`, and the router guard redirects
to `/login` before the token is ever used, even though it works fine.

`tests/e2e/fixtures/authContext.ts` captures the real `sessionStorage`
snapshot in `global.setup.ts` (alongside the standard `storageState`) and
re-seeds it via `addInitScript`, which runs before the app's own scripts
on every navigation. Use:

- `newAuthenticatedContext(browser, role)` — for specs that create their
  own `BrowserContext` (most of them).
- `seedAuthenticatedPage(page, role)` — for specs using
  `test.use({ storageState: storageStatePath(role) })` with the built-in
  `page` fixture; call it once in `test.beforeEach`, before the first
  `page.goto()`.

If you add a spec that needs an authenticated session, use one of these —
not a bare `newContext({ storageState })` — or it will silently 401/redirect.

## The login rate limit

`POST /login` is throttled to 5 requests/minute
(`routes/api.php`, `throttle:5,1`) — correct, intentional brute-force
protection, and it applies regardless of who's calling it, including this
test suite. `global.setup.ts` alone makes 3 real login calls (one per
role); specs that need one more (currently only `auth.spec.ts`'s
wrong-password and logout tests) were deliberately kept to a combined
total of 5 per full run. If you add a test that performs a real login,
either:

- reuse an existing authenticated fixture (`newAuthenticatedContext`)
  instead, or
- run `php artisan cache:clear` on the backend immediately before your run
  (resets the rate limiter — safe, does not touch data), or
- accept that a full run may intermittently 429 on its Nth login and
  budget accordingly.

A dedicated CI/E2E environment doing more login-heavy testing should raise
this limit for that environment specifically, not weaken it in the shared
codebase.

## Test data

- `newAuthenticatedContext`/`seedAuthenticatedPage`-based specs
  (`rbac.spec.ts`, most of `auth.spec.ts`) are **read-only** — they only
  navigate and assert on redirects, never create/modify data.
- `user-management.spec.ts` creates a uniquely-timestamped user
  (`e2e-<timestamp>@example.test`) and deletes it again in
  `test.afterEach` (runs even if the test body's assertions fail
  partway through), so a full run leaves the database exactly as it found
  it. If a run is killed mid-test (Ctrl-C, crashed runner) before
  `afterEach` completes, check for and remove any leftover
  `*@example.test` accounts before your next run.
- This suite runs against a real database — local dev's, or whatever
  `backend-api` is pointed at (see `.env`). It does not use the isolated
  `laravel_testing` database PHPUnit uses (that database gets
  dropped/recreated per test via `RefreshDatabase`, which a long-lived
  E2E target can't be). Don't point `E2E_BASE_URL` at anything containing
  real user data you care about.

## Debugging a failure

1. `npm run test:e2e:report` — the HTML report has a screenshot, video,
   and trace link for every failure.
2. `npx playwright show-trace tests/e2e/.artifacts/<test-name>/trace.zip`
   — step-by-step DOM snapshots, network log, and console output for
   that one run.
3. `npm run test:e2e:ui` — rerun interactively, step through actions live.
