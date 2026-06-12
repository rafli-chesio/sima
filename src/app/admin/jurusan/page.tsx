import { db } from "@/db";
import { jurusan } from "@/db/schema";
import { createJurusan, deleteJurusan } from "@/app/actions/jurusan";
import { Button } from "@/components/ui/button";
import { isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function JurusanPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }
  const data = await db.select().from(jurusan).where(isNull(jurusan.deletedAt)).orderBy(jurusan.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Jurusan</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Tambah Jurusan Baru</h2>
        <form action={createJurusan} className="flex gap-4">
          <input
            type="text"
            name="namaJurusan"
            placeholder="Nama Jurusan (contoh: Rekayasa Perangkat Lunak)"
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
              <th className="px-6 py-4 font-medium text-zinc-300">Nama Jurusan</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Tanggal Dibuat</th>
              <th className="px-6 py-4 font-medium text-zinc-300 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                  Belum ada data jurusan.
                </td>
              </tr>
            ) : (
              data.map((j) => (
                <tr key={j.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{j.namaJurusan}</td>
                  <td className="px-6 py-4">{new Date(j.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="px-6 py-4 text-right">
                    <form action={deleteJurusan.bind(null, j.id)}>
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
