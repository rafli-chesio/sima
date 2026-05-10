"use server";

import { db } from "@/db";
import { locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createLocation(formData: FormData): Promise<void> {
  const namaLokasi = formData.get("namaLokasi") as string;
  if (!namaLokasi) throw new Error("Nama lokasi is required");

  try {
    await db.insert(locations).values({ namaLokasi });
    revalidatePath("/admin/locations");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create location");
  }
}

export async function deleteLocation(id: string): Promise<void> {
  try {
    await db.update(locations).set({ deletedAt: new Date() }).where(eq(locations.id, id));
    revalidatePath("/admin/locations");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete location");
  }
}
