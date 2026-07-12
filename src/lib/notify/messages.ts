// Pure builders for notification message bodies (design §4.2/§5 alarms).
// Client-safe and side-effect free so they can be unit-tested; the transport
// lives in email.ts.

export interface EmailMessage {
  subject: string;
  text: string;
}

export interface FeedHealthLine {
  propertyName: string;
  channelName: string;
  health: string;
  lastError: string | null;
}

/** Digest email for feeds that need attention (stale or erroring). */
export function feedAlertMessage(unhealthy: readonly FeedHealthLine[]): EmailMessage {
  const n = unhealthy.length;
  const plural = n === 1 ? 'feed' : 'feeds';
  const lines = unhealthy.map((f) => {
    const detail = f.lastError ? ` — ${f.lastError}` : '';
    return `• ${f.propertyName} / ${f.channelName}: ${f.health}${detail}`;
  });
  return {
    subject: `stugorkester: ${n} ${plural} need attention`,
    text: [`${n} channel ${plural} ${n === 1 ? 'is' : 'are'} unhealthy:`, '', ...lines].join('\n')
  };
}
