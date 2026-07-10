// Client-safe source of truth for task enums. The Drizzle schema re-exports
// these so each enum stays defined in exactly one place (as booking-status.ts
// does for booking status).

export const taskTypeValues = ['cleaning', 'maintenance', 'listing_update', 'other'] as const;

export type TaskType = (typeof taskTypeValues)[number];

export const taskStatusValues = ['pending', 'in_progress', 'done'] as const;

export type TaskStatus = (typeof taskStatusValues)[number];
