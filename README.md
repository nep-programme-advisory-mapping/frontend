# NEP Programme Web Application

Frontend for the **NEP Programme Mapping System** — built with **Vue 3**, **TypeScript**, **Pinia**, **Tailwind CSS v4**, and **Laravel Echo** for real-time notifications.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Language | TypeScript |
| State Management | Pinia |
| Routing | Vue Router 5 |
| Styling | Tailwind CSS v4 |
| HTTP Client | Axios |
| Real-time | Laravel Echo + Pusher JS (Reverb) |
| Build Tool | Vite 8 |
| Linting | ESLint + OxLint |
| Formatter | oxfmt |

---

## 💻 Local Development Setup

### 1. Prerequisites

- Node.js `^22.18.0` or `>=24.12.0`
- NPM
- Backend API running at `http://localhost:8000` (see `backend-api/README.md`)

### 2. Installation

```bash
# 1. Clone and enter the project
git clone <repository-url>
cd web-app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

Open `.env` and fill in the required values (see [Environment Variables](#-environment-variables) below).

### 3. Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

All `/api`, `/broadcasting`, and `/sanctum` requests are proxied to the backend via Vite's dev server proxy — no CORS issues in development.

---

## 🔑 User Roles & Routes

| Role | Default Redirect | Access |
|---|---|---|
| `nep_admin` | `/admin/dashboard` | Full system access |
| `nep_coordinator` | `/manager/dashboard` | Advisory workflow, programme entries, map |
| `member_org` | `/dashboard` | Own organisation's programme entries |

### Route Summary

| Path | Roles | Description |
|---|---|---|
| `/login` | Public | Login page |
| `/forgot-password` | Public | Password reset request |
| `/reset-password` | Public | Password reset form |
| `/dashboard` | All | Member org dashboard |
| `/admin/dashboard` | `nep_admin` | Admin dashboard |
| `/manager/dashboard` | `nep_coordinator` | Coordinator dashboard |
| `/map` | All authenticated | Programme map view |
| `/entries/new` | All authenticated | New programme entry wizard |
| `/entries/:id` | All authenticated | Programme entry detail |
| `/adviser` | `nep_admin`, `nep_coordinator` | Advisory submissions list |
| `/adviser/new` | `nep_admin`, `nep_coordinator` | New advisory submission |
| `/adviser/:id` | `nep_admin`, `nep_coordinator` | Advisory submission detail |
| `/adviser/entry/:entryId` | All authenticated | Advisory note for a programme entry |
| `/admin/users` | `nep_admin` | User management |
| `/admin/coordinators` | `nep_admin` | Coordinator management |
| `/admin/taxonomy` | `nep_admin` | Taxonomy management |
| `/admin/programmes` | `nep_admin`, `nep_coordinator` | All programme entries |
| `/admin/organization` | `nep_admin` | Organisation management |
| `/policy` | `nep_admin`, `nep_coordinator` | Policy documents |
| `/account` | All authenticated | Organisation profile |

---

## 📡 Real-time (Laravel Echo + Reverb)

Echo is initialised lazily on login and torn down on logout via `src/realtime/`.

### Channels & Events

| Channel | Roles | Event | Action |
|---|---|---|---|
| `private-nep-admin` | `nep_admin`, `nep_coordinator` | `.other.queue.created` | Updates taxonomy other-queue list |
| `private-nep-admin` | `nep_admin`, `nep_coordinator` | `.programme.draft.created` | Pushes notification |
| `private-nep-admin` | `nep_admin`, `nep_coordinator` | `.advice.delivered` | Pushes notification |
| `private-App.Models.User.{id}` | `member_org` | `.programme.draft.created` | Pushes notification + refreshes entries |
| `private-App.Models.User.{id}` | `member_org` | `.advice.delivered` | Pushes notification |

Auth token is attached automatically via the Axios interceptor (`localStorage` key: `token`). The Echo `authEndpoint` is set to `/api/broadcasting/auth` which proxies to the backend.

---

## 🌍 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | API base path — use `/api` in dev (proxied) or full URL in production |
| `VITE_API_PROXY_TARGET` | Dev only | Backend origin for Vite proxy (e.g. `http://localhost:8000`) |
| `VITE_REVERB_APP_KEY` | Yes | Must match `REVERB_APP_KEY` in the backend `.env` |
| `VITE_REVERB_HOST` | Prod only | WebSocket host (defaults to `window.location.hostname`) |
| `VITE_REVERB_PORT` | Prod only | WebSocket port (defaults to `80`/`443`) |
| `VITE_REVERB_SCHEME` | Prod only | `http` or `https` (defaults to `https`) |

---

## 🏗️ Project Structure

```
src/
├── api/          # Axios instance + per-feature API modules
├── components/   # Reusable Vue components (grouped by feature)
├── composables/  # Shared composition functions
├── constants/    # App-wide constants (map, programme, taxonomy)
├── layouts/      # StaffLayout, MemberLayout
├── realtime/     # Laravel Echo setup and channel subscriptions
├── router/       # Vue Router with role-based guards
├── services/     # Business logic services
├── stores/       # Pinia stores (per feature)
├── types/        # TypeScript type definitions
├── utils/        # Utility helpers
└── views/        # Page-level components (grouped by role/feature)
```

---

## 🚀 Production Build

```bash
npm run build
```

Output goes to `dist/`. Serve it from any static host or Nginx.

> `console.log` and `debugger` statements are automatically stripped by esbuild in production builds.

### Nginx Configuration (SPA)

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    root /var/www/nep-frontend/dist;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Set `VITE_API_BASE_URL=https://api.yourdomain.com/api` and `VITE_API_PROXY_TARGET` is not needed in production.

---

## 🔧 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run build-only` | Production build without type-check |
| `npm run type-check` | Run `vue-tsc` type checking |
| `npm run lint` | Run OxLint + ESLint with auto-fix |
| `npm run format` | Format `src/` with oxfmt |
| `npm run preview` | Preview production build locally |

---

## 🔧 Troubleshooting

**WebSocket not connecting**
- Verify `VITE_REVERB_APP_KEY` matches `REVERB_APP_KEY` in the backend `.env`
- Ensure the backend Reverb server is running (`php artisan reverb:start`)
- Check browser console for Echo auth errors — the `/api/broadcasting/auth` request must return `200`

**API requests returning 401 after login**
- The auth token is stored in `localStorage` as `token` and attached by the Axios interceptor
- Check that the backend `SANCTUM_STATEFUL_DOMAINS` includes `localhost:5173`

**Vite proxy not forwarding requests**
- Ensure `VITE_API_PROXY_TARGET=http://localhost:8000` is set in `.env`
- Restart the dev server after `.env` changes

**Type errors after pulling changes**
```bash
npm run type-check
```

---

## 📚 Resources

- [Vue 3 Docs](https://vuejs.org/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Vue Router Docs](https://router.vuejs.org/)
- [Vite Docs](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Laravel Echo](https://laravel.com/docs/12.x/broadcasting#client-side-installation)

---

## 📄 License

MIT License
