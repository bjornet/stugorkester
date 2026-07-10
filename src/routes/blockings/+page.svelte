<script lang="ts">
  import { resolve } from '$app/paths';
  import BlockingFields from '$lib/components/BlockingFields.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const canCreate = $derived(data.properties.length > 0);
</script>

<h1>Blockings</h1>
<p class="muted">
  Owner stays and maintenance windows — dates that are unavailable but not a guest booking.
</p>

{#if data.blockings.length === 0}
  <p class="muted">No blockings yet.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Start</th>
        <th>End</th>
        <th>Property</th>
        <th>Reason</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each data.blockings as item (item.id)}
        <tr>
          <td>{item.startDate}</td>
          <td>{item.endDate}</td>
          <td>{item.property.name}</td>
          <td class="muted">{item.reason ?? '–'}</td>
          <td><a href={resolve('/blockings/[id]', { id: item.id })}>Edit</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<h2>Add blocking</h2>

{#if form?.created}
  <p class="muted">Blocking created.</p>
{/if}

{#if !canCreate}
  <p class="muted">
    You need at least one <a href={resolve('/properties')}>property</a> before adding a blocking.
  </p>
{:else}
  <form class="stack" method="POST" action="?/create">
    <BlockingFields properties={data.properties} values={form?.values ?? {}} />
    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}
    <div>
      <button type="submit">Create blocking</button>
    </div>
  </form>
{/if}
