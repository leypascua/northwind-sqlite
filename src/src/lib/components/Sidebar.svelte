<script lang="ts">
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import { initDatabase, getDatabaseSchema } from '../services/database';
  import type { DatabaseSchema, Table } from '../services/database';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let width = 300;
  let isResizing = false;
  let startX: number;
  let startWidth: number;
  let schema: DatabaseSchema | null = null;
  let expandedTables = new Set<string>();
  let isCollapsed = false;
  let contextMenu = {
    visible: false,
    x: 0,
    y: 0,
    tableName: ''
  };
  let tooltip = {
    visible: false,
    x: 0,
    y: 0,
    content: '',
    timer: null as any
  };

  async function init() {
    try {
      await initDatabase();
      schema = getDatabaseSchema();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  init();

  function toggleSidebar() {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      width = 50;
    } else {
      width = 300;
    }
  }

  function toggleTable(tableName: string) {
    if (expandedTables.has(tableName)) {
      expandedTables.delete(tableName);
    } else {
      expandedTables.add(tableName);
    }
    expandedTables = new Set(expandedTables);
  }

  function getColumnMetadata(column: { type: string; notnull: number; fk?: { table: string; column: string } }) {
    const constraints = [];
    if (column.notnull) constraints.push('NOT NULL');
    
    let tooltip = `Type: ${column.type}`;
    if (constraints.length) {
      tooltip += `\nConstraints: ${constraints.join(', ')}`;
    }
    if (column.fk) {
      tooltip += `\nForeign Key: References ${column.fk.table}(${column.fk.column})`;
    }
    return tooltip;
  }

  function getColumnTypeDisplay(column: { type: string }) {
    return `(${column.type})`;
  }

  function handleContextMenu(event: MouseEvent, tableName: string) {
    event.preventDefault();
    contextMenu = {
      visible: true,
      x: event.pageX,
      y: event.pageY,
      tableName
    };
  }

  function hideContextMenu() {
    contextMenu.visible = false;
  }

  function showTableData() {
    dispatch('showTableData', { tableName: contextMenu.tableName });
    hideContextMenu();
  }

  function handleGlobalClick(event: MouseEvent) {
    if (contextMenu.visible && !(event.target as HTMLElement).closest('.context-menu')) {
      hideContextMenu();
    }
  }

  function showTooltip(event: MouseEvent, column: any) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    tooltip.timer = setTimeout(() => {
      tooltip = {
        ...tooltip,
        visible: true,
        x: rect.right + 10,
        y: rect.top,
        content: getColumnMetadata(column)
      };
    }, 1000);
  }

  function hideTooltip() {
    if (tooltip.timer) {
      clearTimeout(tooltip.timer);
    }
    tooltip.visible = false;
  }

  function startResize(event: MouseEvent) {
    if (isCollapsed) return;
    
    isResizing = true;
    startX = event.pageX;
    startWidth = width;
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isResizing) return;
    const diff = event.pageX - startX;
    width = Math.max(200, Math.min(600, startWidth + diff));
  }

  function stopResize() {
    isResizing = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
</script>

<svelte:window on:click={handleGlobalClick} />

<div class="sidebar" style="width: {width}px" class:collapsed={isCollapsed}>
  <div class="title" class:collapsed={isCollapsed}>
    {#if isCollapsed}
      <button 
        class="toggle-btn collapsed"
        on:click={toggleSidebar}
        title="Expand sidebar"
      >
        <i class="fas fa-database"></i>
      </button>
    {:else}
      <i class="fas fa-database database-icon"></i>
      <span class="title-text">Northwind</span>
      <button 
        class="toggle-btn"
        on:click={toggleSidebar}
        title="Collapse sidebar"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
    {/if}
  </div>

  <div class="content" class:collapsed={isCollapsed}>
    {#if schema && !isCollapsed}
      <div class="tree-view">
        {#each schema.tables as table}
          <div class="tree-item">
            <button 
              class="tree-node"
              on:click={() => toggleTable(table.name)}
              on:contextmenu|preventDefault={(e) => handleContextMenu(e, table.name)}
            >
              <i class="fas fa-chevron-{expandedTables.has(table.name) ? 'down' : 'right'} chevron"></i>
              <i class="fas fa-table icon table-icon"></i>
              <span class="label">{table.name}</span>
              <span class="count">{table.columns.length}</span>
            </button>

            {#if expandedTables.has(table.name)}
              <div class="tree-children">
                {#each table.columns as column}
                  <div 
                    class="tree-node column"
                    on:mouseenter={(e) => showTooltip(e, column)}
                    on:mouseleave={hideTooltip}
                  >
                    {#if column.pk}
                      <i class="fas fa-key icon key-icon"></i>
                    {:else if column.fk}
                      <i class="fas fa-key icon fk-icon"></i>
                    {:else}
                      <i class="fas fa-columns icon column-icon"></i>
                    {/if}
                    <span class="label" class:required={column.notnull}>
                      {column.name}
                      <span class="metadata">{getColumnTypeDisplay(column)}</span>
                    </span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div 
    class="resize-handle"
    on:mousedown={startResize}
    class:resizing={isResizing}
    class:hidden={isCollapsed}
  ></div>
</div>

{#if contextMenu.visible}
  <div 
    class="context-menu"
    style="left: {contextMenu.x}px; top: {contextMenu.y}px"
  >
    <button class="menu-item" on:click={showTableData}>
      <i class="fas fa-table"></i>
      Show Data
    </button>
  </div>
{/if}

{#if tooltip.visible}
  <div 
    class="tooltip"
    style="left: {tooltip.x}px; top: {tooltip.y}px"
  >
    {#each tooltip.content.split('\n') as line}
      <div class="tooltip-line">{line}</div>
    {/each}
  </div>
{/if}

<style>
  .sidebar {
    background: var(--vscode-sidebar-background);
    height: 100vh;
    min-width: 50px;
    max-width: 600px;
    overflow: hidden;
    position: relative;
    border-right: 1px solid var(--vscode-border);
    display: flex;
    flex-direction: column;
    transition: width 0.2s ease-in-out;
  }

  .sidebar.collapsed {
    width: 50px !important;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    padding: 0.75rem;
    color: var(--vscode-foreground);
    font-weight: 400;
    text-transform: uppercase;
    background: var(--vscode-sidebar-background);
    height: 35px;
    position: relative;
  }

  .title.collapsed {
    padding: 0.5rem;
    justify-content: center;
  }

  .database-icon {
    flex-shrink: 0;
  }

  .title-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .toggle-btn {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
    width: 24px;
    height: 24px;
  }

  .toggle-btn:hover {
    background: #424242;
    color: var(--vscode-foreground);
  }

  .toggle-btn.collapsed {
    width: 100%;
    height: 100%;
    color: #969696;
  }

  .content {
    padding: 0.25rem;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .content.collapsed {
    visibility: hidden;
  }

  .tree-view {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .tree-item {
    display: flex;
    flex-direction: column;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    border: none;
    background: transparent;
    color: var(--vscode-foreground);
    font-size: 0.8125rem;
    cursor: pointer;
    border-radius: 0;
    transition: background-color 150ms;
    width: 100%;
    text-align: left;
    height: 22px;
  }

  button.tree-node:hover {
    background: #37373d;
  }

  .tree-children {
    margin-left: 1rem;
    border-left: 1px solid var(--vscode-border);
    margin-top: 0.125rem;
  }

  .chevron {
    width: 16px;
    height: 16px;
    color: var(--vscode-foreground);
    opacity: 0.7;
    font-size: 0.75rem;
  }

  .icon {
    width: 16px;
    min-width: 16px;
    text-align: center;
    font-size: 0.875rem;
  }

  .table-icon {
    color: #c586c0;
  }

  .key-icon {
    color: #dcdcaa;
  }

  .fk-icon {
    color: #808080;
  }

  .column-icon {
    color: #9cdcfe;
  }

  .label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .metadata {
    color: #808080;
    font-size: 0.75rem;
  }

  .count {
    background: #37373d;
    color: var(--vscode-foreground);
    padding: 0 0.375rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .column {
    color: #808080;
    cursor: default;
  }

  .required {
    color: var(--vscode-foreground);
  }

  .loading {
    color: #808080;
    font-size: 0.8125rem;
    padding: 0.5rem;
    text-align: center;
  }

  .resize-handle {
    position: absolute;
    top: 0;
    right: -3px;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    background: transparent;
  }

  .resize-handle:hover,
  .resize-handle.resizing {
    background: var(--vscode-button-background);
  }

  .resize-handle.hidden {
    display: none;
  }

  .context-menu {
    position: fixed;
    background: #252526;
    border: 1px solid var(--vscode-border);
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 160px;
    padding: 0.25rem;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    color: var(--vscode-foreground);
    border-radius: 0;
    font-size: 0.8125rem;
  }

  .menu-item:hover {
    background: #37373d;
  }

  .menu-item i {
    color: #808080;
    font-size: 0.875rem;
    width: 16px;
    text-align: center;
  }

  .tooltip {
    position: fixed;
    background: #252526;
    border: 1px solid var(--vscode-border);
    border-radius: 2px;
    padding: 0.5rem;
    font-size: 0.8125rem;
    color: var(--vscode-foreground);
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    max-width: 300px;
  }

  .tooltip-line {
    white-space: nowrap;
    line-height: 1.4;
  }

  .tooltip-line + .tooltip-line {
    margin-top: 0.25rem;
  }
</style>