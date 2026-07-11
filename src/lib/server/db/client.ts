import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
// Relative import with extension so the worker process (plain Node, no Vite
// alias resolution) can load this module too, exactly like the seed script.
import * as schema from './schema.ts';

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

/** Open a Drizzle/better-sqlite3 client for the given SQLite file. Shared by
 *  the SvelteKit app (lazy, via $env) and the worker (via process.env). */
export function createDb(url: string): DrizzleDb {
  return drizzle(new Database(url), { schema });
}
