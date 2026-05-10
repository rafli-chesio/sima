import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;

const runMigrate = async () => {
  console.log('Running migrations...');
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);
  
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migration completed');
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    await migrationClient.end();
  }
};

runMigrate();
