<script lang="ts">
  import { onMount } from 'svelte';
  import { Calendar } from '@fullcalendar/core';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let el: HTMLDivElement;
  let calendar: Calendar | undefined;
  let selected = $state('all');

  function visibleEvents() {
    return data.events
      .filter((e) => selected === 'all' || e.propertyId === selected)
      .map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end, color: e.color }));
  }

  onMount(() => {
    calendar = new Calendar(el, {
      plugins: [dayGridPlugin],
      initialView: 'dayGridMonth',
      firstDay: 1, // Monday
      height: 'auto',
      events: visibleEvents()
    });
    calendar.render();
    return () => calendar?.destroy();
  });

  // Re-filter whenever the property selection changes. Reading the events
  // (which depend on `selected`) is what registers the reactive dependency.
  $effect(() => {
    const events = visibleEvents();
    if (!calendar) return;
    calendar.removeAllEvents();
    calendar.addEventSource(events);
  });
</script>

<div class="head">
  <h1>Calendar</h1>
  {#if data.properties.length > 1}
    <label class="filter">
      Property
      <select bind:value={selected}>
        <option value="all">All properties</option>
        {#each data.properties as p (p.id)}
          <option value={p.id}>{p.name}</option>
        {/each}
      </select>
    </label>
  {/if}
</div>

<div class="legend">
  <span><i style="background: #2f6f4f"></i> Confirmed booking</span>
  <span><i style="background: #c9932f"></i> Tentative (inquiry/offer)</span>
  <span><i style="background: #3a6ea5"></i> Imported (shadow)</span>
  <span><i style="background: #8a8a8a"></i> Blocking</span>
</div>

<div class="calendar" bind:this={el}></div>

<style>
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .filter {
    flex-direction: row;
    align-items: baseline;
    gap: 0.5rem;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .legend i {
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 2px;
    display: inline-block;
  }

  .calendar {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.75rem;
    font-size: 0.9rem;
  }
</style>
