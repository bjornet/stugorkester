# Deploy

The iCal export feed must be reachable 24/7 (design §5), so the app runs on a
small always-on VPS/PaaS (Hetzner, Fly.io, Railway). It is two processes that
share one SQLite file:

1. **Web** — the SvelteKit app (adapter-node): admin UI, the iCal export feed,
   SSR.
2. **Worker** — polls channel feeds, imports shadow bookings, and sends
   feed-health alerts.

Both run under **Node**, not Bun: `better-sqlite3` is a native module the Bun
runtime can't load, and the worker relies on Node's type stripping.

## Build

```sh
bun install --frozen-lockfile
bun run build          # adapter-node output in ./build
```

## Environment

Set these in the host's environment (see `.env.example`):

- `DATABASE_URL` — path to the SQLite file on a **persistent** disk (e.g.
  `/data/stugorkester.db`), so bookings survive restarts and redeploys.
- `SYNC_INTERVAL_MINUTES` — worker poll interval (default 15).
- `SMTP_URL`, `ALERT_EMAIL_FROM`, `ALERT_EMAIL_TO` — optional; enable email
  alerts for stale/erroring feeds. Without them the worker just logs.

Apply migrations against the production database once per deploy that changes
the schema:

```sh
DATABASE_URL=/data/stugorkester.db bun run db:migrate
DATABASE_URL=/data/stugorkester.db bun run db:seed   # first deploy only
```

## Run

```sh
# Web (behind a TLS-terminating reverse proxy — Caddy/nginx — on 443):
DATABASE_URL=/data/stugorkester.db node build

# Worker (second process, same host, same DB file):
DATABASE_URL=/data/stugorkester.db bun run worker
```

`node build` listens on `PORT` (default 3000). Put it behind a reverse proxy
that terminates HTTPS, since channels fetch the feed over the public internet.

### systemd (example)

Two units on the VPS, both with `Restart=always` and an `EnvironmentFile`:

```ini
# /etc/systemd/system/stugorkester-web.service
[Service]
WorkingDirectory=/opt/stugorkester
EnvironmentFile=/opt/stugorkester/.env
ExecStart=/usr/bin/node build
Restart=always

# /etc/systemd/system/stugorkester-worker.service
[Service]
WorkingDirectory=/opt/stugorkester
EnvironmentFile=/opt/stugorkester/.env
ExecStart=/usr/bin/bun run worker
Restart=always
```

## Backups

The whole database is one SQLite file — back it up on a schedule (e.g. a nightly
`sqlite3 "$DATABASE_URL" ".backup /backups/…"` or a filesystem snapshot).

## Containers

A container image is a reasonable alternative (needed for Fly.io). Keep the two
constraints in mind: run the **Node** runtime (not Bun) so `better-sqlite3`
loads, and include the worker's `src/` and full `node_modules` in the image
(the worker runs from source via Node type stripping, so it isn't bundled by
the build). Validate the native `better-sqlite3` build on the target
architecture. A Dockerfile is intentionally not committed yet — add one once
the target platform is chosen and the image is verified there.
