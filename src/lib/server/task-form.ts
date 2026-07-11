import { taskStatusValues, taskTypeValues, type TaskStatus, type TaskType } from '$lib/task-enums';
import { isIsoDate, isOneOf, text } from './forms';

export interface TaskInput {
  propertyId: string;
  bookingId: string | null;
  type: TaskType;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  assignee: string | null;
}

/** Raw field values echoed back to the form so nothing is lost on error. */
export type TaskFormValues = Record<string, FormDataEntryValue | null>;

export type ParseResult =
  { ok: true; value: TaskInput } | { ok: false; error: string; values: TaskFormValues };

/** Parse and validate a task create/update submission. */
export function parseTask(data: FormData): ParseResult {
  const values: TaskFormValues = {
    propertyId: data.get('propertyId'),
    bookingId: data.get('bookingId'),
    type: data.get('type'),
    title: data.get('title'),
    description: data.get('description'),
    dueDate: data.get('dueDate'),
    status: data.get('status'),
    assignee: data.get('assignee')
  };

  const fail = (error: string): ParseResult => ({ ok: false, error, values });

  const propertyId = text(data, 'propertyId');
  const type = text(data, 'type');
  const title = text(data, 'title');
  const status = text(data, 'status');
  const dueDate = text(data, 'dueDate');

  if (!propertyId) return fail('Property is required.');
  if (!isOneOf(type, taskTypeValues)) return fail('Invalid task type.');
  if (!title) return fail('Title is required.');
  if (!isOneOf(status, taskStatusValues)) return fail('Invalid status.');
  if (dueDate && !isIsoDate(dueDate)) return fail('Due date must be a valid date (YYYY-MM-DD).');

  return {
    ok: true,
    value: {
      propertyId,
      bookingId: text(data, 'bookingId'),
      type,
      title,
      description: text(data, 'description'),
      dueDate,
      status,
      assignee: text(data, 'assignee')
    }
  };
}
