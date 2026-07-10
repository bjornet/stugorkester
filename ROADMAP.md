# Roadmap (TL;DR)

The shortest view of where development stands and when you can test-run the app.
Full design: `docs/orkestreringssystem.md`.

**Status now:** foundation done — no runnable UI yet.
**▶ First local test-run:** after **Phase 1**.

| Phase | Goal                       | You can test-run…                                         | Status  |
| ----- | -------------------------- | --------------------------------------------------------- | ------- |
| 0     | Foundation                 | —                                                         | ✅ Done |
| 1     | First vertical slice: CRUD | Create a property, add/list bookings (`bun run dev`)      | ▶ Next  |
| 2     | Calendar + availability    | See bookings/blocks on a calendar; get overlap warnings   | ☐       |
| 3     | Tasks & cleaning flow      | Confirm a booking → cleaning task auto-appears; task list | ☐       |
| 4     | iCal export + worker       | Subscribe Airbnb to your feed; import Airbnb bookings     | ☐       |
| 5     | Documents & economy        | Generate a terms-addendum PDF; yearly income per channel  | ☐       |
| 6     | Notifications & deploy     | Email reminders; 24/7 iCal reachability on a VPS          | ☐       |

Legend: ✅ done · ▶ in progress / next · ☐ not started.

## What each phase adds

- **0 — Foundation ✅** SvelteKit + Drizzle/SQLite scaffold, full schema (8
  entities), channel seed data, CI (lint/typecheck/build), bun.
- **1 — CRUD slice** Property + booking + guest CRUD via SvelteKit form actions
  and list views. **This is the point the app becomes usable locally** — the
  first real data goes in here (e.g. _adjust bikes & tennis gear in the listing_
  becomes a task/listing edit in the app, not a doc).
- **2 — Calendar engine** FullCalendar view + the "is range X–Y free?" check
  over bookings + blockings, with conflict detection.
- **3 — Tasks/cleaning** Rule: confirmed booking auto-creates a cleaning task
  with deadline = next check-in; recurring maintenance tasks; task board.
- **4 — Sync** `+server.ts` iCal export feed + a worker process (Effect) that
  polls Airbnb, creates shadow bookings, and raises feed-health/conflict alerts.
- **5 — Docs & money** PDF generator (terms addendum, rental agreement, booking
  confirmation, receipt) + ledger and per-channel yearly tax summary.
- **6 — Notify & ship** Email (Nodemailer), reminders (missing payout, broken
  feed), deploy to a small VPS for 24/7 iCal reachability.

## Where TODOs live (convention)

- **Operational / listing TODOs** (adjust the listing, a specific cleaning, "update
  the annons on channel X") are **data the app manages** — they belong in the app
  as `Task` / `Property` records, not as Markdown in this repo.
- **Development TODOs** (how the app works, what to build next) belong as Markdown
  here — this file is their home.
