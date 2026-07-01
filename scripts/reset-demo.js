const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not set in environment variables');
  process.exit(1);
}

async function run() {
  console.log('Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });

  try {
    await sql.begin(async (tx) => {
      // 1. Delete all transactions
      console.log('Deleting all transactions...');
      await tx`DELETE FROM public.transactions`;

      // 2. Delete all notifications
      console.log('Deleting all notifications...');
      await tx`DELETE FROM public.notifications`;

      // 3. Delete dummy asset history (keep IMPORT logs)
      console.log('Deleting dummy asset history (keeping IMPORT)...');
      await tx`DELETE FROM public.asset_history WHERE action_type != 'IMPORT'`;

      // 4. Delete dummy users
      console.log('Deleting dummy/test users...');
      // We keep admin@simma.com for safety, and we'll insert sarpras@smkn1percut.sch.id
      await tx`
        DELETE FROM public.users 
        WHERE email LIKE '%test%' 
           OR email LIKE '%dummy%' 
           OR email LIKE '%example%' 
           OR name LIKE '%Test%' 
           OR name LIKE '%Dummy%'
      `;

      // 5. Create or update main admin account: sarpras@smkn1percut.sch.id
      console.log('Hashing password for new admin...');
      const defaultPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      console.log('Creating/Updating main admin account...');
      
      // Check if user already exists
      const existingUser = await tx`
        SELECT id FROM public.users WHERE email = 'sarpras@smkn1percut.sch.id'
      `;

      if (existingUser.length > 0) {
        // Update existing user to ADMIN and update password
        await tx`
          UPDATE public.users 
          SET name = 'Sarpras SMKN 1 Percut', 
              password = ${hashedPassword}, 
              role = 'ADMIN',
              updated_at = NOW()
          WHERE email = 'sarpras@smkn1percut.sch.id'
        `;
        console.log('Updated existing account: sarpras@smkn1percut.sch.id');
      } else {
        // Insert new ADMIN user
        await tx`
          INSERT INTO public.users (name, email, password, role)
          VALUES ('Sarpras SMKN 1 Percut', 'sarpras@smkn1percut.sch.id', ${hashedPassword}, 'ADMIN')
        `;
        console.log('Created new main admin account: sarpras@smkn1percut.sch.id');
      }

      console.log('\nDefault credentials for admin:');
      console.log('Email: sarpras@smkn1percut.sch.id');
      console.log(`Password: ${defaultPassword}`);
    });

    console.log('\nDatabase reset and admin setup completed successfully!');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await sql.end();
  }
}

run();
