<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const { model } = $derived(data);
</script>

<div class="actions no-print">
  <a href={resolve('/bookings/[id]/documents', { id: data.bookingId })}>← Documents</a>
  <button type="button" onclick={() => window.print()}>Print / Save as PDF</button>
</div>

<article class="doc">
  <h1>{model.title}</h1>
  <dl class="meta">
    <div>
      <dt>Property</dt>
      <dd>{model.propertyName}</dd>
    </div>
    <div>
      <dt>Guest</dt>
      <dd>{model.guestName ?? '—'}</dd>
    </div>
    <div>
      <dt>Period</dt>
      <dd>{model.checkIn} – {model.checkOut}</dd>
    </div>
    <div>
      <dt>Channel</dt>
      <dd>{model.channelName}</dd>
    </div>
  </dl>

  {#each model.sections as section (section.heading)}
    <section>
      <h2>{section.heading}</h2>
      {#each section.body as paragraph (paragraph)}
        <p>{paragraph}</p>
      {/each}
    </section>
  {/each}
</article>

<style>
  .actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  .doc {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 2rem 2.5rem;
    max-width: 46rem;
  }

  .doc h1 {
    font-size: 1.5rem;
    margin: 0 0 1rem;
  }

  .doc h2 {
    font-size: 1.05rem;
    margin: 1.5rem 0 0.5rem;
  }

  .doc p {
    margin: 0.35rem 0;
    white-space: pre-line;
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 0.5rem 1.5rem;
    margin: 0 0 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }

  .meta div {
    display: grid;
  }

  .meta dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .meta dd {
    margin: 0;
  }

  @media print {
    :global(header),
    .no-print {
      display: none;
    }

    :global(.app) {
      max-width: none;
      padding: 0;
    }

    .doc {
      border: none;
      border-radius: 0;
      padding: 0;
      max-width: none;
    }
  }
</style>
