<script lang="ts">
  interface Option {
    id: string;
    name: string;
  }

  interface Values {
    propertyId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    reason?: string | null;
  }

  let {
    properties,
    values = {}
  }: {
    properties: Option[];
    values?: Values;
  } = $props();

  const val = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
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

<div class="row">
  <label>
    Start date
    <input name="startDate" type="date" value={val(values.startDate)} required />
  </label>
  <label>
    End date
    <input name="endDate" type="date" value={val(values.endDate)} required />
  </label>
</div>

<label>
  Reason
  <input name="reason" value={val(values.reason)} placeholder="Owner stay, maintenance…" />
</label>

<style>
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.75rem;
  }
</style>
