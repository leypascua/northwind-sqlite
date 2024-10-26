<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { sql } from '@codemirror/lang-sql';
  import { autocompletion } from '@codemirror/autocomplete';
  import { getDatabaseSchema } from '../services/database';

  const props = $props<{
    query: string;
    onRun: () => void;
    onQueryChange: (newQuery: string) => void;
    queryExecuted: boolean;
    error?: string | null;
    errorLine?: number | null;
  }>();

  let editorContainer: HTMLDivElement;
  let editor: EditorView;

  const sqlCompletions = (context: any) => {
    let word = context.matchBefore(/\w*/);
    if (!word) return null;

    let suggestions: any[] = [];

    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'UPDATE', 'DELETE',
      'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'GROUP BY', 'ORDER BY',
      'HAVING', 'LIMIT', 'OFFSET', 'AS', 'ON', 'IN', 'BETWEEN', 'LIKE'
    ];

    suggestions.push(...keywords.map(keyword => ({
      label: keyword,
      type: 'keyword',
      info: 'SQL Keyword'
    })));

    const schema = getDatabaseSchema();
    schema.tables.forEach(table => {
      suggestions.push({
        label: table.name,
        type: 'class',
        info: 'Table'
      });

      table.columns.forEach(column => {
        suggestions.push({
          label: column.name,
          type: 'property',
          info: `${table.name}.${column.name} (${column.type})`
        });
      });
    });

    return {
      from: word.from,
      options: suggestions
    };
  };

  onMount(() => {
    editor = new EditorView({
      doc: props.query,
      extensions: [
        basicSetup,
        sql(),
        autocompletion({ override: [sqlCompletions] }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            if (newValue !== props.query) {
              props.onQueryChange(newValue);
            }
          }
        }),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-gutters': { 
            backgroundColor: '#1e1e1e',
            color: '#858585',
            border: 'none'
          },
          '.cm-lineNumbers': {
            color: '#858585'
          },
          '.cm-lineNumbers .cm-activeLineNumber': {
            backgroundColor: '#1e1e1e',
            color: '#c6c6c6'
          },
          '.cm-content': {
            color: '#d4d4d4',
            padding: '0'
          },
          '.cm-line': {
            padding: '0 4px'
          },
          '.cm-keyword': { color: '#0078d4' },
          '.cm-operator': { color: '#d4d4d4' },
          '.cm-number': { color: '#b5cea8' },
          '.cm-string': { color: '#ce9178' },
          '.cm-comment': { color: '#6a9955' },
          '.cm-function': { color: '#dcdcaa' },
          '.cm-variable': { color: '#9cdcfe' },
          '.cm-punctuation': { color: '#d4d4d4' },
          '.cm-cursor': { 
            borderLeftColor: '#fff',
            borderLeftWidth: '2px'
          },
          '.cm-activeLine': { 
            backgroundColor: '#282828'
          },
          '.cm-selectionBackground': {
            backgroundColor: '#264f78'
          },
          '&.cm-focused .cm-selectionBackground': {
            backgroundColor: '#264f78'
          },
          // SQL specific tokens
          '.cm-atom': { color: '#0078d4' },
          '.cm-builtin': { color: '#dcdcaa' },
          '.cm-tableName': { color: '#4ec9b0' },
          '.cm-columnName': { color: '#9cdcfe' },
          '.cm-operator.cm-compareOperator': { color: '#d4d4d4' },
          '.cm-operator.cm-logicOperator': { color: '#0078d4' },
          '.cm-star': { color: '#d4d4d4' },
          // Completion tooltip styles
          '.cm-tooltip': {
            backgroundColor: '#252526',
            border: '1px solid #454545',
            borderRadius: '3px'
          },
          '.cm-tooltip.cm-tooltip-autocomplete': {
            '& > ul': {
              maxHeight: '300px',
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontSize: '13px'
            },
            '& > ul > li': {
              padding: '4px 8px'
            },
            '& > ul > li[aria-selected]': {
              backgroundColor: '#04395e',
              color: '#ffffff'
            }
          },
          '.cm-completionLabel': {
            color: '#d4d4d4'
          },
          '.cm-completionDetail': {
            color: '#9cdcfe',
            marginLeft: '8px',
            fontSize: '12px'
          },
          '.cm-completionMatchedText': {
            textDecoration: 'none',
            color: '#18a3ff'
          },
          '.cm-completionIcon': {
            marginRight: '8px',
            '&[class*="keyword"]': { color: '#0078d4' },
            '&[class*="class"]': { color: '#4ec9b0' },
            '&[class*="property"]': { color: '#9cdcfe' },
            '&[class*="method"]': { color: '#dcdcaa' },
            '&[class*="function"]': { color: '#dcdcaa' }
          }
        })
      ],
      parent: editorContainer
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  $effect(() => {
    if (editor && editor.state.doc.toString() !== props.query) {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: props.query }
      });
    }
  });
</script>

<div class="editor-container">
  <div class="toolbar">
    <button class="run-btn" on:click={props.onRun}>
      <i class="fas fa-play"></i>
      Run
    </button>
  </div>
  
  <div class="editor" bind:this={editorContainer}></div>
</div>

<style>
  .editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--vscode-border);
    border-radius: 2px;
    overflow: hidden;
    min-height: 0;
    background: var(--vscode-editor-background);
  }

  .toolbar {
    padding: 0.5rem;
    border-bottom: 1px solid var(--vscode-border);
    background: var(--vscode-editor-background);
    flex-shrink: 0;
  }

  .run-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    padding: 0.25rem 0.75rem;
    background: var(--vscode-button-background);
    border: none;
    color: white;
  }

  .run-btn:hover {
    background: var(--vscode-button-hover-background);
  }

  .run-btn i {
    font-size: 0.75rem;
  }

  .editor {
    flex: 1;
    height: 100%;
    min-height: 0;
  }

  :global(.cm-editor) {
    height: 100%;
    background: var(--vscode-editor-background) !important;
  }

  :global(.cm-editor .cm-scroller) {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
  }

  :global(.cm-editor.error-line) {
    background-color: #5a1d1d;
  }
</style>