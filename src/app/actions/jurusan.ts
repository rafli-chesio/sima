"use server";

import { db } from "@/db";
import { jurusan } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createJurusan(formData: FormData): Promise<void> {
  const namaJurusan = formData.get("namaJurusan") as string;
  if (!namaJurusan) throw new Error("Nama jurusan is required");

  try {
    await db.insert(jurusan).values({ namaJurusan });
    revalidatePath("/admin/jurusan");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create jurusan");
  }
}

export async function deleteJurusan(id: string): Promise<void> {
  try {
    await db.update(jurusan).set({ deletedAt: new Date() }).where(eq(jurusan.id, id));
    revalidatePath("/admin/jurusan");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete jurusan");
  }
}
