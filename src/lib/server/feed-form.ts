import { checkbox, isHttpUrl, text } from './forms';

export interface FeedInput {
  propertyId: string;
  channelId: string;
  url: string;
  active: boolean;
}

/** Raw field values echoed back to the form so nothing is lost on error. */
export type FeedFormValues = Record<string, FormDataEntryValue | null>;

export type ParseResult =
  { ok: true; value: FeedInput } | { ok: false; error: string; values: FeedFormValues };

/** Parse and validate a channel-feed create/update submission. */
export function parseFeed(data: FormData): ParseResult {
  const values: FeedFormValues = {
    propertyId: data.get('propertyId'),
    channelId: data.get('channelId'),
    url: data.get('url'),
    active: data.get('active')
  };

  const fail = (error: string): ParseResult => ({ ok: false, error, values });

  const propertyId = text(data, 'propertyId');
  const channelId = text(data, 'channelId');
  const url = text(data, 'url');

  if (!propertyId) return fail('Property is required.');
  if (!channelId) return fail('Channel is required.');
  if (!url || !isHttpUrl(url)) return fail('A valid http(s) feed URL is required.');

  return { ok: true, value: { propertyId, channelId, url, active: checkbox(data, 'active') } };
}
