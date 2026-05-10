"use server";

import { db } from "@/db";
import { users, userJurusan } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const jurusanIds = formData.getAll("jurusanIds") as string[];

  if (!name || !email || !password || !role) {
    throw new Error("Semua kolom wajib diisi");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
    }).returning({ id: users.id });

    if (role === "KAJUR" && jurusanIds.length > 0) {
      const userJurusanData = jurusanIds.map((jId) => ({
        userId: newUser.id,
        jurusanId: jId,
      }));
      await db.insert(userJurusan).values(userJurusanData);
    }

    revalidatePath("/admin/users");
  } catch (error) {
    console.error(error);
    throw new Error("Gagal membuat pengguna");
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id));
    
    revalidatePath("/admin/users");
  } catch (error) {
    console.error(error);
    throw new Error("Gagal menghapus pengguna");
  }
}
