<script lang="ts">
  import { resolve } from '$app/paths';
  import BlockingFields from '$lib/components/BlockingFields.svelte';
  import ConflictWarning from '$lib/components/ConflictWarning.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // On a failed update, re-show what the user typed; otherwise the stored row.
  const values = $derived(form?.values ?? data.blocking);
</script>

<p><a href={resolve('/blockings')}>← Blockings</a></p>
<h1>Edit blocking</h1>

<form class="stack" method="POST" action="?/update">
  <BlockingFields properties={data.properties} {values} />
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  {#if form?.conflicts}
    <ConflictWarning conflicts={form.conflicts} />
  {/if}
  <div class="actions">
    <button type="submit">Save changes</button>
    {#if form?.conflicts}
      <button class="danger" type="submit" name="force" value="true">Save anyway</button>
    {/if}
  </div>
</form>

<h2>Delete</h2>
<form method="POST" action="?/delete">
  <button class="danger" type="submit">Delete blocking</button>
</form>
