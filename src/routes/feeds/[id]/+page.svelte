<script lang="ts">
  import { resolve } from '$app/paths';
  import FeedFields from '$lib/components/FeedFields.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // On a failed update, re-show what the user typed; otherwise the stored row.
  const values = $derived(form?.values ?? data.feed);
</script>

<p><a href={resolve('/feeds')}>← Channel feeds</a></p>
<h1>Edit feed</h1>

<form class="stack" method="POST" action="?/update">
  <FeedFields properties={data.properties} channels={data.channels} {values} />
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  <div>
    <button type="submit">Save changes</button>
  </div>
</form>

{#if data.feed.lastError}
  <h2>Last error</h2>
  <p class="error">{data.feed.lastError}</p>
  <p class="muted">Last polled: {data.feed.lastPolledAt ?? '–'}</p>
{/if}

<h2>Delete</h2>
<form method="POST" action="?/delete">
  <button class="danger" type="submit">Delete feed</button>
</form>
