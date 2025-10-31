## Quick orientation

This repo is a Vue 3 + Vite single-page app (TypeScript) that uses Pinia for state and MSAL B2C for auth. Project sources live under `ShiftPay/src` (import alias `@/*`). Key areas an AI agent will touch:

- `src/api.ts` — centralized API client. Always use `api.*` helpers so Authorization and URL building (via `VITE_API_URL`) are preserved.
- `src/stores/*` — Pinia stores. Stores decide between localStorage and server based on `useAuthStore().isAuthenticated`.
- `src/models/Shift.ts` and `src/models/Duration.ts` — canonical data shapes and conversion helpers (`parse`, `toDTO`).
- `src/main.ts` — Pinia is created and `useAuthStore().init()` is awaited before mounting; avoid breaking that init order.

## Important workflows / commands

- Development (from project folder `ShiftPay/ShiftPay`):
  - `npm install`
  - `npm run dev` (vite dev server)
  - `npm run build` (runs `vue-tsc` type-check and then `vite build`)
  - `npm run type-check` (fast local type-only check)

Note: `package.json` runs `vue-tsc --build --force` before build. Keep type changes in sync with the `.vue` typing expectations (Volar recommended).

## Conventions and patterns to follow

- Auth: `src/stores/authStore.ts` uses `@azure/msal-browser`. Call `useAuthStore().fetchToken()` to get a Bearer token; `src/api.ts` already does this for all requests — prefer using `api` rather than calling fetch directly.
- Stores are resilient: when unauthenticated they read/write to localStorage (keys like `shifts` / legacy `entries`). When authenticated they call the API and transform data via model `parse` methods.
- Models: `Shift.parse()` accepts multiple shapes (underscored fields, `from`/`to` alternatives). `Shift.toDTO()` returns ISO strings and `Duration.toDTO()` returns `"H:M"` strings. Respect these formats when creating or updating shifts.
- Persistence: many stores expose `enableAutoPersist()` and App.vue calls these in `mounted()`; avoid removing that without migrating localStorage keys.
- Error handling: code uses `console.error` and throws human-readable `Error` messages. Keep that pattern when adding new operations.

## Integration points / environment

- API base URL: `import.meta.env.VITE_API_URL` (used in `src/api.ts`). Update your environment variables (Netlify or `.env.local`) rather than hard-coding.
- Auth B2C config is in `src/stores/authStore.ts` (clientId/authority). Changes to auth usually require corresponding platform and Netlify env updates.
- Path alias `@/*` is configured in `tsconfig.app.json` — use it in new imports.

## Safety notes for edits

- Do not change localStorage keys (`shifts`, `entries`) without providing a migration path — these hold user data.
- When editing stores, maintain the offline/local fallback behavior: unauthenticated flows must continue to work with localStorage.
- When adding API endpoints, add them to `src/api.ts` and include types and unit-like validations via model `parse` functions.

## Quick examples

- Add a new fetch to API client:

  - Edit `src/api.ts` and add a function that calls `createRequest('newResource', { method: 'GET' })`.

- Work with Shift model:
  - Use `Shift.parse(raw)` to normalize input and `shift.toDTO()` before sending to the API.

## Files to open first when debugging

- `src/api.ts` — network, headers, URL building
- `src/stores/authStore.ts` — auth lifecycle and token fetching
- `src/stores/shiftStore.ts` and `src/models/Shift.ts` — data flow for shifts
- `src/main.ts` and `src/App.vue` — app bootstrap (Pinia, auth init, auto-persist wiring)

If anything here is unclear or you want this tailored (e.g., add examples for new endpoints or a migration helper for localStorage), tell me which parts to expand.
