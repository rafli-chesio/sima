import { db } from "@/db";
import { locations } from "@/db/schema";
import { createLocation, deleteLocation } from "@/app/actions/locations";
import { Button } from "@/components/ui/button";
import { isNull } from "drizzle-orm";

export default async function LocationsPage() {
  const data = await db.select().from(locations).where(isNull(locations.deletedAt)).orderBy(locations.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Lokasi</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Tambah Lokasi Baru</h2>
        <form action={createLocation} className="flex gap-4">
          <input
            type="text"
            name="namaLokasi"
            placeholder="Nama Ruangan / Lokasi"
            required
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Tambah
          </Button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-800/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-300">Nama Lokasi</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Tanggal Dibuat</th>
              <th className="px-6 py-4 font-medium text-zinc-300 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                  Belum ada data lokasi.
                </td>
              </tr>
            ) : (
              data.map((loc) => (
                <tr key={loc.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{loc.namaLokasi}</td>
                  <td className="px-6 py-4">{new Date(loc.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="px-6 py-4 text-right">
                    <form action={deleteLocation.bind(null, loc.id)}>
                      <Button variant="destructive" size="sm" type="submit">
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
  );
}
