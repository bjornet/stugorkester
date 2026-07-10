import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let instance: DrizzleDb | undefined;

// Connect lazily on first use. Opening the connection at import time would
// make SvelteKit's build-time analysis (which imports every server module)
// fail whenever DATABASE_URL is unset, e.g. in CI — even though no query runs.
function connect(): DrizzleDb {
  if (!instance) {
    if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    instance = drizzle(new Database(env.DATABASE_URL), { schema });
  }
  return instance;
}

// A thin proxy so callers keep using `db` as if it were the Drizzle instance;
// the real client is created (and DATABASE_URL is required) only on first
// property access. Methods are bound to the real instance so `this` is correct.
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    const real = connect();
    const value = Reflect.get(real, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  }
});
