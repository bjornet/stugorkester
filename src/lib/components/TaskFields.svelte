<script lang="ts">
  import { taskStatusValues, taskTypeValues } from '$lib/task-enums';
  import { humanize } from '$lib/format';

  interface Option {
    id: string;
    name: string;
  }

  interface Values {
    propertyId?: string | null;
    bookingId?: string | null;
    type?: string | null;
    title?: string | null;
    description?: string | null;
    dueDate?: string | null;
    status?: string | null;
    assignee?: string | null;
  }

  let {
    properties,
    bookings,
    values = {}
  }: {
    properties: Option[];
    bookings: Option[];
    values?: Values;
  } = $props();

  const val = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
</script>

<label>
  Property
  <select name="propertyId" required>
    <option value="" disabled selected={!values.propertyId}>Select a property…</option>
    {#each properties as option (option.id)}
      <option value={option.id} selected={values.propertyId === option.id}>{option.name}</option>
    {/each}
  </select>
</label>

<label>
  Booking (optional)
  <select name="bookingId">
    <option value="" selected={!values.bookingId}>— none —</option>
    {#each bookings as option (option.id)}
      <option value={option.id} selected={values.bookingId === option.id}>{option.name}</option>
    {/each}
  </select>
</label>

<div class="row">
  <label>
    Type
    <select name="type">
      {#each taskTypeValues as type (type)}
        <option value={type} selected={(values.type ?? 'cleaning') === type}
          >{humanize(type)}</option
        >
      {/each}
    </select>
  </label>
  <label>
    Status
    <select name="status">
      {#each taskStatusValues as status (status)}
        <option value={status} selected={(values.status ?? 'pending') === status}>
          {humanize(status)}
        </option>
      {/each}
    </select>
  </label>
</div>

<label>
  Title
  <input name="title" value={val(values.title)} required />
</label>

<label>
  Description
  <textarea name="description" rows="2">{val(values.description)}</textarea>
</label>

<div class="row">
  <label>
    Due date
    <input name="dueDate" type="date" value={val(values.dueDate)} />
  </label>
  <label>
    Assignee
    <input name="assignee" value={val(values.assignee)} />
  </label>
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.75rem;
  }
</style>
