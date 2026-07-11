<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const cards = $derived([
    { href: resolve('/properties'), label: 'Properties', count: data.counts.properties },
    { href: resolve('/bookings'), label: 'Bookings', count: data.counts.bookings },
    { href: resolve('/blockings'), label: 'Blockings', count: data.counts.blockings },
    { href: resolve('/tasks'), label: 'Open tasks', count: data.counts.openTasks },
    { href: resolve('/guests'), label: 'Guests', count: data.counts.guests }
  ]);
</script>

<h1>Dashboard</h1>
<p class="muted">
  Source of truth for cabin rentals. Manage properties, bookings and guests here, or open the
  <a href={resolve('/calendar')}>calendar</a> for an availability overview.
</p>

<div class="cards">
  {#each cards as card (card.href)}
    <a class="card" href={card.href}>
      <span class="count">{card.count}</span>
      <span class="label">{card.label}</span>
    </a>
  {/each}
</div>

<style>
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .card {
    display: grid;
    gap: 0.25rem;
    padding: 1.25rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    text-decoration: none;
    color: var(--fg);
  }

  .count {
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent);
  }

  .label {
    color: var(--muted);
  }
</style>
