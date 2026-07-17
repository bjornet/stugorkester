<script lang="ts">
  import { resolve } from '$app/paths';
  import BookingFields from '$lib/components/BookingFields.svelte';
  import ConflictWarning from '$lib/components/ConflictWarning.svelte';
  import { bookingStatusLabel, money } from '$lib/format';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const canCreate = $derived(data.properties.length > 0 && data.channels.length > 0);
  // Rows whose dates overlap another booking/blocking on the same property.
  const conflictIds = $derived(new Set(data.conflictIds));

  // While a conflict is shown, a plain "Create booking" just re-triggers the
  // same 409 — a silent no-op. Disable it until the user edits a field;
  // "Save anyway" always overrides. State resets each submit (full round-trip).
  let edited = $state(false);
  const createBlocked = $derived(!!form?.conflicts && !edited);
</script>

<h1>Bookings</h1>

{#if data.bookings.length === 0}
  <p class="muted">No bookings yet.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Check-in</th>
        <th>Check-out</th>
        <th>Property</th>
        <th>Channel</th>
        <th>Guest</th>
        <th>Status</th>
        <th>Total</th>
        <th>Tasks</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each data.bookings as item (item.id)}
        {@const conflict = conflictIds.has(item.id)}
        <tr class:conflict title={conflict ? 'Overlaps another booking or blocking' : undefined}>
          <td
            >{item.checkIn}{#if conflict}<span class="flag" aria-label="conflict">⚠</span>{/if}</td
          >
          <td>{item.checkOut}</td>
          <td>{item.property.name}</td>
          <td>{item.channel.name}</td>
          <td class="muted">{item.guest?.name ?? '–'}</td>
          <td>{bookingStatusLabel(item.status)}</td>
          <td>{money(item.totalPrice)}</td>
          <td>
            {#each data.tasksByBooking[item.id] ?? [] as t, i (t.id)}
              {#if i > 0}<span class="muted">, </span>{/if}<a
                href={resolve('/tasks/[id]', { id: t.id })}>{t.title}</a
              >
            {:else}
              <span class="muted">–</span>
            {/each}
          </td>
          <td><a href={resolve('/bookings/[id]', { id: item.id })}>Edit</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<h2>Add booking</h2>

{#if form?.created}
  <p class="muted">Booking created.</p>
{/if}

{#if !canCreate}
  <p class="muted">
    You need at least one <a href={resolve('/properties')}>property</a> and one channel before adding
    a booking.
  </p>
{:else}
  <form class="stack" method="POST" action="?/create" oninput={() => (edited = true)}>
    <BookingFields
      properties={data.properties}
      channels={data.channels}
      guests={data.guests}
      values={form?.values ?? {}}
    />
    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}
    {#if form?.conflicts}
      <ConflictWarning conflicts={form.conflicts} />
    {/if}
    <div class="actions">
      <button type="submit" disabled={createBlocked}>Create booking</button>
      {#if form?.conflicts}
        <button class="danger" type="submit" name="force" value="true">Save anyway</button>
      {/if}
    </div>
  </form>
{/if}

<style>
  tr.conflict td {
    background: #fdf3f3;
  }

  .flag {
    margin-left: 0.4rem;
    color: var(--danger);
  }
</style>
