# Roadmap (TL;DR)

The shortest view of where development stands and when you can test-run the app.
Full design: `docs/orkestreringssystem.md`.

**Status now:** through Phase 3, plus the Phase 4 iCal export feed — the app is runnable and usable locally.
**▶ Runnable now:** `bun run dev` (see [Running locally](#running-locally)).

| Phase | Goal                       | You can test-run…                                         | Status        |
| ----- | -------------------------- | --------------------------------------------------------- | ------------- |
| 0     | Foundation                 | —                                                         | ✅ Done       |
| 1     | First vertical slice: CRUD | Create a property, add/list bookings (`bun run dev`)      | ✅ Done       |
| 2     | Calendar + availability    | See bookings/blocks on a calendar; get overlap warnings   | ✅ Done       |
| 3     | Tasks & cleaning flow      | Confirm a booking → cleaning task auto-appears; task list | ✅ Done       |
| 4     | iCal export + worker       | Subscribe Airbnb to your feed; import Airbnb bookings     | ◑ Export done |
| 5     | Documents & economy        | Generate a terms-addendum PDF; yearly income per channel  | ☐             |
| 6     | Notifications & deploy     | Email reminders; 24/7 iCal reachability on a VPS          | ☐             |

Legend: ✅ done · ◑ partly done · ▶ in progress / next · ☐ not started.

## What each phase adds

- **0 — Foundation ✅** SvelteKit + Drizzle/SQLite scaffold, full schema (8
  entities), channel seed data, CI (lint/typecheck/build), bun.
- **1 — CRUD slice ✅** Property + booking + guest CRUD via SvelteKit form
  actions and list views. **This is the point the app becomes usable locally** —
  the first real data goes in here (e.g. _adjust bikes & tennis gear in the
  listing_ becomes a task/listing edit in the app, not a doc).
- **2 — Calendar engine ✅** FullCalendar month view + blocking CRUD + the "is
  range X–Y free?" check over bookings + blockings (`src/lib/availability.ts`,
  unit-tested), with non-blocking conflict warnings on save ("Save anyway").
- **3 — Tasks/cleaning ✅** Task CRUD with a status-filtered board, plus the
  rule (`src/lib/cleaning.ts`, unit-tested): confirming a booking auto-creates a
  cleaning task due on the checkout day, and moving the checkout moves the task.
  _Not yet:_ recurring maintenance tasks (sotning, vattenavstängning) — these
  need a scheduler, so they ride along with the Phase 4 worker.
  _Design-system checkpoint (open, for you to decide):_ the surface is growing
  (task board, richer forms). Decide whether that justifies moving to
  **shadcn-svelte** (Tailwind + bits-ui). Left on the hand-rolled CSS in
  `+layout.svelte` for now — this is a deliberate call to make, not to automate.
- **4 — Sync ◑** _Done:_ per-property iCal **export** feed at
  `/properties/[id]/calendar.ics` — committed bookings + blockings as busy
  all-day events, no guest data, tentative holds excluded.
  _Not yet:_ the worker process (Effect) that polls Airbnb's feed, creates
  shadow bookings, and raises feed-health/conflict alerts.
- **5 — Docs & money** PDF generator (terms addendum, rental agreement, booking
  confirmation, receipt) + ledger and per-channel yearly tax summary.
- **6 — Notify & ship** Email (Nodemailer), reminders (missing payout, broken
  feed), deploy to a small VPS for 24/7 iCal reachability.

## Running locally

```sh
bun install
cp .env.example .env         # DATABASE_URL=local.db
bun run db:migrate           # create the SQLite schema
bun run db:seed              # seed the channels (Airbnb, Stugknuten, …)
bun run dev                  # http://localhost:5173
```

Then create a property, add bookings and blockings, and open **Calendar** to
see them. Overlapping dates raise a conflict warning you can override. For a
guided tour and a QA checklist, see [`docs/qa-walkthrough.md`](docs/qa-walkthrough.md).

Checks: `bun run lint`, `bun run check`, `bun run test`, `bun run build`.

## Where TODOs live (convention)

- **Operational / listing TODOs** (adjust the listing, a specific cleaning, "update
  the annons on channel X") are **data the app manages** — they belong in the app
  as `Task` / `Property` records, not as Markdown in this repo.
- **Development TODOs** (how the app works, what to build next) belong as Markdown
  here — this file is their home.
