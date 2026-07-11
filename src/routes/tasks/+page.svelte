<script lang="ts">
  import { resolve } from '$app/paths';
  import TaskFields from '$lib/components/TaskFields.svelte';
  import { humanize } from '$lib/format';
  import { taskStatusValues } from '$lib/task-enums';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const canCreate = $derived(data.properties.length > 0);
</script>

<h1>Tasks</h1>
<p class="muted">
  Cleaning, maintenance and listing updates — linked to a booking or standing alone.
</p>

<div class="filters">
  <a href={resolve('/tasks')} class:active={!data.activeStatus}>All</a>
  {#each taskStatusValues as status (status)}
    <a href="{resolve('/tasks')}?status={status}" class:active={data.activeStatus === status}>
      {humanize(status)}
    </a>
  {/each}
</div>

{#if data.tasks.length === 0}
  <p class="muted">
    No tasks{data.activeStatus ? ` with status “${humanize(data.activeStatus)}”` : ''}.
  </p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Due</th>
        <th>Type</th>
        <th>Title</th>
        <th>Property</th>
        <th>Status</th>
        <th>Assignee</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each data.tasks as item (item.id)}
        <tr>
          <td>{item.dueDate ?? '–'}</td>
          <td>{humanize(item.type)}</td>
          <td>{item.title}</td>
          <td>{item.property.name}</td>
          <td>{humanize(item.status)}</td>
          <td class="muted">{item.assignee ?? '–'}</td>
          <td><a href={resolve('/tasks/[id]', { id: item.id })}>Edit</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<h2>Add task</h2>

{#if form?.created}
  <p class="muted">Task created.</p>
{/if}

{#if !canCreate}
  <p class="muted">
    You need at least one <a href={resolve('/properties')}>property</a> before adding a task.
  </p>
{:else}
  <form class="stack" method="POST" action="?/create">
    <TaskFields properties={data.properties} bookings={data.bookings} values={form?.values ?? {}} />
    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}
    <div>
      <button type="submit">Create task</button>
    </div>
  </form>
{/if}

<style>
  .filters {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .filters a {
    text-decoration: none;
    color: var(--muted);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  .filters a.active {
    background: var(--accent);
    color: #fff;
  }
</style>
