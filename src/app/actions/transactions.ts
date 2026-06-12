"use server";

import { db } from "@/db";
import { transactions, assets, assetHistory, notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function createBorrowRequest(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "KAJUR") {
    throw new Error("Unauthorized");
  }

  const assetId = formData.get("assetId") as string;
  const batasWaktuStr = formData.get("batasWaktu") as string;
  const quantityStr = formData.get("quantity") as string;
  const notes = formData.get("notes") as string;

  if (!assetId || !batasWaktuStr) {
    throw new Error("Aset dan Batas Waktu wajib diisi");
  }

  // Parse and validate
  const batasWaktu = new Date(batasWaktuStr);
  const quantity = parseInt(quantityStr) || 1;
  const tanggalPinjam = new Date();

  // Validate max 30 days
  const diffTime = Math.abs(batasWaktu.getTime() - tanggalPinjam.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    throw new Error("Durasi peminjaman maksimal 30 hari");
  }

  try {
    const [newTx] = await db.insert(transactions).values({
      assetId,
      borrowerId: session.user.id,
      tanggalPinjam: tanggalPinjam.toISOString().split('T')[0],
      batasWaktu: batasWaktu.toISOString().split('T')[0],
      quantity,
      notes,
      approvalStatus: "PENDING",
    }).returning({ id: transactions.id });

    await db.insert(assetHistory).values({
      assetId,
      performedBy: session.user.id,
      actionType: "BORROW",
      notes: `Pengajuan peminjaman baru (Qty: ${quantity}) - Status: PENDING`,
    });

    const admins = await db.query.users.findMany({ where: eq(users.role, "ADMIN") });
    if (admins.length > 0) {
      const notifs = admins.map(admin => ({
        userId: admin.id,
        type: "NEW_REQUEST",
        title: "Pengajuan Peminjaman Baru",
        message: `Kajur mengajukan peminjaman aset (Qty: ${quantity}). Menunggu persetujuan Anda.`,
        relatedAssetId: assetId,
      }));
      await db.insert(notifications).values(notifs);
    }

    revalidatePath("/kajur/assets");
    revalidatePath("/kajur/requests");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error(error);
    throw new Error("Gagal mengajukan peminjaman");
  }
  redirect("/kajur/requests");
}

export async function approveRequest(transactionId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    const tx = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
      with: { asset: true },
    });

    if (!tx || tx.approvalStatus !== "PENDING") {
      throw new Error("Transaksi tidak valid atau sudah diproses");
    }

    await db.update(transactions)
      .set({
        approvalStatus: "APPROVED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        statusFinal: "ACTIVE",
      })
      .where(eq(transactions.id, transactionId));

    if (tx.asset.assetType === "FIXED") {
      await db.update(assets)
        .set({ status: "BORROWED" })
        .where(eq(assets.id, tx.assetId));
    } else {
      await db.update(assets)
        .set({ quantity: tx.asset.quantity - tx.quantity })
        .where(eq(assets.id, tx.assetId));
    }

    await db.insert(assetHistory).values({
      assetId: tx.assetId,
      performedBy: session.user.id,
      actionType: "APPROVE",
      notes: `Pengajuan peminjaman disetujui`,
    });

    await db.insert(notifications).values({
      userId: tx.borrowerId,
      type: "APPROVED",
      title: "Peminjaman Disetujui",
      message: `Peminjaman aset ${tx.asset.namaBarang} telah disetujui.`,
      relatedAssetId: tx.assetId,
    });

    revalidatePath("/admin/requests");
  } catch (error) {
    if ((error as Error).message === "NEXT_REDIRECT") throw error;
    console.error(error);
    throw new Error("Gagal menyetujui peminjaman");
  }
  redirect("/admin/requests");
}

export async function uploadReturnPhoto(formData: FormData): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("File bukti fisik wajib diunggah.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `return-${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    // directory already exists
  }

  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}

export async function returnAssetAction(
  transactionId: string,
  kondisiKembali: 'B' | 'KB' | 'RB',
  returnPhotoUrl: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Map input to DB enums
  const conditionMap = {
    B: "BAIK",
    KB: "RUSAK_RINGAN",
    RB: "RUSAK_BERAT",
  } as const;

  const dbKondisi = conditionMap[kondisiKembali];
  if (!dbKondisi) {
    throw new Error("Kondisi tidak valid");
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Get transaction and verify
      const dbTx = await tx.query.transactions.findFirst({
        where: eq(transactions.id, transactionId),
        with: { asset: true },
      });

      if (!dbTx) {
        throw new Error("Data peminjaman tidak ditemukan");
      }

      if (dbTx.approvalStatus !== "APPROVED" || dbTx.statusFinal !== "ACTIVE") {
        throw new Error("Status peminjaman tidak sedang aktif");
      }

      // 2. Update transaction
      await tx
        .update(transactions)
        .set({
          statusFinal: "RETURNED",
          tanggalKembaliReal: new Date().toISOString().split("T")[0],
          returnPhotoUrl,
          status: "DIKEMBALIKAN",
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId));

      // 3. Update asset stock and condition
      const asset = dbTx.asset;
      if (asset.assetType === "FIXED") {
        await tx
          .update(assets)
          .set({
            status: "AVAILABLE",
            kondisi: dbKondisi,
            updatedAt: new Date(),
          })
          .where(eq(assets.id, asset.id));
      } else {
        // CONSUMABLE
        await tx
          .update(assets)
          .set({
            quantity: asset.quantity + dbTx.quantity,
            kondisi: dbKondisi,
            updatedAt: new Date(),
          })
          .where(eq(assets.id, asset.id));
      }

      // 4. Insert history
      await tx.insert(assetHistory).values({
        assetId: asset.id,
        performedBy: session.user.id,
        actionType: "RETURN",
        notes: `Pengembalian aset. Kondisi kembali: ${dbKondisi}. Jumlah: ${dbTx.quantity}`,
      });

      // 5. Optionally create a notification for admins
      const admins = await tx.query.users.findMany({ where: eq(users.role, "ADMIN") });
      if (admins.length > 0) {
        const notifs = admins.map(admin => ({
          userId: admin.id,
          type: "SYSTEM" as const,
          title: "Pengembalian Aset",
          message: `Kajur telah mengembalikan aset ${asset.namaBarang} (Kondisi: ${dbKondisi}).`,
          relatedAssetId: asset.id,
        }));
        await tx.insert(notifications).values(notifs);
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/kajur/requests");
    revalidatePath("/admin/requests");

    return { success: true, message: "Aset berhasil dikembalikan" };
  } catch (error) {
    console.error("Error in returnAssetAction:", error);
    return { success: false, message: (error as Error).message || "Gagal mengembalikan aset" };
  }
}

