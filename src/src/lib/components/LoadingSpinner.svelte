<script lang="ts">
  export let message: string = 'Loading...';
  export let progress: string | null = null;
</script>

<div class="loader">
  <div class="spinner"></div>
  <div class="text">{message}</div>
  {#if progress}
    <div class="progress">{progress}</div>
  {/if}
</div>

<style>
  .loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .text {
    color: #666;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .progress {
    color: #888;
    font-size: 0.875rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>