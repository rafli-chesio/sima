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

import { auth } from "@/auth";

export async function updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  // Allow admin to change any password, and other users to only change their own
  if (session.user.role !== "ADMIN" && session.user.id !== userId) {
    return { success: false, message: "Hanya Admin yang dapat mengubah password pengguna lain." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: "Password minimal harus 6 karakter." };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
      
    revalidatePath("/admin/users");
    return { success: true, message: "Password berhasil diubah!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal mengubah password." };
  }
}

