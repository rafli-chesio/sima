import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { approveRequest } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ViewProofButton } from "./ViewProofButton";
import { auth } from "@/auth";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const isViewer = session?.user?.role === "VIEWER";
  const params = await searchParams;
  const activeTab = params.tab || "persetujuan";

  // 1. Fetch pending requests
  const pendingRequests = await db.query.transactions.findMany({
    where: eq(transactions.approvalStatus, "PENDING"),
    with: {
      asset: true,
      borrower: true,
    },
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  // 2. Fetch active approved loans
  const activeLoans = await db.query.transactions.findMany({
    where: and(
      eq(transactions.approvalStatus, "APPROVED"),
      isNull(transactions.tanggalKembaliReal)
    ),
    with: {
      asset: true,
      borrower: true,
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  // 3. Fetch returned transactions
  const returnedLoans = await db.query.transactions.findMany({
    where: and(
      eq(transactions.approvalStatus, "APPROVED"),
      isNotNull(transactions.tanggalKembaliReal)
    ),
    with: {
      asset: true,
      borrower: true,
    },
    orderBy: (t, { desc }) => [desc(t.tanggalKembaliReal)],
  });
  const tabs = [
    { id: "persetujuan", label: "Menunggu Persetujuan", count: pendingRequests.length },
    { id: "aktif", label: "Sedang Dipinjam", count: activeLoans.length },
    { id: "kembali", label: "Sudah Dikembalikan", count: returnedLoans.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center print:hidden gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Persetujuan & Riwayat Peminjaman</h1>
          <p className="text-sm text-zinc-400 mt-1">Tinjau antrean pengajuan, kelola pinjaman aktif, dan periksa bukti fisik pengembalian barang.</p>
        </div>
      </div>

      {/* Modern Glassmorphic Dynamic Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/60 border border-white/5 rounded-2xl backdrop-blur-xl print:hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`?tab=${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 border ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] font-bold"
                  : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5 hover:border-white/5"
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 text-[10px] rounded font-mono font-bold ${
                isActive ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-zinc-500"
              }`}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          {/* TAB 1: PENDING APPROVAL REQUESTS */}
          {activeTab === "persetujuan" && (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Aset & Jumlah</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Peminjam</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Tanggal & Batas</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Catatan</th>
                  {!isViewer && <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={isViewer ? 4 : 5} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <p>Tidak ada pengajuan peminjaman baru.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{req.asset?.namaBarang}</p>
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Qty: {req.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-white font-medium">{req.borrower?.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{req.borrower?.email}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-zinc-300 bg-white/5 px-2 py-1 rounded w-fit border border-white/5">Pengajuan: {new Date(req.createdAt).toLocaleDateString("id-ID")}</span>
                          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded w-fit border border-red-500/20">Batas Waktu: {req.batasWaktu}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-xs">
                        <p className="text-sm text-zinc-400 truncate" title={req.notes || ""}>
                          {req.notes || "-"}
                        </p>
                      </td>
                      {!isViewer && (
                        <td className="px-6 py-5 text-right">
                          <div className="flex gap-2 justify-end">
                            <form action={approveRequest.bind(null, req.id)}>
                              <Button size="sm" type="submit" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 shadow-sm transition-all duration-300">
                                Setujui
                              </Button>
                            </form>
                            <Button size="sm" variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all duration-300">
                              Tolak
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: ACTIVE LOANS */}
          {activeTab === "aktif" && (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Aset & Jumlah</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Peminjam</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Durasi Peminjaman</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Status Peminjaman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeLoans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <p>Tidak ada aset yang sedang dipinjam saat ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeLoans.map((loan) => {
                    const today = new Date();
                    const dueDate = new Date(loan.batasWaktu);
                    const isOverdue = today > dueDate;

                    return (
                      <tr key={loan.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{loan.asset?.namaBarang}</p>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Qty: {loan.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-white font-medium">{loan.borrower?.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{loan.borrower?.email}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-zinc-300 bg-white/5 px-2 py-1 rounded w-fit border border-white/5">Pinjam: {loan.tanggalPinjam}</span>
                            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded w-fit border border-red-500/20">Batas: {loan.batasWaktu}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {isOverdue ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              Terlambat (Overdue)
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Aktif / Dipinjam
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: RETURNED HISTORY WITH VERIFICATIONS */}
          {activeTab === "kembali" && (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Aset & Jumlah</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Peminjam</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Rentang Peminjaman</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Tanggal & Kondisi Kembali</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase text-right">Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {returnedLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <p>Belum ada riwayat aset yang dikembalikan.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  returnedLoans.map((loan) => {
                    const kondisi = loan.asset?.kondisi;
                    
                    return (
                      <tr key={loan.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{loan.asset?.namaBarang}</p>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Qty: {loan.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-white font-medium">{loan.borrower?.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{loan.borrower?.email}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-zinc-400">Pinjam: {loan.tanggalPinjam}</span>
                            <span className="text-xs text-zinc-500">Batas: {loan.batasWaktu}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs text-zinc-300 bg-emerald-500/10 px-2 py-1 rounded w-fit border border-emerald-500/20 mb-1.5">
                            Kembali: {loan.tanggalKembaliReal || "-"}
                          </p>
                          {kondisi === "BAIK" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">Baik</span>
                          )}
                          {kondisi === "RUSAK_RINGAN" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Kurang Baik</span>
                          )}
                          {kondisi === "RUSAK_BERAT" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">Rusak Berat</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <ViewProofButton
                            assetName={loan.asset?.namaBarang || ""}
                            borrowerName={loan.borrower?.name || ""}
                            borrowerEmail={loan.borrower?.email || ""}
                            tanggalPinjam={loan.tanggalPinjam}
                            batasWaktu={loan.batasWaktu}
                            tanggalKembaliReal={loan.tanggalKembaliReal || ""}
                            quantity={loan.quantity}
                            photoUrl={loan.returnPhotoUrl || ""}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
