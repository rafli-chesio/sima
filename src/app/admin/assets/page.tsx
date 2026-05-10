import { db } from "@/db";
import { assets, jurusan, locations } from "@/db/schema";
import { createAsset, deleteAsset } from "@/app/actions/assets";
import { ExportButtons } from "@/components/ExportButtons";
import { Button } from "@/components/ui/button";
import { isNull } from "drizzle-orm";
import { AssetForm } from "./AssetForm";

export default async function AssetsPage() {
  const assetsData = await db.query.assets.findMany({
    where: isNull(assets.deletedAt),
    with: {
      jurusan: true,
      location: true,
    },
    orderBy: (assets, { desc }) => [desc(assets.createdAt)],
  });

  const exportData = assetsData.map((a) => ({
    "Kode Unik": a.kodeUnik,
    "Nama Barang": a.namaBarang,
    "Tipe": a.assetType,
    "Merk": a.merk || "-",
    "Kondisi": a.kondisi,
    "Status": a.status,
    "Jumlah": a.quantity,
    "Lokasi": a.location?.namaLokasi || "-",
    "Jurusan": a.jurusan?.namaJurusan || "-",
  }));

  const jurusanList = await db.select().from(jurusan);
  const locationList = await db.select().from(locations);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Manajemen Aset</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola data inventaris, baik aset tetap maupun habis pakai.</p>
        </div>
        <ExportButtons data={exportData} filename="Laporan_Aset_SIMMA" />
      </div>

      <div className="flex justify-between items-center bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full"></span>
          Daftar Aset
        </h2>
        <AssetForm jurusanList={jurusanList} locationList={locationList} />
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Nama Aset</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Tipe</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Stok</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Lokasi Penempatan</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Status</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assetsData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Belum ada data aset.
                  </td>
                </tr>
              ) : (
                assetsData.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white group-hover:text-primary transition-colors">{asset.namaBarang}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{asset.kodeUnik}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 text-xs font-medium rounded border border-white/10 bg-white/5 text-zinc-300">
                        {asset.assetType === "FIXED" ? "Inventaris" : "Habis Pakai"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {asset.assetType === "CONSUMABLE" ? (
                        <span className="text-xs font-medium text-green-400">{asset.quantity}</span>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-zinc-300">{asset.location?.namaLokasi || "-"}</p>
                        <p className="text-xs text-muted-foreground">{asset.jurusan?.namaJurusan || "-"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${
                        asset.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        asset.status === 'BORROWED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {asset.status === 'AVAILABLE' ? 'Tersedia' : asset.status === 'BORROWED' ? 'Dipinjam' : 'Maintenance'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={deleteAsset.bind(null, asset.id)}>
                        <Button variant="destructive" size="sm" type="submit" className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all opacity-0 group-hover:opacity-100">
                          Hapus
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
