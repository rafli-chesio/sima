import { db } from "@/db";
import { assets, userJurusan, consumableRequests } from "@/db/schema";
import { eq, and, isNull, inArray, desc, gt } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { KajurConsumableRequestsClient } from "./KajurConsumableRequestsClient";

export default async function KajurConsumableRequestsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "KAJUR") {
    redirect("/dashboard");
  }

  // 1. Get Kajur's departments
  const myJurusans = await db.select().from(userJurusan).where(eq(userJurusan.userId, session.user.id));
  if (myJurusans.length === 0) {
    return (
      <div className="p-8 text-center bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl">
        <p className="text-sm text-zinc-500">Jurusan tidak ditemukan untuk akun Anda. Hubungi Administrator.</p>
      </div>
    );
  }

  const myJurusanIds = myJurusans.map((j) => j.jurusanId);

  // 2. Fetch available consumables in this Kajur's departments (stok > 0)
  const myConsumables = await db.query.assets.findMany({
    where: and(
      eq(assets.assetType, "CONSUMABLE"),
      isNull(assets.deletedAt),
      inArray(assets.jurusanId, myJurusanIds),
      gt(assets.quantity, 0)
    ),
    orderBy: (assets, { asc }) => [asc(assets.namaBarang)],
  });

  // Convert to serializable format for client component
  const consumablesData = myConsumables.map(asset => ({
    id: asset.id,
    namaBarang: asset.namaBarang,
    kodeUnik: asset.kodeUnik,
    quantity: asset.quantity,
    merk: asset.merk,
  }));

  // 3. Fetch past requests submitted by this Kajur
  const myRequests = await db.query.consumableRequests.findMany({
    where: eq(consumableRequests.requestedBy, session.user.id),
    with: {
      asset: true,
      approver: true,
    },
    orderBy: [desc(consumableRequests.createdAt)],
  });

  return (
    <KajurConsumableRequestsClient 
      consumables={consumablesData} 
      requests={myRequests} 
    />
  );
}
