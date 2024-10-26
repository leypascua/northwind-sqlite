<script lang="ts">
  export let query: string = '';
  export let active: boolean = false;
  export let onClose: () => void;
  export let onClick: () => void;
  export let index: number;

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.close-btn')) {
      onClick();
    }
  }
</script>

<div 
  class="tab" 
  class:active 
  on:click={handleClick}
>
  <span>Query {index + 1}</span>
  <button class="close-btn" on:click={onClose}>×</button>
</div>

<style>
  .tab {
    padding: 0 0.75rem;
    background: var(--vscode-tab-inactive-background);
    border-right: 1px solid var(--vscode-border);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    height: 35px;
    font-size: 0.8125rem;
    color: #969696;
    min-width: 120px;
    max-width: 200px;
    user-select: none;
  }

  .tab:hover {
    background: #2a2d2e;
  }

  .active {
    background: var(--vscode-tab-active-background);
    color: var(--vscode-foreground);
    position: relative;
  }

  .active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--vscode-button-background);
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    color: inherit;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    margin-left: auto;
  }

  .close-btn:hover {
    background: #424242;
  }
</style>