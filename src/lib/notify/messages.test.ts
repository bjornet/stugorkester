import { describe, expect, it } from 'vitest';
import { feedAlertMessage } from './messages';

describe('feedAlertMessage', () => {
  it('summarises a single unhealthy feed', () => {
    const msg = feedAlertMessage([
      { propertyName: 'Sjöstugan', channelName: 'Airbnb', health: 'error', lastError: 'HTTP 404' }
    ]);
    expect(msg.subject).toBe('stugorkester: 1 feed need attention');
    expect(msg.text).toContain('1 channel feed is unhealthy:');
    expect(msg.text).toContain('• Sjöstugan / Airbnb: error — HTTP 404');
  });

  it('summarises several and omits missing error detail', () => {
    const msg = feedAlertMessage([
      { propertyName: 'A', channelName: 'Airbnb', health: 'stale', lastError: null },
      { propertyName: 'B', channelName: 'Booking', health: 'error', lastError: 'ETIMEDOUT' }
    ]);
    expect(msg.subject).toBe('stugorkester: 2 feeds need attention');
    expect(msg.text).toContain('2 channel feeds are unhealthy:');
    expect(msg.text).toContain('• A / Airbnb: stale');
    expect(msg.text).not.toContain('A / Airbnb: stale —');
    expect(msg.text).toContain('• B / Booking: error — ETIMEDOUT');
  });
});
