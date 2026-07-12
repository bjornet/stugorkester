<script lang="ts">
  import { resolve } from '$app/paths';
  import { money } from '$lib/format';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<h1>Economy</h1>
<p class="muted">
  Income, commission and net per channel — booked automatically when a booking is confirmed. Use it
  as a declaration aid; the tax figure is an estimate, not advice.
</p>

{#if data.years.length === 0}
  <p class="muted">
    No economy entries yet. Confirm a booking with a price to book its first entry.
  </p>
{:else}
  <div class="years">
    <span class="muted">Year:</span>
    {#each data.years as y (y)}
      <a href="{resolve('/economy')}?year={y}" class:active={data.year === y}>{y}</a>
    {/each}
  </div>

  <table>
    <thead>
      <tr>
        <th>Channel</th>
        <th class="num">Income</th>
        <th class="num">Commission</th>
        <th class="num">Net</th>
      </tr>
    </thead>
    <tbody>
      {#each data.channels as c (c.channelId)}
        <tr>
          <td>{c.channelName}</td>
          <td class="num">{money(c.income)}</td>
          <td class="num">{money(c.commission)}</td>
          <td class="num">{money(c.net)}</td>
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr>
        <th>Total</th>
        <th class="num">{money(data.totals.income)}</th>
        <th class="num">{money(data.totals.commission)}</th>
        <th class="num">{money(data.totals.net)}</th>
      </tr>
    </tfoot>
  </table>

  <h2>Tax estimate ({data.year})</h2>
  <table class="tax">
    <tbody>
      <tr><td>Gross rental income</td><td class="num">{money(data.tax.grossIncome)}</td></tr>
      <tr>
        <td>Standard deduction</td>
        <td class="num">−{money(data.tax.standardDeduction)}</td>
      </tr>
      <tr>
        <td>20% income deduction</td>
        <td class="num">−{money(data.tax.incomeDeduction)}</td>
      </tr>
      <tr class="strong"><td>Taxable surplus</td><td class="num">{money(data.tax.taxable)}</td></tr>
      <tr class="strong"><td>Estimated tax (30%)</td><td class="num">{money(data.tax.tax)}</td></tr>
    </tbody>
  </table>
  <p class="muted note">
    The 40 000 kr allowance is per person across all private rentals, so multi-property or
    multi-owner situations need care. Figures use gross income (cleaning included counts as rental
    income).
  </p>
{/if}

<style>
  .years {
    display: flex;
    gap: 0.75rem;
    align-items: baseline;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .years a {
    text-decoration: none;
    color: var(--muted);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  .years a.active {
    background: var(--accent);
    color: #fff;
  }

  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  tfoot th {
    background: #f2f2f2;
  }

  table.tax {
    max-width: 26rem;
  }

  .tax .strong td {
    font-weight: 700;
  }

  .note {
    max-width: 40rem;
    font-size: 0.82rem;
    margin-top: 0.5rem;
  }
</style>
