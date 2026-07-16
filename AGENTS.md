# AGENTS.md

Agent-agnostic instructions for this repo. See `CLAUDE.md` for Claude Code–specific overrides (currently none).

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Add-ons**: drizzle, sveltekit-adapter, eslint, prettier

---

# stugorkester

Orchestration system for cabin rental management (bookings, cleaning, guests,
pricing) across multiple channels (Airbnb, Stugknuten, Stugnet, ...). This
system is the source of truth; the rental platforms are outputs/mirrors, never
master data.

Full design notes: `docs/orkestreringssystem.md`.

## Language rule (non-negotiable)

English is the default for conversation and business discussion with the user;
Swedish is fine when the user prefers it. **Code, database schema, identifiers,
comments, commit messages, and docs in this repo are always in English.**

When a Swedish business term is used in conversation or in a design doc, it
must be translated to its English equivalent before it appears in code, schema,
or database — never transliterated or used as-is. The canonical mapping lives in
[`docs/dictionary.md`](docs/dictionary.md).

If a new Swedish term shows up that isn't in the dictionary, pick an English
equivalent, add it there in the same change, and use it consistently.

## Tech stack

- **SvelteKit** (adapter-node, not serverless) — form actions for admin CRUD,
  `+server.ts` endpoints for the iCal feed, SSR.
- **SQLite via Drizzle** — single file, zero ops.
- **Worker process** — separate small process (same codebase, shares the DB
  module) for iCal polling, reminders, conflict alerts.
- **Effect** — scoped to the sync/worker module only, not the whole backend
  (typed errors, retries/backoff, timeouts, `Effect.repeat` + `Schedule`).
  CRUD stays plain SvelteKit code.
- **FullCalendar** for the calendar view.
- **iCal**: `ical-generator` (export), `node-ical` (parsing).
- **PDF**: HTML templates → PDF (Puppeteer or pdfkit).
- **Notifications**: email first (Nodemailer + SMTP); push/SMS later.
- **Deployment**: small VPS/PaaS (Hetzner, Fly.io, Railway) — the iCal export
  needs 24/7 reachability.

Design principle: "boring technology" — one process (+ worker), one SQLite
file, no microservices. The value is in the data model and the flows, not the
infrastructure.

## Notes for implementation

- Channels have capability attributes (payment, contract coverage, insurance,
  cleaning handling, sync type, commission model) that drive which documents/
  tasks the system must generate per booking — see `docs/orkestreringssystem.md`
  §4.1/§4.3.
- Guest payment state and payout-to-owner state are separate; do not conflate
  them (see Payment entity notes in the design doc).
- Airbnb sync is never assumed watertight — conflict detection and feed-health
  alerts are required, not optional.
- Docs convention: operational/listing TODOs (adjust the listing, a specific
  cleaning, "update the annons on channel X") are data the app manages — they
  belong in the app as `Task`/`Property` records, not as Markdown here. Only
  development TODOs live as Markdown; the roadmap is in `ROADMAP.md`.

## Version control

- **Never squash merge.** Merge pull requests with a real merge commit (or
  rebase) so the individual commits stay in the history. Keep history real —
  don't collapse a branch into a single commit.
- Write commits that stand on their own, since each one survives the merge.

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues (`bjornet/stugorkester`); use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
