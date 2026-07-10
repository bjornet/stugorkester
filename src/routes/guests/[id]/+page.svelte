<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<p><a href={resolve('/guests')}>← Guests</a></p>
<h1>Edit guest</h1>

<form class="stack" method="POST" action="?/update">
  <label>
    Name
    <input name="name" value={data.guest.name} required />
  </label>
  <label>
    Email
    <input name="email" type="email" value={data.guest.email ?? ''} />
  </label>
  <label>
    Phone
    <input name="phone" value={data.guest.phone ?? ''} />
  </label>
  <label>
    Notes
    <textarea name="notes" rows="2">{data.guest.notes ?? ''}</textarea>
  </label>
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  <div>
    <button type="submit">Save changes</button>
  </div>
</form>

<h2>Delete</h2>
{#if data.bookingCount > 0}
  <p class="muted">This guest has {data.bookingCount} booking(s) and cannot be deleted.</p>
{:else}
  <form method="POST" action="?/delete">
    <button class="danger" type="submit">Delete guest</button>
  </form>
{/if}
