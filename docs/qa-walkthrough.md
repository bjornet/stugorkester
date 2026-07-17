# QA & "get to know the app"

A hands-on walkthrough for trying the app out and a checklist for verifying it
still behaves after changes. Two parts:

1. **Guided tour** — the happy path, to get familiar with the features.
2. **QA checklist** — specific behaviours to confirm, with expected results.

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

Work top-to-bottom; each step builds on the previous one.

1. **Properties** → create a cabin (e.g. "Sjöstugan"). A property is required
   before you can add bookings, blockings, or tasks.
2. **Bookings** → add a booking with status **confirmed**. Then add a second
   booking whose dates overlap the first → you get a **conflict warning** with a
   **"Save anyway"** button (detection alerts, it never hard-blocks).
3. **Tasks** → the confirmed booking has auto-created a **cleaning task** with
   its due date on the checkout day.
4. **Blockings** → add an owner stay or maintenance window (a busy period with
   no guest).
5. **Calendar** → everything shows on the month grid, colour-coded: confirmed
   bookings green, tentative amber, blockings grey.
6. **Properties → (your cabin)** → at the bottom, copy the **iCal feed URL**
   (`/properties/<id>/calendar.ics`) that Airbnb and other channels subscribe
   to.
7. **Feeds** → register a channel's iCal URL to import from (leave **Active**
   checked), then run `bun run worker:once` to pull its busy dates in as shadow
   bookings. The feed's health (OK / stale / error) is shown here. See the
   Import-worker checklist below for a ready-made loopback setup.
8. **Economy** → the confirmed booking's income, commission, and net show under
   its channel for the year, with a tax estimate.
9. **Bookings → (a booking) → Generate documents** → open the channel-appropriate
   documents (e.g. terms addendum or rental agreement) and use the browser's
   “Save as PDF”.

## Part 2 — QA checklist

Expected results assume a single property unless stated.

### Bookings & conflict detection

- [ ] Creating a booking with `check-out` on or before `check-in` is rejected
      with a validation error.
- [ ] Two bookings that overlap raise a conflict warning listing the clashing
      entry; **Save anyway** persists it regardless.
- [ ] **Half-open dates:** a booking checking in on the exact day another checks
      out is **not** a conflict (the checkout day is free again).
- [ ] Editing a booking excludes itself from its own conflict check (saving an
      unchanged booking never conflicts with itself).

### Cleaning-task rule

- [ ] Confirming a booking creates exactly one **cleaning task** due on the
      checkout day.
- [ ] A tentative booking (**inquiry** / **offered**) creates **no** cleaning
      task.
- [ ] Promoting a tentative booking to **confirmed** then creates the task.
- [ ] Moving a booking's checkout date moves the cleaning task's due date; the
      task's title/status/assignee are left untouched.

### Tasks board

- [ ] The status filter (All / pending / in progress / done) filters the list.
- [ ] Dated tasks sort by soonest deadline first; **undated tasks sort last**.

### Blockings

- [ ] A blocking overlapping a booking (or another blocking) raises the same
      conflict warning + Save-anyway override.

### Calendar

- [ ] Bookings and blockings appear on the correct days, colour-coded.
- [ ] The property filter appears only when there is more than one property, and
      filters events to the selected property.

### iCal export feed (`/properties/<id>/calendar.ics`)

- [ ] Returns `Content-Type: text/calendar` and a valid `VCALENDAR`.
- [ ] Contains committed bookings and blockings as all-day events; the `DTEND`
      is exclusive (matches the half-open checkout day).
- [ ] Carries **no guest data** — summaries are just "Booked" / "Blocked".
- [ ] **Tentative** bookings (inquiry/offered) are **excluded** from the feed.

### Import worker (`bun run worker:once`)

A quick loopback that reuses the app's own export feed. Set it up first:

1. Two properties — **A** with a confirmed, priced booking or two, and **B**
   (empty).
2. Copy **A**'s feed URL from its property page — a full URL including your dev
   host/port, e.g. `http://localhost:5173/properties/<A-id>/calendar.ics`.
3. **Feeds → Add feed:** property **B**, any channel, that URL, and leave
   **Active** checked. (An inactive feed is skipped — the worker just logs
   `sync: no active feeds`.)

Then, with `bun run dev` still running, `bun run worker:once`:

- [ ] After one run, property B has **shadow bookings** matching A's busy dates.
- [ ] Running again imports nothing new (idempotent); the feed's health shows a
      recent **last success**.
- [ ] Removing a stay on the source and re-running **deletes** the matching
      shadow booking; moving its dates **updates** it.
- [ ] A firm (non-shadow) booking on B overlapping an imported date creates a
      **"Sync conflict…" task** (once, not on every poll).
- [ ] A feed with a bad URL records an **error** in its health and does **not**
      stop other feeds from syncing.
- [ ] With `ALERT_EMAIL_TO` set, an unhealthy feed makes the worker log/send a
      digest email once, then stay quiet on the next run (24h throttle). Without
      `SMTP_URL` it logs the message instead of sending.

### Economy (`/economy`)

- [ ] Confirming a priced booking posts income, commission (channel rate), and
      net under its channel for the checkout year; re-saving doesn't duplicate.
- [ ] Downgrading the booking to tentative, or deleting it, removes its entries.
- [ ] A 0%-commission channel (e.g. Stugnet) shows commission 0 and net = income.
- [ ] The tax estimate deducts 40 000 kr + 20% and taxes the surplus at 30%.

### Documents (`/bookings/<id>/documents`)

- [ ] The document set matches the channel: partial-contract → terms addendum;
      no-contract → rental agreement; no channel payment → confirmation +
      receipt; check-in info always.
- [ ] Opening a document renders it with the booking's data; **Print / Save as
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

## Part 4 — Automated checks

These are what CI runs; all should pass before pushing:

```sh
bun run lint     # prettier + eslint
bun run check    # svelte-check typecheck
bun run test     # vitest unit tests
bun run build    # production build
```

Inspect the database directly with `bun run db:studio` (Drizzle Studio).
