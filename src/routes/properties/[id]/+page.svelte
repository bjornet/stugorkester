<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
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
