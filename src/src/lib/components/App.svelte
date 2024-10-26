<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import QueryTab from './lib/components/QueryTab.svelte';
  import QueryEditor from './lib/components/QueryEditor.svelte';
  import ResultsTable from './lib/components/ResultsTable.svelte';
  import LoadingSpinner from './lib/components/LoadingSpinner.svelte';
  import { executeQuery } from './lib/services/database';
  import { initDatabase } from './lib/services/database';
  import { getLoaderState } from './lib/services/loader';

  interface TabData {
    id: number;
    query: string;
    results: any[];
    columns: string[];
    queryExecuted: boolean;
    error: string | null;
    affectedRows?: number;
    isModificationQuery: boolean;
  }

  let nextTabId = 1;
  let activeTab = -1;
  let tabs: TabData[] = [];
  let isResizing = false;
  let startY: number;
  let editorHeight = '60%';
  let isLoading = true;
  let loadingError: string | null = null;
  let loadingProgress: string | null = null;

  onMount(async () => {
    try {
      const checkProgress = () => {
        const state = getLoaderState();
        if (state.sqlJsLoaded) {
          loadingProgress = 'Initializing database...';
        }
        if (state.error) {
          loadingError = state.error;
          isLoading = false;
          return;
        }
      };

      // Start progress checking
      const progressInterval = setInterval(checkProgress, 100);

      // Initialize the database
      await initDatabase();
      
      // Cleanup and finish
      clearInterval(progressInterval);
      isLoading = false;
    } catch (error) {
      loadingError = (error as Error).message;
      isLoading = false;
    }
  });

  function addTab(query: string = '') {
    tabs = [...tabs, { 
      id: nextTabId++,
      query,
      results: [],
      columns: [],
      queryExecuted: false,
      error: null,
      isModificationQuery: false
    }];
    activeTab = tabs.length - 1;
  }

  function closeTab(index: number) {
    tabs = tabs.filter((_, i) => i !== index);
    if (activeTab >= tabs.length) {
      activeTab = Math.max(-1, tabs.length - 1);
    }
  }

  function switchTab(index: number) {
    activeTab = index;
  }

  function updateQuery(newQuery: string) {
    if (activeTab >= 0) {
      tabs[activeTab].query = newQuery;
      tabs = [...tabs];
    }
  }

  function runQuery() {
    if (activeTab >= 0) {
      const { results, columns, error, isModificationQuery, affectedRows } = executeQuery(tabs[activeTab].query);
      
      tabs[activeTab] = {
        ...tabs[activeTab],
        results,
        columns,
        queryExecuted: true,
        error,
        affectedRows,
        isModificationQuery
      };
      tabs = [...tabs];
    }
  }

  function handleShowTableData(event: CustomEvent<{ tableName: string }>) {
    const query = `SELECT * FROM ${event.detail.tableName}`;
    addTab(query);
    runQuery();
  }

  function getStatusMessage(tab: TabData): string {
    if (!tab.queryExecuted) {
      return 'Write your SQL query and click Run';
    }
    if (tab.error) {
      return 'Error in SQL statement';
    }
    if (tab.isModificationQuery) {
      return `${tab.affectedRows} row${tab.affectedRows === 1 ? '' : 's'} affected`;
    }
    return `Showing [${tab.results.length}] rows`;
  }

  function startResize(event: MouseEvent) {
    isResizing = true;
    startY = event.clientY;
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isResizing) return;
    
    const container = document.querySelector('.tab-content') as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const percentage = ((event.clientY - containerRect.top) / containerRect.height) * 100;
    editorHeight = Math.max(20, Math.min(80, percentage)) + '%';
  }

  function stopResize() {
    isResizing = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
</script>

{#if isLoading}
  <div class="loading-container">
    <LoadingSpinner 
      message="Loading application..." 
      progress={loadingProgress} 
    />
  </div>
{:else if loadingError}
  <div class="error-container">
    <h2>Failed to initialize database</h2>
    <p>{loadingError}</p>
  </div>
{:else}
  <div class="app">
    <Sidebar on:showTableData={handleShowTableData} />
    
    <div class="main">
      <div class="tabs">
        <div class="tabs-container">
          {#each tabs as tab, i}
            <QueryTab
              query={tab.query}
              index={i}
              active={i === activeTab}
              onClose={() => closeTab(i)}
              onClick={() => switchTab(i)}
            />
          {/each}
          <button class="add-tab" on:click={() => addTab()}>
            <i class="fas fa-plus"></i>
            <span class="tooltip">New Query</span>
          </button>
        </div>
      </div>

      {#if activeTab >= 0}
        <div class="tab-content">
          <div class="editor-section" style="height: {editorHeight}">
            <QueryEditor
              query={tabs[activeTab].query}
              onQueryChange={updateQuery}
              onRun={runQuery}
              queryExecuted={tabs[activeTab].queryExecuted}
            />
          </div>

          <div 
            class="resize-handle"
            on:mousedown={startResize}
            class:resizing={isResizing}
          ></div>
          
          <div class="results-section">
            <ResultsTable
              results={tabs[activeTab].results}
              columns={tabs[activeTab].columns}
              queryExecuted={tabs[activeTab].queryExecuted}
              error={tabs[activeTab].error}
              affectedRows={tabs[activeTab].affectedRows}
              isModificationQuery={tabs[activeTab].isModificationQuery}
            />
          </div>

          <div class="status-bar">
            <span>Ready</span>
            <span class="status-message">{getStatusMessage(tabs[activeTab])}</span>
          </div>
        </div>
      {:else}
        <div class="empty-state">
          <button class="empty-state-button" on:click={() => addTab()}>
            <div class="plus-hint">
              <i class="fas fa-plus"></i>
            </div>
            <span>Click to create a new query tab</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .app {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--vscode-background);
  }

  .loading-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .error-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #f48771;
  }

  .error-container h2 {
    margin-bottom: 1rem;
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .tabs {
    border-bottom: 1px solid var(--vscode-border);
    min-height: 35px;
    background: var(--vscode-tab-inactive-background);
  }

  .tabs-container {
    display: flex;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(121, 121, 121, 0.4) transparent;
  }

  .tabs-container::-webkit-scrollbar {
    height: 6px;
  }

  .tabs-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .tabs-container::-webkit-scrollbar-thumb {
    background-color: rgba(121, 121, 121, 0.4);
    border-radius: 3px;
  }

  .tab-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    min-width: 0;
    padding: 0.5rem;
  }

  .editor-section {
    display: flex;
    flex-direction: column;
    min-height: 20%;
    max-height: 80%;
  }

  .results-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .resize-handle {
    height: 4px;
    background: transparent;
    cursor: row-resize;
    transition: background-color 0.2s;
    position: relative;
    margin: 0.25rem 0;
  }

  .resize-handle:hover,
  .resize-handle.resizing {
    background: var(--vscode-button-background);
  }

  .add-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    color: #969696;
    border: none;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
  }

  .add-tab:hover {
    background: #424242;
    color: var(--vscode-foreground);
  }

  .add-tab i {
    font-size: 0.875rem;
  }

  .add-tab .tooltip {
    position: absolute;
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
    background: #252526;
    color: var(--vscode-foreground);
    padding: 0.25rem 0.5rem;
    border-radius: 2px;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
    z-index: 1000;
    border: 1px solid var(--vscode-border);
  }

  .add-tab:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 150px);
  }

  .empty-state-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid var(--vscode-border);
    color: #808080;
    font-size: 0.875rem;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .empty-state-button:hover {
    background: #424242;
    color: var(--vscode-foreground);
  }

  .empty-state-button:hover .plus-hint {
    background: var(--vscode-button-hover-background);
  }

  .plus-hint {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: var(--vscode-button-background);
    color: white;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .plus-hint i {
    font-size: 0.75rem;
  }

  .status-bar {
    padding: 0 0.75rem;
    background: var(--vscode-statusbar-background);
    color: var(--vscode-statusbar-foreground);
    display: flex;
    justify-content: space-between;
    font-size: 0.8125rem;
    height: 22px;
    align-items: center;
    margin-top: 0.5rem;
  }

  .status-message {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: 1rem;
  }
</style>