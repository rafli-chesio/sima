import { db } from "@/db";
import { users, jurusan } from "@/db/schema";
import { createUser, deleteUser } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChangePasswordButton } from "./ChangePasswordButton";


export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }
  const usersData = await db.query.users.findMany({
    where: isNull(users.deletedAt),
    with: {
      userJurusan: {
        with: {
          jurusan: true,
        },
      },
    },
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });

  const jurusanList = await db.select().from(jurusan);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Pengguna</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Buat Pengguna Baru</h2>
        <form action={createUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Nama Lengkap"
              required
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="role"
              required
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="KAJUR">Kajur</option>
              <option value="VIEWER">Viewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Akses Jurusan (Khusus Kajur):</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {jurusanList.map((j) => (
                <label key={j.id} className="flex items-center gap-2 text-sm text-zinc-400">
                  <input type="checkbox" name="jurusanIds" value={j.id} className="rounded border-zinc-700 bg-zinc-800" />
                  {j.namaJurusan}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Buat Pengguna
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-800/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-300">Nama / Email</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Role</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Akses Jurusan</th>
              <th className="px-6 py-4 font-medium text-zinc-300 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {usersData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                  Belum ada data pengguna.
                </td>
              </tr>
            ) : (
              usersData.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-xs">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-zinc-800 border border-zinc-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.userJurusan.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.userJurusan.map((uj) => (
                          <span key={uj.jurusan.id} className="px-2 py-1 text-xs rounded bg-blue-900/30 text-blue-400 border border-blue-900/50">
                            {uj.jurusan.namaJurusan}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <ChangePasswordButton userId={user.id} userName={user.name} />
                      {user.role !== "ADMIN" && (
                        <form action={deleteUser.bind(null, user.id)}>
                          <Button variant="destructive" size="sm" type="submit">
                            Hapus
                          </Button>
                        </form>
                      )}
                    </div>
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
