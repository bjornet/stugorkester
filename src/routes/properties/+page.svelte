<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1>Properties</h1>

{#if data.properties.length === 0}
  <p class="muted">No properties yet. Add your first one below.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Description</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each data.properties as item (item.id)}
        <tr>
          <td>{item.name}</td>
          <td class="muted">{item.description ?? '–'}</td>
          <td><a href={resolve('/properties/[id]', { id: item.id })}>Edit</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<h2>Add property</h2>

{#if form?.created}
  <p class="muted">Property created.</p>
{/if}

<form class="stack" method="POST" action="?/create">
  <label>
    Name
    <input name="name" value={form?.values?.name ?? ''} required />
  </label>
  <label>
    Description
    <textarea name="description" rows="2">{form?.values?.description ?? ''}</textarea>
  </label>
  <label>
    House rules
    <textarea name="houseRules" rows="3">{form?.values?.houseRules ?? ''}</textarea>
  </label>
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  <div>
    <button type="submit">Create property</button>
  </div>
</form>
