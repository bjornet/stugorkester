import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.ts';
import { channels } from './channels.ts';

const client = new Database(process.env.DATABASE_URL ?? 'local.db');
const db = drizzle(client, { schema });

for (const value of channels) {
  db.insert(schema.channel)
    .values(value)
    .onConflictDoUpdate({ target: schema.channel.name, set: value })
    .run();
}

console.log(`Seeded ${channels.length} channels.`);
