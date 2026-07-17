<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const feedPath = $derived(resolve('/properties/[id]/calendar.ics', { id: data.property.id }));
  const feedUrl = $derived(`${page.url.origin}${feedPath}`);
</script>

<p><a href={resolve('/properties')}>← Properties</a></p>
<h1>Edit property</h1>

<form class="stack" method="POST" action="?/update">
  <label>
    Name
    <input name="name" value={data.property.name} required />
  </label>
  <label>
    Description
    <textarea name="description" rows="2">{data.property.description ?? ''}</textarea>
  </label>
  <label>
    House rules
    <textarea name="houseRules" rows="3">{data.property.houseRules ?? ''}</textarea>
  </label>
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  <div>
    <button type="submit">Save changes</button>
  </div>
</form>

<h2>Calendar feed (iCal)</h2>
<p class="muted">
  Subscribe Airbnb and other channels to this URL. It publishes committed bookings and blockings as
  busy dates only — no guest details.
</p>
<p class="feed-url">
  <a href={feedPath}><code>{feedUrl}</code></a>
  <CopyButton text={feedUrl} label="Copy" />
</p>

<h2>Delete</h2>
{#if data.bookingCount > 0}
  <p class="muted">
    This property has {data.bookingCount} booking(s) and cannot be deleted.
  </p>
{:else}
  <form method="POST" action="?/delete">
    <button class="danger" type="submit">Delete property</button>
  </form>
{/if}

<style>
  .feed-url {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
</style>
