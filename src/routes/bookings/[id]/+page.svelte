<script lang="ts">
  import { resolve } from '$app/paths';
  import BookingFields from '$lib/components/BookingFields.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // On a failed update, re-show what the user typed; otherwise the stored row.
  const values = $derived(form?.values ?? data.booking);
</script>

<p><a href={resolve('/bookings')}>← Bookings</a></p>
<h1>Edit booking</h1>

<form class="stack" method="POST" action="?/update">
  <BookingFields
    properties={data.properties}
    channels={data.channels}
    guests={data.guests}
    {values}
  />
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  <div>
    <button type="submit">Save changes</button>
  </div>
</form>

<h2>Delete</h2>
<form method="POST" action="?/delete">
  <button class="danger" type="submit">Delete booking</button>
</form>
