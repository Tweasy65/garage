# Garage backlog

Tracked work from the November 2026 feature review. This is a personal garage for one signed-in owner; the daily loop (add a car, log service, see what’s due, keep a punch list) already works. Completeness drops on findability, phones, and anything that should work when the tab is closed.

**Status:** `todo` · `doing` · `done`  
**Priority:** P0 (hurts daily use) · P1 (next product increment) · P2 (polish / later)

Check a task `[x]` and set its status when it ships. Leave epic status `todo` until every P0/P1 task under it is done.

---

## Epic map

| ID | Epic | Priority | Status | Why |
| --- | --- | --- | --- | --- |
| E1 | Phone navigation | P0 | doing | Header hides Collection / Projects / Service below `sm` |
| E2 | Collection as inventory | P0 | todo | Home is a picker, not a searchable garage |
| E3 | Quieter, honest alerts | P0 | todo | “Missing first log” is treated like a due item |
| E4 | Reminders outside the browser | P1 | todo | Alerts only recompute on load; no email/push/cron |
| E5 | Media that scales | P1 | todo | Photos and GLBs live as data URLs in Postgres |
| E6 | Punch-list depth | P1 | todo | `sortOrder` and instructions exist; reorder and markdown do not |
| E7 | 3D catalog | P2 | todo | Viewer is polished for a handful of Fords |
| E8 | Housekeeping | P2 | todo | Leftover cleanup that did not make the last pass |

---

## E1 — Phone navigation

**Goal:** A signed-in phone user can reach Collection, Projects, and Service without knowing the URLs.

- [x] **E1.T1** · P0 · done — Show Collection / Projects / Service on small screens (overflow menu, bottom bar, or always-visible links). Today `Header` nav is `hidden … sm:flex`.
- [x] **E1.T2** · P1 · done — Make Add vehicle, alerts, and account controls usable in the same compact header without wrapping or clipping.
- [ ] **E1.T3** · P2 · todo — Spot-check collection preview, vehicle tabs, service filters, and cardboard on a ~390px viewport and fix the worst overflow.

---

## E2 — Collection as inventory

**Goal:** Find a vehicle without scanning a long list. Tags and favorites should do work, not just display.

- [ ] **E2.T1** · P0 · todo — Filter/search the collection by year, make, model, tag, project flag, and favorite.
- [ ] **E2.T2** · P1 · todo — Toggle favorite from the collection list (today it is only a checkbox in the edit form).
- [ ] **E2.T3** · P1 · todo — Clicking a collection row (or a clear “Open”) should go to the vehicle page; keep the preview, but stop treating the list as the only destination.
- [ ] **E2.T4** · P2 · todo — Sort options beyond favorites-first / recently updated (year, mileage, make).
- [ ] **E2.T5** · P2 · todo — Use tags as collection chips/filters. They are stored and suggested in the form, then only shown on the specs tab.

---

## E3 — Quieter, honest alerts

**Goal:** The bell and collection summary mean “something needs attention,” not “you have not filled in history yet.”

See also `docs/maintenance-schedule.md`.

- [ ] **E3.T1** · P0 · todo — Stop counting “no oil/tires/inspection on record” as an alert badge. Keep a softer empty state on the vehicle service tab / service hub instead.
- [ ] **E3.T2** · P1 · todo — Per-vehicle interval overrides (classic vs daily driver) instead of one 5k/180-day oil rule for every car.
- [ ] **E3.T3** · P1 · todo — Recompute alerts when odometer is updated and a mileage due is crossed (hero mileage save already exists).
- [ ] **E3.T4** · P2 · todo — Deduplicate header alerts vs loader data (`GarageAlertsProvider` refetches `listMaintenanceAlerts` on every route load even when the page already has alerts).
- [ ] **E3.T5** · P2 · todo — Dismiss / snooze an alert without logging fake service.

---

## E4 — Reminders outside the browser

**Goal:** Overdue service still surfaces if nobody opened Garage that day.

Planned in `src/lib/maintenanceAlerts.ts` and `docs/maintenance-schedule.md`.

- [ ] **E4.T1** · P1 · todo — Cloudflare Cron Trigger that recomputes due items daily (same rules as on-load).
- [ ] **E4.T2** · P1 · todo — Email (or Clerk-compatible) reminder for overdue items. Start with one digest per user, not one mail per alert.
- [ ] **E4.T3** · P2 · todo — Optional push / browser notification; only after email works.
- [ ] **E4.T4** · P2 · todo — Health check that proves the cron ran (`/api/health` is liveness-only today).

---

## E5 — Media that scales

**Goal:** Photos and models stay snappy after more than a couple of cars. Do not keep growing `vehicles.assets` JSON in Neon.

- [ ] **E5.T1** · P1 · todo — Store uploads in R2 (or similar) and persist URLs, not data URLs, on the vehicle row.
- [ ] **E5.T2** · P1 · todo — Cap / compress uploads in the Worker as well as the client (`VehicleAssetsField` already resizes images in the browser).
- [ ] **E5.T3** · P2 · todo — Cover-from-3D should write the same object-storage path as a normal photo.
- [ ] **E5.T4** · P2 · todo — Wikimedia stock search: keep auth (already required), add a short query-length/result cap in the UI copy so it is obvious it is a helper, not a library.

---

## E6 — Punch-list depth

**Goal:** Project work can be ordered and read as instructions, not only as a checkbox plus textarea.

- [ ] **E6.T1** · P1 · todo — Drag (or up/down) reorder; persist `sortOrder` (column already exists, only “append +10” is implemented).
- [ ] **E6.T2** · P1 · todo — Render `instructionsMd` as markdown in the detail drawer / cardboard, keep the editor as markdown or a simple split view.
- [ ] **E6.T3** · P2 · todo — Cardboard: add/delete items without bouncing back to the punch-list tab (toggle and details already work there).
- [ ] **E6.T4** · P2 · todo — Move an item between areas from the board without opening the drawer.

---

## E7 — 3D catalog

**Goal:** 3D stays a bonus for cars we actually have models for, without pretending every vehicle has a studio view.

- [ ] **E7.T1** · P2 · todo — Add models only for vehicles in this garage (do not generic-catalog the world).
- [ ] **E7.T2** · P2 · todo — If there is no catalog match and no uploaded GLB, hide studio chrome instead of showing a near-empty media tab.
- [ ] **E7.T3** · P2 · todo — Document how to add a GLB (mesh paint names, `/models/`, `vehicleModels.ts`).

---

## E8 — Housekeeping

**Goal:** Small follow-ups from the cleanup pass. Skip anything that is only file-moving.

- [ ] **E8.T1** · P2 · todo — Split `VehicleForm.tsx` / `VehicleAssetsField.tsx` / `VehicleModelViewer.tsx` only when the next feature has to touch them.
- [ ] **E8.T2** · P2 · todo — `beforeLoad` auth is optional while sign-in stays a modal with no `/sign-in` route.
- [ ] **E8.T3** · P2 · todo — Typecheck is `pnpm typecheck`; still no unit tests. Add tests around `computeMaintenanceAlerts` when E3 changes the rules.
- [ ] **E8.T4** · P2 · todo — Confirm production Google OAuth + Clerk DNS after the keys-out-of-git deploy (`DEPLOY.md`). Not code.

---

## Suggested order

1. **E1.T1** — phone nav  
2. **E3.T1** — stop badging “missing” as due  
3. **E2.T1** — collection search/filter  
4. **E4.T1 + E4.T2** — daily cron + email digest  
5. **E5.T1** — R2 for uploads  
6. **E6.T1 + E6.T2** — reorder + markdown instructions  

Do not start E7 or E8 until the P0 items above are done, unless a specific vehicle in this garage needs a new GLB.
