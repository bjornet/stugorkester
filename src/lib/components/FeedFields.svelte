<script lang="ts">
  interface Option {
    id: string;
    name: string;
  }

  interface Values {
    propertyId?: string | null;
    channelId?: string | null;
    url?: string | null;
    active?: boolean | string | null;
  }

  let {
    properties,
    channels,
    values = {}
  }: {
    properties: Option[];
    channels: Option[];
    values?: Values;
  } = $props();

  const val = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
  // Default to active for a fresh form; respect the stored/echoed value otherwise.
  const isActive = $derived(values.active === undefined ? true : Boolean(values.active));
</script>

<label>
  Property
  <select name="propertyId" required>
    <option value="" disabled selected={!values.propertyId}>Select a property…</option>
    {#each properties as option (option.id)}
      <option value={option.id} selected={values.propertyId === option.id}>{option.name}</option>
    {/each}
  </select>
</label>

<label>
  Channel
  <select name="channelId" required>
    <option value="" disabled selected={!values.channelId}>Select a channel…</option>
    {#each channels as option (option.id)}
      <option value={option.id} selected={values.channelId === option.id}>{option.name}</option>
    {/each}
  </select>
</label>

<label>
  Feed URL
  <input
    name="url"
    type="url"
    placeholder="https://…/calendar.ics"
    value={val(values.url)}
    required
  />
</label>

<label class="checkbox">
  <input type="checkbox" name="active" checked={isActive} />
  Active (the worker polls this feed)
</label>

<style>
  .checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    font-weight: 400;
    color: var(--fg);
  }

  .checkbox input {
    width: auto;
  }
</style>
