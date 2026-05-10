import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createBorrowRequest } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function RequestAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, id),
  });

  if (!asset || asset.status !== "AVAILABLE") {
    notFound();
  }

  // max batas waktu default = 30 hari dari sekarang
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  const minDateStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white tracking-tight">Pengajuan Peminjaman</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
          <p className="text-sm text-zinc-400">Aset yang akan dipinjam:</p>
          <p className="font-medium text-lg text-white mt-1">{asset.namaBarang} ({asset.kodeUnik})</p>
          <p className="text-sm mt-1">Tipe: {asset.assetType === "FIXED" ? "Inventaris" : "Habis Pakai"}</p>
        </div>

        <form action={createBorrowRequest} className="space-y-4">
          <input type="hidden" name="assetId" value={asset.id} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Batas Waktu (Maks 30 Hari)</label>
            <input
              type="date"
              name="batasWaktu"
              required
              min={minDateStr}
              max={maxDateStr}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Jumlah (Stok tersedia: {asset.quantity})</label>
            <input
              type="number"
              name="quantity"
              required
              defaultValue={1}
              min={1}
              max={asset.quantity}
              readOnly={asset.assetType === "FIXED"}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Catatan Keperluan</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Jelaskan keperluan peminjaman..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Ajukan Sekarang
          </Button>
        </form>
      </div>
    </div>
  );
}
