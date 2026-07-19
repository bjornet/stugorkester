# QA & "get to know the app"

A hands-on walkthrough for trying the app out and checklists for verifying it
still behaves after changes. Four parts: a **guided tour** (Part 1, the happy
path to get familiar), a **QA checklist** (Part 2, specific behaviours to
confirm), **change-driven QA** (Part 3, checks tied to individual fixes/features
as they land), and **automated checks** (Part 4, what CI runs).

Every item below is a tick box: `[ ]` still to do, `[x]` done.

For the domain/design behind the features, see
[`orkestreringssystem.md`](orkestreringssystem.md); for phase status, see the
[ROADMAP](../ROADMAP.md).

## Prerequisites

```sh
bun install
cp .env.example .env         # DATABASE_URL=local.db
bun run db:migrate           # create the SQLite schema
bun run db:seed              # seed the channels (Airbnb, Stugknuten, …)
bun run dev                  # → http://localhost:5173
```

`db:migrate` / `db:seed` are one-time (re-run migrate after schema changes,
seed after channel-data changes or a DB reset). Day to day it's just
`bun run dev`.

## Part 1 — Guided tour

Work top-to-bottom; each step builds on the previous one. _Completed in the
2026-07-16 QA sweep — ticked below._

- [x] **Properties** → create a cabin (e.g. "Sjöstugan"). A property is required
      before you can add bookings, blockings, or tasks.
- [x] **Bookings** → add a booking with status **confirmed**. Then add a second
      booking whose dates overlap the first → you get a **conflict warning** with
      a **"Save anyway"** button (detection alerts, it never hard-blocks).
- [x] **Tasks** → the confirmed booking has auto-created a **cleaning task** with
      its due date on the checkout day.
- [x] **Blockings** → add an owner stay or maintenance window (a busy period with
      no guest).
- [x] **Calendar** → everything shows on the month grid, colour-coded: confirmed
      bookings green, tentative amber, blockings grey.
- [x] **Properties → (your cabin)** → at the bottom, copy the **iCal feed URL**
      (`/properties/<id>/calendar.ics`) that Airbnb and other channels subscribe
      to.
- [x] **Feeds** → register a channel's iCal URL to import from (leave **Active**
      checked), then run `bun run worker:once` to pull its busy dates in as
      shadow bookings. The feed's health (OK / stale / error) is shown here. See
      the Import-worker checklist below for a ready-made loopback setup.
- [x] **Economy** → the confirmed booking's income, commission, and net show
      under its channel for the year, with a tax estimate.
- [x] **Bookings → (a booking) → Generate documents** → open the
      channel-appropriate documents (e.g. terms addendum or rental agreement) and
      use the browser's "Save as PDF".

## Part 2 — QA checklist

Expected results assume a single property unless stated. _Completed in the
2026-07-16 sweep; behaviours that failed became the issues now re-verified in
Part 3._

### Bookings & conflict detection

- [x] Creating a booking with `check-out` on or before `check-in` is rejected
      with a validation error.
- [x] Two bookings that overlap raise a conflict warning listing the clashing
      entry; **Save anyway** persists it regardless.
- [x] **Half-open dates:** a booking checking in on the exact day another checks
      out is **not** a conflict (the checkout day is free again).
- [x] Editing a booking excludes itself from its own conflict check (saving an
      unchanged booking never conflicts with itself).

### Cleaning-task rule

- [x] Confirming a booking creates exactly one **cleaning task** due on the
      checkout day.
- [x] A tentative booking (**inquiry** / **offered**) creates **no** cleaning
      task.
- [x] Promoting a tentative booking to **confirmed** then creates the task.
- [x] Moving a booking's checkout date moves the cleaning task's due date; the
      task's title/status/assignee are left untouched.

### Tasks board

- [x] The status filter (All / pending / in progress / done) filters the list.
- [x] Dated tasks sort by soonest deadline first; **undated tasks sort last**.

### Blockings

- [x] A blocking overlapping a booking (or another blocking) raises the same
      conflict warning + Save-anyway override.

### Calendar

- [x] Bookings and blockings appear on the correct days, colour-coded.
- [x] The property filter appears only when there is more than one property, and
      filters events to the selected property.

### iCal export feed (`/properties/<id>/calendar.ics`)

- [x] Returns `Content-Type: text/calendar` and a valid `VCALENDAR`.
- [x] Contains committed bookings and blockings as all-day events; the `DTEND`
      is exclusive (matches the half-open checkout day).
- [x] Carries **no guest data** — summaries are just "Booked" / "Blocked".
- [x] **Tentative** bookings (inquiry/offered) are **excluded** from the feed.

### Import worker (`bun run worker:once`)

A quick loopback that reuses the app's own export feed. Set it up first:

- [x] Two properties — **A** with a confirmed, priced booking or two, and **B**
      (empty).
- [x] Copy **A**'s feed URL from its property page — a full URL including your
      dev host/port, e.g. `http://localhost:5173/properties/<A-id>/calendar.ics`.
- [x] **Feeds → Add feed:** property **B**, any channel, that URL, and leave
      **Active** checked. (An inactive feed is skipped — the worker just logs
      `sync: no active feeds`.)

Then, with `bun run dev` still running, `bun run worker:once`:

- [x] After one run, property B has **shadow bookings** matching A's busy dates.
- [x] Running again imports nothing new (idempotent); the feed's health shows a
      recent **last success**.
- [x] Removing a stay on the source and re-running **deletes** the matching
      shadow booking; moving its dates **updates** it.
- [x] A firm (non-shadow) booking on B overlapping an imported date creates a
      **"Sync conflict…" task** (once, not on every poll).
- [x] A feed with a bad URL records an **error** in its health and does **not**
      stop other feeds from syncing.
- [x] With `ALERT_EMAIL_TO` set, an unhealthy feed makes the worker log/send a
      digest email once, then stay quiet on the next run (24h throttle). Without
      `SMTP_URL` it logs the message instead of sending.

### Economy (`/economy`)

- [x] Confirming a priced booking posts income, commission (channel rate), and
      net under its channel for the checkout year; re-saving doesn't duplicate.
- [x] Downgrading the booking to tentative, or deleting it, removes its entries.
- [x] A 0%-commission channel (e.g. Stugnet) shows commission 0 and net = income.
- [x] The tax estimate deducts 40 000 kr + 20% and taxes the surplus at 30%.

### Documents (`/bookings/<id>/documents`)

- [x] The document set matches the channel: partial-contract → terms addendum;
      no-contract → rental agreement; no channel payment → confirmation +
      receipt; check-in info always.
- [x] Opening a document renders it with the booking's data; **Print / Save as
      PDF** produces a clean page with no app navigation.

## Part 3 — Change-driven QA

Manual checks tied to specific changes, added as fixes/features land and **not
yet verified**. Tick each once you've confirmed it in the running app; QA is not
a merge gate, but the bullet is required for every user-facing change. Claude
reminds you of the still-open (unticked) items here.

- [ ] **#11 — iCal off-by-one.** Register a feed and import (see the Import-worker
      loopback above): shadow bookings land on the **exact** source dates, not a
      day earlier. Confirm in a non-UTC timezone.
- [ ] **#13 — Print hides app chrome.** Print / Save-as-PDF any generated
      document — the app header (brand + nav) is absent from the output.
- [ ] **#26 — Document print polish.** In the browser's Print preview of a
      document: no browser URL/date header or footer, tightened spacing, and a
      short document fits on one page.
- [ ] **#14 — Airbnb document set.** Re-seed (`bun run db:seed`), then on an
      **Airbnb** booking's Generate-documents page the set offers a **Terms
      addendum** (not a Rental agreement), same as Stugknuten.
- [ ] **#23 — Save no-op under conflict.** On booking create/edit, trigger a
      date conflict: the primary **Save changes / Create booking** button is
      **disabled** (greyed); editing any field re-enables it; **Save anyway**
      still persists.
- [ ] **#21 — Copy feed URL.** On a property page, the iCal feed URL has a
      **Copy** button; clicking it copies the URL and briefly shows "Copied!".
- [ ] **#24 — Sync-conflict task title.** Trigger a sync conflict (import worker
      loopback with an overlapping firm booking): the created **Sync conflict**
      task's title names the clashing entry (e.g. `booking 2026-08-03 → …`), not
      just the imported dates.
- [ ] **#22 — Imported bookings on calendar.** Shadow (imported) bookings show
      in a distinct **blue** with an "imported" title and a matching legend
      entry, distinct from firm green/tentative amber/grey blockings.
- [ ] **#15 — Conflicting rows highlighted.** In the bookings table, a booking
      that overlaps another booking/blocking on the same property shows a tinted
      row + a ⚠ marker on the check-in cell (hover shows why).
- [ ] **#17 — Related tasks column.** The bookings table has a **Tasks** column
      linking to each booking's related task(s) (e.g. its cleaning task at
      `/tasks/<id>`); bookings with none show "–".
- [ ] **#16 — Conflict banner on edit load.** Open an existing booking that
      overlaps another entry: the conflict banner shows immediately (before any
      save), listing the clashing entry.
- [ ] **#27 — Duplicate booking.** On a booking's edit page, **Duplicate as
      draft** creates a copy (same property/dates/prices, **status inquiry**, **no
      guest**) and lands on the new booking's edit page; no cleaning task or
      ledger entry is auto-created for the draft.
- [ ] **#28 — Booking as template.** On a booking's edit page, **Use as
      template** opens the Add-booking form prefilled with its property, channel
      and prices, but **dates and guest blank**; a hint says so. Filling dates +
      Create makes a normal new booking.
- [ ] **#12 — Delete booking with a cleaning task.** Confirm a booking (creates
      its cleaning task), then delete the booking: it succeeds with **no error**,
      and its cleaning task + ledger entries are gone (previously threw a foreign
      key error).

## Part 4 — Automated checks

These are what CI runs; all should pass before pushing:

```sh
bun run lint     # prettier + eslint
bun run check    # svelte-check typecheck
bun run test     # vitest unit tests
bun run build    # production build
```

Inspect the database directly with `bun run db:studio` (Drizzle Studio).
