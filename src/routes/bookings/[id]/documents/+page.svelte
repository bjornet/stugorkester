<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<p><a href={resolve('/bookings/[id]', { id: data.bookingId })}>← Booking</a></p>
<h1>Documents</h1>
<p class="muted">
  {data.propertyName} · {data.channelName} · {data.checkIn} – {data.checkOut}. The set below is
  chosen from the channel's capabilities. Open one and use your browser's “Save as PDF”.
</p>

<ul class="docs">
  {#each data.documents as doc (doc.type)}
    <li>
      <a href={resolve('/bookings/[id]/documents/[type]', { id: data.bookingId, type: doc.type })}>
        {doc.title}
      </a>
    </li>
  {/each}
</ul>

<style>
  .docs {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.5rem;
    max-width: 26rem;
  }

  .docs a {
    display: block;
    padding: 0.6rem 0.9rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    text-decoration: none;
  }
</style>
