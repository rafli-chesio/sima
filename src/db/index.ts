import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

let dbInstance: ReturnType<typeof drizzle<typeof schema>>;

if (process.env.NODE_ENV === 'production') {
  const client = postgres(process.env.DATABASE_URL as string);
  dbInstance = drizzle(client, { schema });
} else {
  if (!global.db) {
    // Limit pool size in development to prevent connection exhaustion
    const client = postgres(process.env.DATABASE_URL as string, { max: 10 });
    global.db = drizzle(client, { schema });
  }
  dbInstance = global.db;
}

export const db = dbInstance;
