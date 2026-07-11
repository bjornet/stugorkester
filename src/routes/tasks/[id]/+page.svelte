<script lang="ts">
  import { resolve } from '$app/paths';
  import TaskFields from '$lib/components/TaskFields.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // On a failed update, re-show what the user typed; otherwise the stored row.
  const values = $derived(form?.values ?? data.task);
</script>

<p><a href={resolve('/tasks')}>← Tasks</a></p>
<h1>Edit task</h1>

<form class="stack" method="POST" action="?/update">
  <TaskFields properties={data.properties} bookings={data.bookings} {values} />
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  <div>
    <button type="submit">Save changes</button>
  </div>
</form>

<h2>Delete</h2>
<form method="POST" action="?/delete">
  <button class="danger" type="submit">Delete task</button>
</form>
