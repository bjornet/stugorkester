import { db } from '$lib/server/db';
import { channel, ledgerEntry } from '$lib/server/db/schema';
import { estimateTax } from '$lib/economy';
import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

interface ChannelRow {
  channelId: string;
  channelName: string;
  income: number;
  commission: number;
  net: number;
}

export const load: PageServerLoad = async ({ url }) => {
  // Which years have any ledger data, newest first.
  const yearRows = await db
    .selectDistinct({ year: sql<string>`substr(${ledgerEntry.occurredAt}, 1, 4)` })
    .from(ledgerEntry);
  const years = yearRows
    .map((r) => r.year)
    .filter(Boolean)
    .sort()
    .reverse();

  const requested = url.searchParams.get('year');
  const year = requested && years.includes(requested) ? requested : (years[0] ?? null);

  let channels: ChannelRow[] = [];
  if (year) {
    const start = `${year}-01-01`;
    const end = `${Number(year) + 1}-01-01`;
    const rows = await db
      .select({
        channelId: ledgerEntry.channelId,
        channelName: channel.name,
        type: ledgerEntry.type,
        total: sql<number>`sum(${ledgerEntry.amount})`
      })
      .from(ledgerEntry)
      .innerJoin(channel, eq(channel.id, ledgerEntry.channelId))
      .where(and(gte(ledgerEntry.occurredAt, start), lt(ledgerEntry.occurredAt, end)))
      .groupBy(ledgerEntry.channelId, channel.name, ledgerEntry.type)
      .orderBy(asc(channel.name));

    const byChannel = new Map<string, ChannelRow>();
    for (const r of rows) {
      const row =
        byChannel.get(r.channelId) ??
        ({
          channelId: r.channelId,
          channelName: r.channelName,
          income: 0,
          commission: 0,
          net: 0
        } as ChannelRow);
      if (r.type === 'income') row.income = r.total;
      else if (r.type === 'commission') row.commission = r.total;
      else if (r.type === 'net') row.net = r.total;
      byChannel.set(r.channelId, row);
    }
    channels = [...byChannel.values()];
  }

  const totals = channels.reduce(
    (acc, c) => ({
      income: acc.income + c.income,
      commission: acc.commission + c.commission,
      net: acc.net + c.net
    }),
    { income: 0, commission: 0, net: 0 }
  );

  return { year, years, channels, totals, tax: estimateTax(totals.income) };
};
