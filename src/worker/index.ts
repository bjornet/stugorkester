// Background worker: polls active channel feeds and imports shadow bookings.
// Runs as a separate Node process sharing the DB module (design §5). Not part
// of the SvelteKit app; started with `bun run worker` (which invokes Node,
// because better-sqlite3 is a native module unsupported by the Bun runtime).
import { Duration, Effect, Schedule } from 'effect';
import { createDb } from '../lib/server/db/client.ts';
import { syncAllFeeds, type SyncResult } from '../lib/sync/sync.ts';
import { alertUnhealthyFeeds } from '../lib/sync/alerts.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const db = createDb(url);
const once = process.argv.includes('--once');
const intervalMinutes = Number(process.env.SYNC_INTERVAL_MINUTES ?? '15');

function report(results: SyncResult[]): void {
  const ts = new Date().toISOString();
  if (results.length === 0) {
    console.log(`[${ts}] sync: no active feeds`);
    return;
  }
  for (const r of results) {
    if (r.ok) {
      console.log(
        `[${ts}] feed ${r.feedId}: +${r.inserted} ~${r.updated} -${r.deleted}, ${r.conflicts} conflict(s)`
      );
    } else {
      console.error(`[${ts}] feed ${r.feedId}: ERROR ${r.error}`);
    }
  }
}

const runOnce = syncAllFeeds(db).pipe(
  Effect.tap((results) => Effect.sync(() => report(results))),
  // After importing, alert on any feeds that are stale or erroring.
  Effect.flatMap(() => Effect.promise(() => alertUnhealthyFeeds(db, Date.now()))),
  Effect.tap((alerted) =>
    Effect.sync(() => {
      if (alerted > 0) console.log(`[notify] alerted about ${alerted} unhealthy feed(s)`);
    })
  )
);

const program: Effect.Effect<unknown> = once
  ? runOnce
  : Effect.repeat(runOnce, Schedule.spaced(Duration.minutes(intervalMinutes)));

if (!once) {
  console.log(`worker started; polling every ${intervalMinutes} min`);
}

Effect.runPromise(program).then(
  () => {
    if (once) process.exit(0);
  },
  (err) => {
    console.error('worker crashed', err);
    process.exit(1);
  }
);
