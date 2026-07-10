<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1>Guests</h1>

{#if data.guests.length === 0}
  <p class="muted">No guests yet. Add your first one below.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each data.guests as item (item.id)}
        <tr>
          <td>{item.name}</td>
          <td class="muted">{item.email ?? '–'}</td>
          <td class="muted">{item.phone ?? '–'}</td>
          <td><a href={resolve('/guests/[id]', { id: item.id })}>Edit</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<h2>Add guest</h2>

{#if form?.created}
  <p class="muted">Guest created.</p>
{/if}

<form class="stack" method="POST" action="?/create">
  <label>
    Name
    <input name="name" value={form?.values?.name ?? ''} required />
  </label>
  <label>
    Email
    <input name="email" type="email" value={form?.values?.email ?? ''} />
  </label>
  <label>
    Phone
    <input name="phone" value={form?.values?.phone ?? ''} />
  </label>
  <label>
    Notes
    <textarea name="notes" rows="2">{form?.values?.notes ?? ''}</textarea>
  </label>
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  <div>
    <button type="submit">Create guest</button>
  </div>
</form>
