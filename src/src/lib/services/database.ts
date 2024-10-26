import type { Database } from 'sql.js';
import { initializeApp, getDatabase } from './loader';

export interface Column {
  name: string;
  type: string;
  notnull: number;
  pk: number;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface DatabaseSchema {
  name: string;
  tables: Table[];
}

export async function initDatabase(): Promise<void> {
  try {
    await initializeApp();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export function getDatabaseSchema(): DatabaseSchema {
  const db = getDatabase();
  const tables = db.exec(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `)[0].values.map(row => row[0] as string);

  return {
    name: 'Northwind',
    tables: tables.map(tableName => {
      const tableInfo = db.exec(`PRAGMA table_info([${tableName}])`)[0];
      const columns = tableInfo.values.map((row, index) => ({
        name: row[1] as string,
        type: row[2] as string,
        notnull: row[3] as number,
        pk: row[5] as number
      }));

      return {
        name: tableName,
        columns
      };
    })
  };
}

function findErrorLine(sql: string, errorMessage: string): number | null {
  // Common SQLite error patterns
  const patterns = [
    /near "([^"]+)": syntax error/,
    /no such table: ([^\s]+)/,
    /no such column: ([^\s]+)/
  ];

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      const errorToken = match[1];
      const lines = sql.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(errorToken)) {
          return i + 1;
        }
      }
    }
  }

  return null;
}

export function executeQuery(sql: string): { 
  results: any[]; 
  columns: string[]; 
  error: string | null;
  errorLine?: number | null;
  isModificationQuery: boolean;
  affectedRows?: number;
} {
  try {
    const db = getDatabase();
    const isSelect = sql.trim().toLowerCase().startsWith('select');
    
    if (isSelect) {
      const result = db.exec(sql)[0];
      
      if (!result) {
        return {
          results: [],
          columns: [],
          error: null,
          isModificationQuery: false
        };
      }

      const rows = result.values.map(row => {
        const obj: any = {};
        result.columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });

      return {
        results: rows,
        columns: result.columns,
        error: null,
        isModificationQuery: false
      };
    } else {
      // For INSERT, UPDATE, DELETE queries
      db.run(sql);
      return {
        results: [],
        columns: [],
        error: null,
        isModificationQuery: true,
        affectedRows: db.getRowsModified()
      };
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    const errorLine = findErrorLine(sql, errorMessage);
    return {
      results: [],
      columns: [],
      error: errorMessage,
      errorLine,
      isModificationQuery: false
    };
  }
}