import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { approveRequest } from "@/app/actions/transactions";
import { ExportButtons } from "@/components/ExportButtons";
import { Button } from "@/components/ui/button";

export default async function AdminRequestsPage() {
  const pendingRequests = await db.query.transactions.findMany({
    where: eq(transactions.approvalStatus, "PENDING"),
    with: {
      asset: true,
      borrower: true,
    },
    orderBy: (transactions, { asc }) => [asc(transactions.createdAt)],
  });

  const exportData = pendingRequests.map((r) => ({
    "Nama Aset": r.asset?.namaBarang,
    "Jumlah": r.quantity,
    "Peminjam": r.borrower?.name,
    "Email": r.borrower?.email,
    "Tanggal Pinjam": r.tanggalPinjam,
    "Batas Waktu": r.batasWaktu,
    "Status": r.approvalStatus,
    "Catatan": r.notes || "-",
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Persetujuan Peminjaman</h1>
          <p className="text-sm text-muted-foreground mt-1">Tinjau dan setujui antrean peminjaman aset dari Kajur.</p>
        </div>
        <ExportButtons data={exportData} filename="Laporan_Peminjaman_SIMMA" />
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Aset & Jumlah</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Peminjam</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Tanggal & Batas</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Catatan</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      <p>Tidak ada pengajuan peminjaman baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-white group-hover:text-primary transition-colors">{req.asset?.namaBarang}</p>
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Qty: {req.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-white font-medium">{req.borrower?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{req.borrower?.email}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-300 bg-white/5 px-2 py-1 rounded w-fit border border-white/5">Pinjam: {req.tanggalPinjam}</span>
                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded w-fit border border-red-500/20">Batas: {req.batasWaktu}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                      <p className="text-sm text-zinc-400 truncate" title={req.notes || ""}>
                        {req.notes || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex gap-2 justify-end">
                        <form action={approveRequest.bind(null, req.id)}>
                          <Button size="sm" type="submit" className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20 shadow-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                            Setujui
                          </Button>
                        </form>
                        <Button size="sm" variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all duration-300">
                          Tolak
                        </Button>
                      </div>
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
