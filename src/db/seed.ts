import 'dotenv/config';
import { db } from './index';
import { users } from './schema';
import * as bcrypt from 'bcryptjs';

const seed = async () => {
  console.log('Seeding database...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  try {
    await db.insert(users).values({
      name: 'Super Admin',
      email: 'admin@simma.com',
      password: hashedPassword,
      role: 'ADMIN',
    });
    console.log('Seeded default admin user: admin@simma.com / password123');
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
  
  process.exit(0);
};

seed();
