import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";

export default async function KajurRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const myRequests = await db.query.transactions.findMany({
    where: eq(transactions.borrowerId, session.user.id),
    with: {
      asset: true,
    },
    orderBy: [desc(transactions.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Riwayat Peminjaman Saya</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-800/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-300">Aset</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Jumlah</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Tanggal Pinjam</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Batas Waktu</th>
              <th className="px-6 py-4 font-medium text-zinc-300">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {myRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  Anda belum pernah mengajukan peminjaman.
                </td>
              </tr>
            ) : (
              myRequests.map((req) => (
                <tr key={req.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    {req.asset?.namaBarang}
                    <p className="text-xs text-zinc-500">{req.asset?.kodeUnik}</p>
                  </td>
                  <td className="px-6 py-4">{req.quantity}</td>
                  <td className="px-6 py-4">{new Date(req.tanggalPinjam).toLocaleDateString("id-ID")}</td>
                  <td className="px-6 py-4">{new Date(req.batasWaktu).toLocaleDateString("id-ID")}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      req.approvalStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                      req.approvalStatus === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {req.approvalStatus}
                    </span>
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
