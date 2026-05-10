"use server";

import { db } from "@/db";
import { transactions, assets, assetHistory, notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

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
