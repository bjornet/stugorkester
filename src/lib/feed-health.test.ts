import { describe, expect, it } from 'vitest';
import { feedHealth, type FeedHealthInput } from './feed-health';

const NOW = new Date('2026-07-11T12:00:00Z').getTime();

const base: FeedHealthInput = {
  active: true,
  lastPolledAt: null,
  lastSuccessAt: null,
  lastError: null
};

describe('feedHealth', () => {
  it('is paused when inactive', () => {
    expect(feedHealth({ ...base, active: false }, NOW)).toBe('paused');
  });

  it('is pending when never fetched', () => {
    expect(feedHealth(base, NOW)).toBe('pending');
  });

  it('is ok when the last success is recent', () => {
    expect(feedHealth({ ...base, lastSuccessAt: '2026-07-11T10:00:00Z' }, NOW)).toBe('ok');
  });

  it('is stale when the last success is older than the window', () => {
    expect(feedHealth({ ...base, lastSuccessAt: '2026-07-11T00:00:00Z' }, NOW)).toBe('stale');
  });

  it('is error when the latest poll attempt failed after the last success', () => {
    const feed: FeedHealthInput = {
      active: true,
      lastSuccessAt: '2026-07-11T10:00:00Z',
      lastPolledAt: '2026-07-11T11:00:00Z',
      lastError: 'ETIMEDOUT'
    };
    expect(feedHealth(feed, NOW)).toBe('error');
  });

  it('stays ok when an old error predates a newer success', () => {
    const feed: FeedHealthInput = {
      active: true,
      lastSuccessAt: '2026-07-11T11:00:00Z',
      lastPolledAt: '2026-07-11T11:00:00Z',
      lastError: 'ETIMEDOUT (earlier)'
    };
    expect(feedHealth(feed, NOW)).toBe('ok');
  });

  it('respects a custom stale window', () => {
    const feed = { ...base, lastSuccessAt: '2026-07-11T10:00:00Z' };
    expect(feedHealth(feed, NOW, 1)).toBe('stale');
  });
});
