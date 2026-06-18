"use server";

import { db } from "@/db";
import { assets, consumableRequests, assetHistory, notifications, userJurusan, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function requestConsumable(
  assetId: string,
  quantity: number,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "KAJUR") {
    return { success: false, message: "Unauthorized" };
  }

  if (!assetId || quantity <= 0) {
    return { success: false, message: "Aset dan jumlah barang wajib diisi dengan benar" };
  }

  try {
    // 1. Get Kajur's departments to scope access
    const myJurusans = await db.select().from(userJurusan).where(eq(userJurusan.userId, session.user.id));
    if (myJurusans.length === 0) {
      return { success: false, message: "Anda tidak terdaftar di jurusan manapun" };
    }
    const myJurusanIds = myJurusans.map((j) => j.jurusanId);

    // 2. Fetch asset and validate
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, assetId),
    });

    if (!asset || asset.deletedAt) {
      return { success: false, message: "Barang tidak ditemukan" };
    }

    if (asset.assetType !== "CONSUMABLE") {
      return { success: false, message: "Aset ini bukan merupakan barang habis pakai" };
    }

    if (!asset.jurusanId || !myJurusanIds.includes(asset.jurusanId)) {
      return { success: false, message: "Aset ini bukan milik jurusan Anda" };
    }

    if (asset.quantity < quantity) {
      return { success: false, message: `Stok tidak mencukupi. Stok saat ini: ${asset.quantity}` };
    }

    // 3. Insert Request
    await db.insert(consumableRequests).values({
      assetId,
      requestedBy: session.user.id,
      quantity,
      notes: notes || null,
      approvalStatus: "PENDING",
    });

    // 4. Write to Asset History
    await db.insert(assetHistory).values({
      assetId,
      performedBy: session.user.id,
      actionType: "CONSUMABLE_REQUEST",
      notes: `Mengajukan permintaan barang habis pakai: Qty ${quantity}. Catatan: ${notes || "-"}`,
    });

    // 5. Notify Admins
    const admins = await db.query.users.findMany({ where: eq(users.role, "ADMIN") });
    if (admins.length > 0) {
      const notifs = admins.map(admin => ({
        userId: admin.id,
        type: "NEW_REQUEST",
        title: "Permintaan Barang Habis Pakai Baru",
        message: `Kajur ${session.user.name} meminta ${quantity} unit ${asset.namaBarang}.`,
        relatedAssetId: assetId,
      }));
      await db.insert(notifications).values(notifs);
    }

    revalidatePath("/kajur/consumable-requests");
    revalidatePath("/kajur/assets");

    return { success: true, message: "Permintaan berhasil diajukan" };
  } catch (error) {
    console.error("Error requesting consumable:", error);
    return { success: false, message: "Gagal mengajukan permintaan" };
  }
}

export async function approveConsumableRequest(
  requestId: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Fetch the request details
      const request = await tx.query.consumableRequests.findFirst({
        where: eq(consumableRequests.id, requestId),
        with: { asset: true },
      });

      if (!request) {
        throw new Error("Permintaan tidak ditemukan");
      }

      if (request.approvalStatus !== "PENDING") {
        throw new Error("Permintaan sudah diproses sebelumnya");
      }

      const asset = request.asset;

      // 2. Validate current stock
      if (asset.quantity < request.quantity) {
        throw new Error(`Stok tidak mencukupi untuk disetujui. Stok saat ini: ${asset.quantity}, Diminta: ${request.quantity}`);
      }

      // 3. Deduct stock
      await tx.update(assets)
        .set({
          quantity: asset.quantity - request.quantity,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, asset.id));

      // 4. Update request status to APPROVED (which acts as COMPLETED since consumable)
      await tx.update(consumableRequests)
        .set({
          approvalStatus: "APPROVED",
          approvedBy: session.user.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(consumableRequests.id, requestId));

      // 5. Add to asset history
      await tx.insert(assetHistory).values({
        assetId: asset.id,
        performedBy: session.user.id,
        actionType: "CONSUMABLE_APPROVE",
        notes: `Permintaan disetujui (Qty: ${request.quantity}). Stok berkurang dari ${asset.quantity} menjadi ${asset.quantity - request.quantity}.`,
      });

      // 6. Notify requester
      await tx.insert(notifications).values({
        userId: request.requestedBy,
        type: "APPROVED",
        title: "Permintaan Barang Habis Pakai Disetujui",
        message: `Permintaan Anda untuk ${request.quantity} unit ${asset.namaBarang} telah disetujui oleh Admin.`,
        relatedAssetId: asset.id,
      });

      return { success: true, message: "Permintaan berhasil disetujui, stok telah berkurang" };
    });

    revalidatePath("/admin/consumable-requests");
    revalidatePath("/kajur/consumable-requests");
    revalidatePath("/admin/assets");

    return result;
  } catch (error) {
    console.error("Error approving consumable request:", error);
    return { success: false, message: (error as Error).message || "Gagal menyetujui permintaan" };
  }
}

export async function rejectConsumableRequest(
  requestId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" };
  }

  if (!reason || reason.trim() === "") {
    return { success: false, message: "Alasan penolakan wajib diisi" };
  }

  try {
    const request = await db.query.consumableRequests.findFirst({
      where: eq(consumableRequests.id, requestId),
      with: { asset: true },
    });

    if (!request) {
      return { success: false, message: "Permintaan tidak ditemukan" };
    }

    if (request.approvalStatus !== "PENDING") {
      return { success: false, message: "Permintaan sudah diproses sebelumnya" };
    }

    // 1. Update request status to REJECTED
    await db.update(consumableRequests)
      .set({
        approvalStatus: "REJECTED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        rejectedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(consumableRequests.id, requestId));

    // 2. Add to asset history
    await db.insert(assetHistory).values({
      assetId: request.assetId,
      performedBy: session.user.id,
      actionType: "CONSUMABLE_REJECT",
      notes: `Permintaan ditolak. Alasan: ${reason}`,
    });

    // 3. Notify requester
    await db.insert(notifications).values({
      userId: request.requestedBy,
      type: "REJECTED",
      title: "Permintaan Barang Habis Pakai Ditolak",
      message: `Permintaan Anda untuk ${request.quantity} unit ${request.asset.namaBarang} ditolak. Alasan: ${reason}`,
      relatedAssetId: request.assetId,
    });

    revalidatePath("/admin/consumable-requests");
    revalidatePath("/kajur/consumable-requests");

    return { success: true, message: "Permintaan berhasil ditolak" };
  } catch (error) {
    console.error("Error rejecting consumable request:", error);
    return { success: false, message: "Gagal menolak permintaan" };
  }
}

export async function getConsumableRequests() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (session.user.role === "KAJUR") {
    return await db.query.consumableRequests.findMany({
      where: eq(consumableRequests.requestedBy, session.user.id),
      with: {
        asset: {
          with: {
            jurusan: true,
            location: true,
          }
        },
        requester: true,
        approver: true,
      },
      orderBy: [desc(consumableRequests.createdAt)],
    });
  } else if (session.user.role === "ADMIN" || session.user.role === "VIEWER") {
    return await db.query.consumableRequests.findMany({
      with: {
        asset: {
          with: {
            jurusan: true,
            location: true,
          }
        },
        requester: true,
        approver: true,
      },
      orderBy: [desc(consumableRequests.createdAt)],
    });
  }

  return [];
}

export async function addConsumableAsset(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" };
  }

  const namaBarang = formData.get("namaBarang") as string;
  const merk = formData.get("merk") as string || "";
  const tahunPengadaanStr = formData.get("tahunPengadaan") as string;
  let jurusanId = formData.get("jurusanId") as string || "";
  let locationId = formData.get("locationId") as string || "";
  const quantityStr = formData.get("quantity") as string;
  const notes = formData.get("notes") as string || "";

  if (!namaBarang || !quantityStr) {
    return { success: false, message: "Nama barang dan jumlah stok wajib diisi" };
  }

  const quantity = parseInt(quantityStr);
  if (isNaN(quantity) || quantity < 1) {
    return { success: false, message: "Jumlah stok minimal 1" };
  }

  const tahunPengadaan = tahunPengadaanStr ? parseInt(tahunPengadaanStr) : new Date().getFullYear();

  try {
    // 1. Resolve Jurusan (default "Sekolah" or "Umum" if empty)
    if (!jurusanId) {
      const defaultJurusan = await db.query.jurusan.findFirst({
        where: (jurusan, { or, ilike }) => or(
          ilike(jurusan.namaJurusan, "%sekolah%"),
          ilike(jurusan.namaJurusan, "%umum%")
        ),
      });

      if (defaultJurusan) {
        jurusanId = defaultJurusan.id;
      } else {
        const firstJurusan = await db.query.jurusan.findFirst();
        if (firstJurusan) {
          jurusanId = firstJurusan.id;
        }
      }
    }

    // 2. Resolve Location (default "Gudang Utama" if empty)
    if (!locationId) {
      const defaultLocation = await db.query.locations.findFirst({
        where: (locations, { or, ilike }) => or(
          ilike(locations.namaLokasi, "%gudang utama%"),
          ilike(locations.namaLokasi, "%gudang%")
        ),
      });

      if (defaultLocation) {
        locationId = defaultLocation.id;
      } else {
        const firstLocation = await db.query.locations.findFirst();
        if (firstLocation) {
          locationId = firstLocation.id;
        }
      }
    }

    // 3. Generate Kode Unik
    const kodeUnik = `BHP-${Date.now().toString().slice(-6)}`;

    // 4. Insert Asset
    const [newAsset] = await db.insert(assets).values({
      namaBarang,
      kodeUnik,
      assetType: "CONSUMABLE",
      merk: merk || null,
      tahunPengadaan,
      quantity,
      jurusanId: jurusanId || null,
      locationId: locationId || null,
      kondisi: "BAIK",
      status: "AVAILABLE",
    }).returning({ id: assets.id });

    // 5. Insert History
    await db.insert(assetHistory).values({
      assetId: newAsset.id,
      performedBy: session.user.id,
      actionType: "CREATE",
      notes: notes || "Barang habis pakai baru ditambahkan ke sistem",
    });

    revalidatePath("/admin/consumable-requests");
    revalidatePath("/kajur/consumable-requests");
    revalidatePath("/admin/assets");
    revalidatePath("/kajur/assets");

    return { success: true, message: `Barang habis pakai ${namaBarang} berhasil ditambahkan` };
  } catch (error) {
    console.error("Error in addConsumableAsset:", error);
    return { success: false, message: "Gagal menambahkan barang habis pakai baru" };
  }
}
