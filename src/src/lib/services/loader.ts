import initSqlJs, { Database } from 'sql.js';

interface LoaderState {
  sqlJsLoaded: boolean;
  databaseInitialized: boolean;
  error: string | null;
}

const state: LoaderState = {
  sqlJsLoaded: false,
  databaseInitialized: false,
  error: null
};

let db: Database | null = null;

export async function initializeApp(): Promise<Database> {
  try {
    // Load SQL.js
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    state.sqlJsLoaded = true;

    // Create database instance
    db = new SQL.Database();

    try {
      // Load schema SQL
      const schemaResponse = await fetch('/northwind.schema.sql');
      if (!schemaResponse.ok) {
        throw new Error(`Failed to load schema: ${schemaResponse.statusText}`);
      }
      const schemaSql = await schemaResponse.text();

      // Execute schema statements
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        db.run(statement + ';');
      }

      state.databaseInitialized = true;
      return db;
    } catch (error) {
      state.error = `Schema initialization failed: ${(error as Error).message}`;
      throw error;
    }
  } catch (error) {
    state.error = `SQL.js initialization failed: ${(error as Error).message}`;
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