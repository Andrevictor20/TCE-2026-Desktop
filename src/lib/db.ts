import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:study.db');
  }
  return db;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  bindValues?: unknown[]
): Promise<T[]> {
  const database = await getDb();
  return database.select<T[]>(sql, bindValues);
}

export async function execute(
  sql: string,
  bindValues?: unknown[]
): Promise<{ rowsAffected: number; lastInsertId?: number }> {
  const database = await getDb();
  return database.execute(sql, bindValues);
}
