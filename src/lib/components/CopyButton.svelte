<script lang="ts">
  // Reusable copy-to-clipboard button. Use anywhere a short string (feed URLs,
  // ids, …) is worth copying. Shows brief "Copied!" feedback.
  let { text, label = 'Copy' }: { text: string; label?: string } = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      clearTimeout(timer);
      timer = setTimeout(() => (copied = false), 1500);
    } catch {
      copied = false;
    }
  }
</script>

<button type="button" class="secondary" onclick={copy}>{copied ? 'Copied!' : label}</button>
