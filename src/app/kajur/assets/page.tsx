import { db } from "@/db";
import { assets, jurusan, locations } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { eq, isNull, and } from "drizzle-orm";
import Link from "next/link";

export default async function KajurAssetsPage() {
  // Only fetch available assets for requesting
  const availableAssets = await db.query.assets.findMany({
    where: and(eq(assets.status, "AVAILABLE"), isNull(assets.deletedAt)),
    with: {
      jurusan: true,
      location: true,
    },
    orderBy: (assets, { desc }) => [desc(assets.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Ketersediaan Aset (First Win)</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-800/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-300">Nama Aset</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Tipe</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Stok</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Lokasi Penempatan</th>
              <th className="px-6 py-4 font-medium text-zinc-300 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {availableAssets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  Tidak ada aset yang tersedia saat ini.
                </td>
              </tr>
            ) : (
              availableAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{asset.namaBarang}</p>
                    <p className="text-xs">{asset.kodeUnik}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-zinc-800 border border-zinc-700 mr-2">
                      {asset.assetType === "FIXED" ? "Inventaris" : "Habis Pakai"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {asset.assetType === "CONSUMABLE" ? (
                      <span className="text-xs font-medium text-green-400">Tersedia: {asset.quantity}</span>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    {asset.location?.namaLokasi || "-"} / {asset.jurusan?.namaJurusan || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/kajur/assets/${asset.id}/request`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Ajukan Peminjaman
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
