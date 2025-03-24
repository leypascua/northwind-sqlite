import initSqlJs, { Database } from 'sql.js';

interface LoaderState {
  sqlJsLoaded: boolean;
  databaseInitialized: boolean;
  error: string | null;
}

const state: LoaderState = {
  sqlJsLoaded: false,
  databaseInitialized: false,
  error: null,
};

let db: Database | null = null;

export async function createSqliteDb(): Promise<Database> {
  try {
    // Load SQL.js
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });

    // signal that SQL.js is loaded
    state.sqlJsLoaded = true;

    // Create database instance
    db = new SQL.Database();
    state.databaseInitialized = true;
    return db;
  } catch (error) {
    throw error;
  }
}

export function getLoaderState(): LoaderState {
  return { ...state };
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
