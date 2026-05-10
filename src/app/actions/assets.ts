"use server";

import { db } from "@/db";
import { assets, assetHistory, assetImages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function createAsset(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const namaBarang = formData.get("namaBarang") as string;
  let kodeUnik = formData.get("kodeUnik") as string;
  const assetType = formData.get("assetType") as "FIXED" | "CONSUMABLE";
  const merk = formData.get("merk") as string;
  const tahunPengadaan = parseInt(formData.get("tahunPengadaan") as string) || null;
  const kondisi = formData.get("kondisi") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 1;
  const jurusanId = formData.get("jurusanId") as string || null;
  const locationId = formData.get("locationId") as string || null;
  const image = formData.get("image") as File | null;

  // Auto-generate kodeUnik for CONSUMABLE if not provided
  if (assetType === "CONSUMABLE" && !kodeUnik) {
    kodeUnik = `BHP-${Date.now().toString().slice(-6)}`;
  }

  if (!namaBarang || !kodeUnik || !assetType) {
    throw new Error("Nama, Kode Unik, dan Tipe Aset wajib diisi");
  }

  try {
    const [newAsset] = await db.insert(assets).values({
      namaBarang,
      kodeUnik,
      assetType,
      merk,
      tahunPengadaan,
      kondisi,
      quantity: assetType === "FIXED" ? 1 : quantity,
      jurusanId,
      locationId,
    }).returning({ id: assets.id });

    // Handle Image Upload
    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const filename = `${Date.now()}-${image.name.replace(/\s/g, "_")}`;
      const filepath = path.join(process.cwd(), "public", "uploads", filename);
      await writeFile(filepath, buffer);

      await db.insert(assetImages).values({
        assetId: newAsset.id,
        urlFile: `/uploads/${filename}`,
        tipeFile: "AWAL",
      });
    }

    // Insert to history
    await db.insert(assetHistory).values({
      assetId: newAsset.id,
      performedBy: session.user.id,
      actionType: "CREATE",
      notes: "Aset baru ditambahkan ke sistem",
    });

    revalidatePath("/admin/assets");
  } catch (error) {
    console.error(error);
    throw new Error("Gagal menambahkan aset (kode unik mungkin sudah ada)");
  }
}

export async function deleteAsset(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await db.update(assets).set({ deletedAt: new Date() }).where(eq(assets.id, id));

    await db.insert(assetHistory).values({
      assetId: id,
      performedBy: session.user.id,
      actionType: "SOFT_DELETE",
      notes: "Aset dihapus (soft delete)",
    });
    
    revalidatePath("/admin/assets");
  } catch (error) {
    console.error(error);
    throw new Error("Gagal menghapus aset");
  }
}
