<script lang="ts">
  // Shown when a booking/blocking overlaps existing dates. Detection alerts
  // but never blocks (design §4.2) — the form offers a "Save anyway" override.
  let { conflicts }: { conflicts: string[] } = $props();
</script>

<div class="conflict" role="alert">
  <strong>Date conflict</strong>
  <p>This range overlaps {conflicts.length} existing entr{conflicts.length === 1 ? 'y' : 'ies'}:</p>
  <ul>
    {#each conflicts as c (c)}
      <li>{c}</li>
    {/each}
  </ul>
  <p class="muted">Change the dates and save, or use “Save anyway” to keep the overlap.</p>
</div>

<style>
  .conflict {
    border: 1px solid var(--danger);
    border-radius: 6px;
    background: #fdf3f3;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .conflict strong {
    color: var(--danger);
  }

  .conflict ul {
    margin: 0.5rem 0;
    padding-left: 1.2rem;
  }

  .conflict p {
    margin: 0.25rem 0;
  }
</style>
