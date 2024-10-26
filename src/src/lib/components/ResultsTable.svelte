<script lang="ts">
  export let results: any[] = [];
  export let columns: string[] = [];
  export let queryExecuted: boolean = false;
  export let error: string | null = null;
  export let errorLine: number | null = null;
  export let affectedRows: number | undefined = undefined;
  export let isModificationQuery: boolean = false;

  let columnWidths: { [key: string]: number } = {};
  let isResizing = false;
  let resizingColumn: string | null = null;
  let startX: number;
  let startWidth: number;
  let hasCalculatedInitialWidths = false;

  const MIN_COLUMN_WIDTH = 100;
  const MAX_COLUMN_WIDTH = 800;
  const PADDING = 32;
  const CHAR_WIDTH = 8;

  const TYPE_WEIGHTS = {
    number: 0.7,
    date: 1.2,
    string: 1.5
  };

  function getValueType(value: any): keyof typeof TYPE_WEIGHTS {
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    return 'string';
  }

  function calculateColumnWidths() {
    if (!columns.length || !results.length || hasCalculatedInitialWidths) return;

    const tableWrapper = document.querySelector('.table-wrapper');
    if (!tableWrapper) return;
    const availableWidth = Math.max(800, tableWrapper.clientWidth - PADDING);

    const columnStats = columns.reduce((stats, column) => {
      const values = results.map(row => row[column]);
      const lengths = values.map(v => (v?.toString() || '').length);
      const maxLength = Math.max(column.length, ...lengths);
      const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
      const type = getValueType(values[0]);

      stats[column] = {
        maxLength,
        avgLength,
        type,
        weight: TYPE_WEIGHTS[type]
      };

      return stats;
    }, {} as Record<string, { maxLength: number; avgLength: number; type: keyof typeof TYPE_WEIGHTS; weight: number }>);

    const totalWeightedLength = Object.values(columnStats).reduce(
      (sum, stats) => sum + (stats.avgLength * stats.weight), 0
    );

    columns.forEach(column => {
      if (columnWidths[column]) return;

      const stats = columnStats[column];
      const proportion = (stats.avgLength * stats.weight) / totalWeightedLength;
      
      let width = Math.floor(availableWidth * proportion);
      
      if (stats.type === 'number') {
        width = Math.min(width, stats.maxLength * CHAR_WIDTH + PADDING);
      } else if (stats.maxLength > stats.avgLength * 2) {
        width = Math.max(width, stats.avgLength * CHAR_WIDTH * 1.5);
      }

      columnWidths[column] = Math.max(
        MIN_COLUMN_WIDTH,
        Math.min(MAX_COLUMN_WIDTH, width)
      );
    });

    columnWidths = { ...columnWidths };
    hasCalculatedInitialWidths = true;
  }

  function startResize(event: MouseEvent, column: string) {
    isResizing = true;
    resizingColumn = column;
    startX = event.pageX;
    startWidth = columnWidths[column] || MIN_COLUMN_WIDTH;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isResizing || !resizingColumn) return;

    const diff = event.pageX - startX;
    const newWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, startWidth + diff));
    columnWidths[resizingColumn] = newWidth;
    columnWidths = { ...columnWidths };
  }

  function stopResize() {
    isResizing = false;
    resizingColumn = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  $: if (queryExecuted && !error && !isModificationQuery && results.length > 0) {
    hasCalculatedInitialWidths = false;
    setTimeout(calculateColumnWidths, 0);
  }
</script>

<div class="results-container" class:visible={queryExecuted}>
  {#if queryExecuted}
    {#if error}
      <div class="error-message">
        <div class="error-header">
          <span class="error-icon">⚠️</span>
          <span>SQL Error{#if errorLine} on line {errorLine}{/if}</span>
        </div>
        <pre class="error-details">{error}</pre>
      </div>
    {:else if isModificationQuery}
      <div class="modification-message">
        <i class="fas fa-check-circle success-icon"></i>
        Query executed successfully
      </div>
    {:else}
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              {#each columns as column}
                <th style="width: {columnWidths[column] || MIN_COLUMN_WIDTH}px">
                  <div class="th-content">
                    <span class="th-text">{column}</span>
                    <div 
                      class="resize-handle"
                      on:mousedown|preventDefault={(e) => startResize(e, column)}
                      class:resizing={resizingColumn === column}
                    ></div>
                  </div>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each results as row}
              <tr>
                {#each columns as column}
                  <td style="width: {columnWidths[column] || MIN_COLUMN_WIDTH}px">
                    {row[column]}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>

<style>
  .results-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    opacity: 0;
    visibility: hidden;
    margin-top: 0.5rem;
    overflow: hidden;
    min-width: 0;
  }

  .results-container.visible {
    opacity: 1;
    visibility: visible;
  }

  .table-wrapper {
    flex: 1;
    overflow: auto;
    position: relative;
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-border);
    border-radius: 2px;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 800px;
    table-layout: fixed;
    font-size: 0.8125rem;
  }

  thead {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--vscode-editor-background);
  }

  th {
    background: #2d2d2d;
    font-weight: 400;
    border: 1px solid var(--vscode-border);
    padding: 0;
    text-align: left;
    white-space: nowrap;
    box-shadow: 0 1px 0 0 var(--vscode-border);
    position: relative;
  }

  .th-content {
    display: flex;
    align-items: center;
    padding: 0.35rem 0.5rem;
    position: relative;
    height: 100%;
  }

  .th-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .resize-handle {
    position: absolute;
    right: -3px;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    background: transparent;
  }

  .resize-handle:hover,
  .resize-handle.resizing {
    background: var(--vscode-button-background);
  }

  td {
    padding: 0.25rem 0.5rem;
    text-align: left;
    border: 1px solid var(--vscode-border);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  tr:nth-child(even) {
    background: #1e1e1e;
  }

  tr:nth-child(odd) {
    background: #252526;
  }

  .error-message {
    padding: 1rem;
    background: #5a1d1d;
    color: #f48771;
    flex: 1;
    overflow: auto;
  }

  .modification-message {
    padding: 2rem;
    text-align: center;
    color: #89d185;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex: 1;
  }

  .success-icon {
    font-size: 1.25rem;
    color: #89d185;
  }

  .error-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 400;
    margin-bottom: 0.5rem;
  }

  .error-details {
    font-family: 'Consolas', 'Monaco', monospace;
    white-space: pre-wrap;
    background: #1e1e1e;
    padding: 1rem;
    border-radius: 2px;
    border: 1px solid #5a1d1d;
    margin: 0;
  }
</style>