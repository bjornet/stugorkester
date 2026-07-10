<script lang="ts">
  import { bookingStatusValues } from '$lib/booking-status';
  import { bookingStatusLabel } from '$lib/format';

  interface Option {
    id: string;
    name: string;
  }

  interface Values {
    propertyId?: string | null;
    channelId?: string | null;
    guestId?: string | null;
    status?: string | null;
    checkIn?: string | null;
    checkOut?: string | null;
    basePrice?: number | string | null;
    cleaningFee?: number | string | null;
    totalPrice?: number | string | null;
    cancellationPolicy?: string | null;
    externalRef?: string | null;
  }

  let {
    properties,
    channels,
    guests,
    values = {}
  }: {
    properties: Option[];
    channels: Option[];
    guests: Option[];
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
  Guest
  <select name="guestId">
    <option value="" selected={!values.guestId}>— none —</option>
    {#each guests as option (option.id)}
      <option value={option.id} selected={values.guestId === option.id}>{option.name}</option>
    {/each}
  </select>
</label>

<label>
  Status
  <select name="status">
    {#each bookingStatusValues as status (status)}
      <option value={status} selected={(values.status ?? 'inquiry') === status}>
        {bookingStatusLabel(status)}
      </option>
    {/each}
  </select>
</label>

<div class="row">
  <label>
    Check-in
    <input name="checkIn" type="date" value={val(values.checkIn)} required />
  </label>
  <label>
    Check-out
    <input name="checkOut" type="date" value={val(values.checkOut)} required />
  </label>
</div>

<div class="row">
  <label>
    Base price (kr)
    <input name="basePrice" type="number" min="0" step="1" value={val(values.basePrice)} />
  </label>
  <label>
    Cleaning fee (kr)
    <input name="cleaningFee" type="number" min="0" step="1" value={val(values.cleaningFee)} />
  </label>
  <label>
    Total price (kr)
    <input name="totalPrice" type="number" min="0" step="1" value={val(values.totalPrice)} />
  </label>
</div>

<label>
  Cancellation policy
  <input name="cancellationPolicy" value={val(values.cancellationPolicy)} />
</label>

<label>
  External reference
  <input name="externalRef" value={val(values.externalRef)} />
</label>

<style>
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.75rem;
  }
</style>
