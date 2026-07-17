<script lang="ts">
  import { resolve } from '$app/paths';
  import BookingFields from '$lib/components/BookingFields.svelte';
  import ConflictWarning from '$lib/components/ConflictWarning.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // On a failed update, re-show what the user typed; otherwise the stored row.
  const values = $derived(form?.values ?? data.booking);

  // While a conflict is shown, a plain "Save changes" just re-triggers the same
  // 409 — a silent no-op. Disable it until the user edits a field (which can
  // clear the conflict); "Save anyway" always overrides. State resets on each
  // submit because the form does a full round-trip (no use:enhance).
  let edited = $state(false);
  const saveBlocked = $derived(!!form?.conflicts && !edited);

  // Show the conflict banner before any save: after a rejected submit use the
  // fresh set for the typed values (`form.conflicts`); otherwise the stored
  // booking's conflicts computed on load (`data.conflicts`).
  const conflicts = $derived(form?.conflicts ?? data.conflicts);
</script>

<p><a href={resolve('/bookings')}>← Bookings</a></p>
<h1>Edit booking</h1>

<form class="stack" method="POST" action="?/update" oninput={() => (edited = true)}>
  <BookingFields
    properties={data.properties}
    channels={data.channels}
    guests={data.guests}
    {values}
  />
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  {#if conflicts && conflicts.length > 0}
    <ConflictWarning {conflicts} />
  {/if}
  <div class="actions">
    <button type="submit" disabled={saveBlocked}>Save changes</button>
    {#if form?.conflicts}
      <button class="danger" type="submit" name="force" value="true">Save anyway</button>
    {/if}
  </div>
</form>

<h2>Documents</h2>
<p>
  <a href={resolve('/bookings/[id]/documents', { id: data.booking.id })}>Generate documents →</a>
</p>

<h2>Delete</h2>
<form method="POST" action="?/delete">
  <button class="danger" type="submit">Delete booking</button>
</form>
