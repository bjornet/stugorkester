# Roadmap (TL;DR)

The shortest view of where development stands and when you can test-run the app.
Full design: `docs/orkestreringssystem.md`.

**Status now:** all phases (0–6) complete — the app is runnable locally and ready to deploy.
**▶ Runnable now:** `bun run dev` (see [Running locally](#running-locally)); deploy via [`docs/deploy.md`](docs/deploy.md).

| Phase | Goal                       | You can test-run…                                         | Status  |
| ----- | -------------------------- | --------------------------------------------------------- | ------- |
| 0     | Foundation                 | —                                                         | ✅ Done |
| 1     | First vertical slice: CRUD | Create a property, add/list bookings (`bun run dev`)      | ✅ Done |
| 2     | Calendar + availability    | See bookings/blocks on a calendar; get overlap warnings   | ✅ Done |
| 3     | Tasks & cleaning flow      | Confirm a booking → cleaning task auto-appears; task list | ✅ Done |
| 4     | iCal export + worker       | Subscribe Airbnb to your feed; import Airbnb bookings     | ✅ Done |
| 5     | Documents & economy        | Generate a terms-addendum PDF; yearly income per channel  | ✅ Done |
| 6     | Notifications & deploy     | Email reminders; 24/7 iCal reachability on a VPS          | ✅ Done |

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
- **4 — Sync ✅** Per-property iCal **export** feed at
  `/properties/[id]/calendar.ics` (committed bookings + blockings as busy
  all-day events, no guest data, tentative holds excluded), plus an **import
  worker**: register channel feeds under `/feeds`, and a separate Node process
  (`bun run worker`, Effect + `Schedule`) polls them with timeout/retry, imports
  busy dates as shadow bookings via a pure diff (`src/lib/sync/`, unit-tested),
  flags overlaps with firm bookings/blockings as conflict tasks, and tracks
  feed health. _Not yet:_ recurring maintenance-task scheduling could ride on
  this worker (see Phase 3).
- **5 — Docs & money ✅** Per-booking document generation from the booking's
  edit page: the set (terms addendum, rental agreement, booking confirmation,
  receipt, check-in info) is chosen from the channel's capability attributes
  (`src/lib/documents.ts`, unit-tested) and rendered as print-optimised pages
  the host saves as PDF. Plus **economy** (`/economy`): confirming a booking
  auto-posts income/commission/net ledger entries, summarised per channel per
  year with a standard-deduction tax estimate. _Deferred:_ server-side PDF
  files (Puppeteer) — pairs with email attachments in Phase 6.
- **6 — Notify & ship ✅** Email via Nodemailer (`src/lib/notify/`, SMTP from
  env with a dev log-only fallback; message builders unit-tested). The worker
  emails a throttled digest of stale/erroring feeds after each poll (design
  §4.2). Deploy runbook in [`docs/deploy.md`](docs/deploy.md): two Node
  processes (web + worker) sharing one SQLite file, behind a TLS reverse proxy
  for 24/7 feed reachability. _Not yet:_ the "missing payout X days after
  checkout" reminder — needs payout/payment tracking, which isn't modelled in
  the UI yet (a good first item for the next round of work).

## Running locally

```sh
bun install
cp .env.example .env         # DATABASE_URL=local.db
bun run db:migrate           # create the SQLite schema
bun run db:seed              # seed the channels (Airbnb, Stugknuten, …)
bun run dev                  # http://localhost:5173
```

To import channel feeds, register them under **Feeds** and run the worker
alongside the app (a separate Node process; `--once` does a single pass):

```sh
bun run worker               # poll active feeds on a loop
bun run worker:once          # single pass, then exit
```

Then create a property, add bookings and blockings, and open **Calendar** to
see them. Overlapping dates raise a conflict warning you can override. For a
guided tour and a QA checklist, see [`docs/qa-walkthrough.md`](docs/qa-walkthrough.md).

Checks: `bun run lint`, `bun run check`, `bun run test`, `bun run build`.

## Backlog & follow-ups

Non-phase work to pick up later.

- **Functional util library.** Evaluate **Ramda** — or a more TypeScript-friendly
  functional library (e.g. **Remeda** or **es-toolkit**) — for the pure logic
  modules (`availability`, `sync/diff`, `economy`, `documents`, `cleaning`).
  Weigh types/ergonomics against the "boring technology" principle and bundle
  size before adopting.
- **QA & familiarisation (once all phases land).** Before building further, set
  aside time to QA the whole system end to end (see
  [`docs/qa-walkthrough.md`](docs/qa-walkthrough.md)) and get familiar with the
  codebase. **Claude: remind me of this the moment Phase 6 is done.**
- **Multi-angle codebase review.** Critique what's been built so far from several
  angles, and act on the findings:
  1. **Design** — architecture, data model, module boundaries, the Effect
     scoping, the sync/worker split.
  2. **UX** — flows, forms, feedback/empty states, mobile friendliness.
  3. **DRY vs WET** — real duplication vs premature abstraction (the per-entity
     `*-form.ts` parsers and `*Fields.svelte` components are prime candidates).
  4. **Scale patterns** — what to introduce so the codebase scales: a shared
     validation approach, typed error handling, a service/repository layer,
     auth/multi-user, pagination, migrations discipline.
  5. **Deletable code** — (a) features built but not actually needed in the
     foreseeable future, and (b) junk lying around (dead code, stale comments,
     unused deps).

## QA-walkthrough findings (2026-07-16)

From a full end-to-end run of [`docs/qa-walkthrough.md`](docs/qa-walkthrough.md).
All 4 CI checks run; only `bun run test` fails (2 tests, pinpointing #B1).

### Bugs

- **B1 — iCal parser off by 1 day.** Imported shadow bookings land one day
  earlier on both start and end. Failing unit tests in
  `src/lib/sync/ical.test.ts` (`extracts uid and half-open dates …`,
  `treats a date-only event with no DTEND …`). Root cause: JS `Date` in local
  tz round-trip. Ties to the domain fact in #U6 (bookings aren't
  midnight-to-midnight).
- **B2 — Booking edit throws `FOREIGN KEY constraint failed`.**
  - Delete action misses the cleaning-task cleanup
    (`src/routes/bookings/[id]/+page.server.ts:54–58`).
  - Status change also throws, but the writes commit — a later query in the
    same request throws. Add a SvelteKit `handleError` hook to capture the
    stack trace.
- **B3 — Documents print/PDF shows the app top-nav.** Needs
  `@media print { nav { display: none } }` on the layout.
- **B4 — Wrong document set for Airbnb bookings.** Airbnb (partial-contract,
  channel-payment) offers **Rental agreement** where spec (§4.1) calls for
  **Terms addendum**.

### UX

- **U1 — Highlight conflicting rows/cells** in the bookings table.
- **U2 — Conflict banner in the booking edit form** (so it's visible before
  clicking Save).
- **U3 — Bookings table: column with links to related tasks.**
- **U4 — Blockings via inline calendar admin** (Airbnb-style), ideally
  on `/calendar`.
- **U5 — Calendar entries: click → slide-out edit pane.**
- **U6 — Calendar bars reflect intra-day timing** (partial-day overlap on
  checkout and check-in day). Shared root with #B1.
- **U7 — "Copy" button on iCal feed URL** (generalise to other copy-worthy
  strings).
- **U8 — Distinguish shadow / imported bookings visually** on the calendar.
- **U9 — Booking edit/create: "Save changes" is a silent no-op** when a
  conflict is shown; only "Save anyway" persists. Hide/disable or relabel.
- **U10 — Sync-conflict task title** should also name/link the firm booking
  it clashes with (today only mentions the shadow dates).
- **U11 — Hide (or grey out) non-actionable buttons/actions** in general.
- **U12 — Docs print CSS**: fit one page, drop browser URL header/footer,
  tighten spacing.

### Feature ideas

- **F1 — Duplicate an existing booking.**
- **F2 — Use existing booking as a template** for a new one (strip dates etc.).
- **F3 — i18n** (English base, Swedish override). Recommendation: Paraglide
  (Inlang). Run `/grill-me` on the language-switch UX before touching code.

### Content

- **C1 — Placeholder text in document templates.** `rental_agreement` and
  check-in info still carry literal TODOs ("QA: what would even be fitting
  here?", "Don't know how to fill this in…"). Fill or mark as required-fill.

## Where TODOs live (convention)

- **Operational / listing TODOs** (adjust the listing, a specific cleaning, "update
  the annons on channel X") are **data the app manages** — they belong in the app
  as `Task` / `Property` records, not as Markdown in this repo.
- **Development TODOs** (how the app works, what to build next) belong as Markdown
  here — this file is their home.
