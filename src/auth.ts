import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        if (user.length === 0) return null;

        const passwordsMatch = await bcrypt.compare(password, user[0].password);

        if (passwordsMatch) {
          return {
            id: user[0].id,
            name: user[0].name,
            email: user[0].email,
            role: user[0].role,
          };
        }

        return null;
      },
    }),
  ],
});
