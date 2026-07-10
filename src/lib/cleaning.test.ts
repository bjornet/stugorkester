import { describe, expect, it } from 'vitest';
import { bookingStatusValues } from './booking-status';
import { cleaningTaskDueDate, cleaningTaskTitle, shouldHaveCleaningTask } from './cleaning';

describe('shouldHaveCleaningTask', () => {
  it('is false for tentative statuses', () => {
    expect(shouldHaveCleaningTask('inquiry')).toBe(false);
    expect(shouldHaveCleaningTask('offered')).toBe(false);
  });

  it('is true from confirmed onward', () => {
    expect(shouldHaveCleaningTask('confirmed')).toBe(true);
    expect(shouldHaveCleaningTask('checked_in')).toBe(true);
    expect(shouldHaveCleaningTask('checked_out')).toBe(true);
    expect(shouldHaveCleaningTask('completed')).toBe(true);
  });

  it('covers every booking status without throwing', () => {
    for (const status of bookingStatusValues) {
      expect(typeof shouldHaveCleaningTask(status)).toBe('boolean');
    }
  });
});

describe('cleaningTaskDueDate', () => {
  it('is the checkout day', () => {
    expect(cleaningTaskDueDate('2026-08-05')).toBe('2026-08-05');
  });
});

describe('cleaningTaskTitle', () => {
  it('uses the guest name when present', () => {
    expect(cleaningTaskTitle('Anna')).toBe('Cleaning after Anna checkout');
  });

  it('falls back to a generic label', () => {
    expect(cleaningTaskTitle(null)).toBe('Cleaning after guest checkout');
    expect(cleaningTaskTitle(undefined)).toBe('Cleaning after guest checkout');
  });
});
