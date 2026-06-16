const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
require('dotenv').config();

const backupFilePath = path.join(__dirname, '../backup.sql');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not set in environment variables');
  process.exit(1);
}

if (!fs.existsSync(backupFilePath)) {
  console.error(`Error: Backup file not found at ${backupFilePath}`);
  process.exit(1);
}

function unescapePgValue(val) {
  if (val === '\\N') return null;
  return val
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\');
}

function formatSqlValue(val) {
  if (val === null) return 'NULL';
  const escaped = val.replace(/'/g, "''");
  return `'${escaped}'`;
}

async function run() {
  console.log('Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('Reading backup.sql...');
    const content = fs.readFileSync(backupFilePath, 'utf8');
    const lines = content.split(/\r?\n/);

    const tablesData = [];
    let currentTable = null;
    let currentColumns = [];
    let currentRows = [];
    let inCopy = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('COPY ')) {
        // Example: COPY public.assets (id, name, ...) FROM stdin;
        const match = line.match(/^COPY ([\w\.]+) \((.+)\) FROM stdin;/);
        if (match) {
          const tableName = match[1];
          const columns = match[2].split(',').map(c => c.trim());
          currentTable = tableName;
          currentColumns = columns;
          currentRows = [];
          inCopy = true;
          console.log(`Found COPY block for table: ${tableName}`);
        }
      } else if (inCopy) {
        if (line === '\\.') {
          inCopy = false;
          tablesData.push({
            name: currentTable,
            columns: currentColumns,
            rows: currentRows
          });
          console.log(`Finished parsing ${currentRows.length} rows for table ${currentTable}`);
        } else {
          const values = line.split('\t').map(unescapePgValue);
          currentRows.push(values);
        }
      }
    }

    console.log('\nStarting database restoration...');
    await sql.begin(async (tx) => {
      // 1. Truncate tables in cascade to clear any existing / seeded data
      // We list all tables to make sure truncate cascade works correctly
      const tablesToClear = [
        'public.asset_history',
        'public.asset_images',
        'public.notifications',
        'public.transactions',
        'public.user_jurusan',
        'public.assets',
        'public.users',
        'public.locations',
        'public.jurusan'
      ];
      
      console.log(`Truncating tables: ${tablesToClear.join(', ')}`);
      await tx.unsafe(`TRUNCATE TABLE ${tablesToClear.join(', ')} CASCADE`);

      // 2. Define strict dependency order for insertions
      const dependencyOrder = [
        'public.locations',
        'public.jurusan',
        'public.users',
        'public.user_jurusan',
        'public.assets',
        'public.asset_history',
        'public.asset_images',
        'public.notifications',
        'public.transactions'
      ];

      // 3. Insert data for each table in dependency order
      for (const tableName of dependencyOrder) {
        const table = tablesData.find(t => t.name === tableName);
        if (!table) {
          console.log(`Table ${tableName} not found in backup file, skipping.`);
          continue;
        }

        if (table.rows.length === 0) {
          console.log(`No rows to insert for table: ${table.name}`);
          continue;
        }

        console.log(`Restoring table ${table.name} (${table.rows.length} rows)...`);
        
        // Split inserts into chunks of 100 rows to prevent query size limits
        const chunkSize = 100;
        for (let i = 0; i < table.rows.length; i += chunkSize) {
          const chunk = table.rows.slice(i, i + chunkSize);
          const valuesSql = chunk.map(row => {
            const formatted = row.map(formatSqlValue);
            return `(${formatted.join(', ')})`;
          }).join(', ');

          const columnsSql = table.columns.join(', ');
          const query = `INSERT INTO ${table.name} (${columnsSql}) VALUES ${valuesSql}`;
          
          await tx.unsafe(query);
        }
        console.log(`Restored ${table.name} successfully.`);
      }
    });

    console.log('\nDatabase restoration completed successfully!');
  } catch (error) {
    console.error('Error restoring database:', error);
  } finally {
    await sql.end();
  }
}

run();
