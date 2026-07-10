<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  let { children } = $props();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/properties', label: 'Properties' },
    { href: '/bookings', label: 'Bookings' },
    { href: '/blockings', label: 'Blockings' },
    { href: '/guests', label: 'Guests' }
  ] as const;

  function isActive(href: string): boolean {
    if (href === '/') return page.url.pathname === '/';
    return page.url.pathname.startsWith(href);
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
  <header>
    <a class="brand" href={resolve('/')}>stugorkester</a>
    <nav>
      {#each links as link (link.href)}
        <a href={resolve(link.href)} class:active={isActive(link.href)}>{link.label}</a>
      {/each}
    </nav>
  </header>
  <main>
    {@render children()}
  </main>
</div>

<style>
  :global(:root) {
    --fg: #1a1a1a;
    --muted: #666;
    --border: #ddd;
    --bg: #fafafa;
    --card: #fff;
    --accent: #2f6f4f;
    --danger: #b23b3b;
  }

  :global(body) {
    margin: 0;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    color: var(--fg);
    background: var(--bg);
    line-height: 1.5;
  }

  :global(a) {
    color: var(--accent);
  }

  :global(h1) {
    font-size: 1.6rem;
    margin: 0 0 1rem;
  }

  :global(h2) {
    font-size: 1.2rem;
    margin: 2rem 0 0.75rem;
  }

  :global(table) {
    width: 100%;
    border-collapse: collapse;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }

  :global(th),
  :global(td) {
    text-align: left;
    padding: 0.55rem 0.75rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.92rem;
  }

  :global(th) {
    background: #f2f2f2;
    font-weight: 600;
  }

  :global(tr:last-child td) {
    border-bottom: none;
  }

  :global(form.stack) {
    display: grid;
    gap: 0.75rem;
    max-width: 34rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1rem 1.25rem;
  }

  :global(label) {
    display: grid;
    gap: 0.25rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
  }

  :global(input),
  :global(select),
  :global(textarea) {
    font: inherit;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: #fff;
  }

  :global(button) {
    font: inherit;
    padding: 0.45rem 0.9rem;
    border: 1px solid var(--accent);
    border-radius: 4px;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
  }

  :global(button.secondary) {
    background: #fff;
    color: var(--fg);
    border-color: var(--border);
  }

  :global(button.danger) {
    background: #fff;
    color: var(--danger);
    border-color: var(--danger);
  }

  :global(.error) {
    color: var(--danger);
    font-size: 0.85rem;
  }

  :global(.actions) {
    display: flex;
    gap: 0.75rem;
  }

  :global(.muted) {
    color: var(--muted);
  }

  .app {
    max-width: 60rem;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    display: flex;
    align-items: baseline;
    gap: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.5rem;
  }

  .brand {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--fg);
    text-decoration: none;
  }

  nav {
    display: flex;
    gap: 1rem;
  }

  nav a {
    text-decoration: none;
    color: var(--muted);
  }

  nav a.active {
    color: var(--accent);
    font-weight: 600;
  }

  main {
    display: block;
  }
</style>
