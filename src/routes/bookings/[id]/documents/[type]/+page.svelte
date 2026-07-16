<script lang="ts">
  // Documents render as print-optimised HTML; the host uses the browser's
  // "Save as PDF". This keeps deployment light (no headless Chromium on the
  // VPS). Possible later work: generate server-side PDF files (Puppeteer or
  // pdfkit), most useful once Phase 6 emails documents as attachments.
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

  /* Set explicit page margins so the browser drops its own URL/date
     header and footer (Chrome omits them for any non-default margin). */
  @page {
    margin: 1.5cm;
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
      font-size: 0.9rem;
    }

    /* Tighten vertical rhythm so a document fits one page where possible. */
    .doc h1 {
      font-size: 1.3rem;
      margin: 0 0 0.5rem;
    }

    .doc h2 {
      font-size: 1rem;
      margin: 1rem 0 0.35rem;
    }

    .doc p {
      margin: 0.25rem 0;
    }

    .meta {
      gap: 0.35rem 1.5rem;
      margin: 0 0 0.75rem;
      padding-bottom: 0.75rem;
    }
  }
</style>
