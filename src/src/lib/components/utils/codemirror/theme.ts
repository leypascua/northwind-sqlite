import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const foreground = '#d2d8d9';
const background = '#1e1e1e';
const selection = '#2a2f3a';
const cursor = '#e4c07a';
const activeLine = '#2a2f3a';
const keyword = '#2BA6FF';
const string = '#f08d49';
const number = '#f08d49';
const comment = '#666666';
const operator = '#d2d8d9';
const punctuation = '#d2d8d9';

const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: keyword },
  { tag: tags.string, color: string },
  { tag: tags.number, color: number },
  { tag: tags.comment, color: comment, fontStyle: 'italic' },
  { tag: tags.operator, color: operator },
  { tag: tags.punctuation, color: punctuation },
  { tag: tags.variableName, color: foreground },
  { tag: tags.propertyName, color: foreground },
  { tag: tags.function(tags.variableName), color: foreground },
]);

export const sqlEditorTheme = [
  EditorView.theme({
    '&': {
      color: foreground,
      backgroundColor: background,
      fontSize: '13px',
      height: '100%'
    },
    '.cm-content': {
      fontFamily: 'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
      padding: '10px 0'
    },
    '.cm-line': {
      padding: '0 10px'
    },
    '.cm-activeLine': {
      backgroundColor: activeLine
    },
    '.cm-selectionBackground': {
      backgroundColor: selection
    },
    '.cm-cursor': {
      borderLeftColor: cursor
    },
    '.cm-gutters': {
      backgroundColor: background,
      color: comment,
      border: 'none',
      borderRight: `1px solid ${comment}`,
      minWidth: '40px'
    },
    '.cm-activeLineGutter': {
      backgroundColor: activeLine
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'inherit'
    },
    '.cm-matchingBracket': {
      backgroundColor: '#3a3f4b',
      outline: 'none'
    },
    '.cm-nonmatchingBracket': {
      color: '#f08d49'
    }
  }, { dark: true }),
  syntaxHighlighting(highlightStyle)
];