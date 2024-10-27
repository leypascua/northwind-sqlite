<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { sql } from '@codemirror/lang-sql';
  import { sqlEditorTheme } from './utils/codemirror/theme';
  import { keymap } from '@codemirror/view';
  import { indentWithTab } from '@codemirror/commands';
  import { autocompletion } from '@codemirror/autocomplete';

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

  // SQL Keywords for autocompletion
  const sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
    'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',   
    'AND', 'OR', 'NOT', 'NULL', 'IS NULL', 'IS NOT NULL',
    'ASC', 'DESC', 'DISTINCT', 'BETWEEN', 'IN', 'LIKE',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
    'LIMIT', 'OFFSET', 'TOP'
  ];

  const sqlCompletions = sqlKeywords.map(keyword => ({
    label: keyword,
    type: 'keyword'
  }));

  onMount(() => {
    editor = new EditorView({
      doc: props.query,
      extensions: [
        basicSetup,
        sql(),
        sqlEditorTheme,
        keymap.of([indentWithTab]),
        autocompletion({
          override: [
            (context) => {
              let word = context.matchBefore(/\w*/);
              if (!word) return null;
              
              return {
                from: word.from,
                options: sqlCompletions.filter(completion =>
                  completion.label.toLowerCase().startsWith(word?.text.toLowerCase() || '')
                )
              };
            }
          ]
        }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            if (newValue !== props.query) {
              props.onQueryChange(newValue);
            }
          }
        })
      ],
      parent: editorContainer
    });

    // Handle Ctrl+Enter or Cmd+Enter to run query
    editor.dom.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        props.onRun();
      }
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
    <div class="shortcut-hint">Execute the query by pressing [Run]</div>
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
  }

  .toolbar {
    padding: 0.5rem;
    border-bottom: 1px solid var(--vscode-border);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
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

  .shortcut-hint {
    color: #808080;
    font-size: 0.75rem;
  }

  .editor {
    flex: 1;
    height: 100%;
    min-height: 0;
  }
</style>