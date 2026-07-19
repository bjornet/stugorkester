import type { HandleServerError } from '@sveltejs/kit';

/**
 * Log the full server-side error + stack for any uncaught error during a
 * request. Without this SvelteKit shows only a generic 500 and the stack is
 * lost — which is exactly why the booking status-change failure in #12 was hard
 * to pin down. Returns a safe, generic message to the client.
 */
export const handleError: HandleServerError = ({ error, event, status, message }) => {
  console.error(`[error] ${event.request.method} ${event.url.pathname} → ${status}`, error);
  return { message };
};
