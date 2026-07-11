<script lang="ts">
  import { resolve } from '$app/paths';
  import FeedFields from '$lib/components/FeedFields.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const canCreate = $derived(data.properties.length > 0 && data.channels.length > 0);

  const HEALTH_LABEL: Record<string, string> = {
    ok: 'OK',
    stale: 'Stale',
    error: 'Error',
    pending: 'Never polled',
    paused: 'Paused'
  };
</script>

<h1>Channel feeds</h1>
<p class="muted">
  iCal feeds the worker polls (e.g. an Airbnb listing) to import busy dates as shadow bookings.
  Broken feeds are the most common silent failure, so their health is tracked here.
</p>

{#if data.feeds.length === 0}
  <p class="muted">No feeds yet.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Property</th>
        <th>Channel</th>
        <th>Health</th>
        <th>Last success</th>
        <th>URL</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each data.feeds as feed (feed.id)}
        <tr>
          <td>{feed.propertyName}</td>
          <td>{feed.channelName}</td>
          <td><span class="badge {feed.health}">{HEALTH_LABEL[feed.health]}</span></td>
          <td class="muted">{feed.lastSuccessAt ?? '–'}</td>
          <td class="url muted">{feed.url}</td>
          <td><a href={resolve('/feeds/[id]', { id: feed.id })}>Edit</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<h2>Add feed</h2>

{#if form?.created}
  <p class="muted">Feed created.</p>
{/if}

{#if !canCreate}
  <p class="muted">
    You need at least one <a href={resolve('/properties')}>property</a> and one channel before adding
    a feed.
  </p>
{:else}
  <form class="stack" method="POST" action="?/create">
    <FeedFields properties={data.properties} channels={data.channels} values={form?.values ?? {}} />
    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}
    <div>
      <button type="submit">Create feed</button>
    </div>
  </form>
{/if}

<style>
  .url {
    max-width: 18rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge {
    display: inline-block;
    padding: 0.05rem 0.5rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
  }

  .badge.ok {
    background: #2f6f4f;
  }

  .badge.stale,
  .badge.pending {
    background: #c9932f;
  }

  .badge.error {
    background: #b23b3b;
  }

  .badge.paused {
    background: #8a8a8a;
  }
</style>
