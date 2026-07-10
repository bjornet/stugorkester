<script lang="ts">
  import { resolve } from '$app/paths';
  import BookingFields from '$lib/components/BookingFields.svelte';
  import { bookingStatusLabel, money } from '$lib/format';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const canCreate = $derived(data.properties.length > 0 && data.channels.length > 0);
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
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each data.bookings as item (item.id)}
        <tr>
          <td>{item.checkIn}</td>
          <td>{item.checkOut}</td>
          <td>{item.property.name}</td>
          <td>{item.channel.name}</td>
          <td class="muted">{item.guest?.name ?? '–'}</td>
          <td>{bookingStatusLabel(item.status)}</td>
          <td>{money(item.totalPrice)}</td>
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
  <form class="stack" method="POST" action="?/create">
    <BookingFields
      properties={data.properties}
      channels={data.channels}
      guests={data.guests}
      values={form?.values ?? {}}
    />
    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}
    <div>
      <button type="submit">Create booking</button>
    </div>
  </form>
{/if}
