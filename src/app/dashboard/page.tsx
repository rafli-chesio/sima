import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db";
import { assets, userJurusan } from "@/db/schema";
import { eq, isNull, count, and, SQL, inArray } from "drizzle-orm";
import { DashboardCalendarClient } from "./DashboardCalendarClient";
import { Users, PackagePlus, ClipboardCheck } from "lucide-react";
import { ReturnAssetButton } from "./ReturnAssetButton";

export default async function DashboardPage() {
  const session = await auth();
  
  let assetWhere: SQL | undefined = isNull(assets.deletedAt);
  
  // If KAJUR, only show stats for their jurusan
  if (session?.user?.role === "KAJUR") {
    const myJurusans = await db.select().from(userJurusan).where(eq(userJurusan.userId, session.user.id));
    if (myJurusans.length > 0) {
      const myJurusanIds = myJurusans.map((j) => j.jurusanId);
      assetWhere = and(isNull(assets.deletedAt), inArray(assets.jurusanId, myJurusanIds));
    }
  }

  const [allAssets] = await db.select({ value: count() }).from(assets).where(assetWhere);
  const [availableAssets] = await db.select({ value: count() }).from(assets).where(
    and(eq(assets.status, "AVAILABLE"), assetWhere)
  );
  const [borrowedAssets] = await db.select({ value: count() }).from(assets).where(
    and(eq(assets.status, "BORROWED"), assetWhere)
  );

  const stats = { 
    total: Number(allAssets?.value) || 0, 
    available: Number(availableAssets?.value) || 0, 
    borrowed: Number(borrowedAssets?.value) || 0 
  };

  const statsCards = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 bg-card/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:bg-card/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
        </div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Aset</h3>
        <p className="text-3xl font-bold mt-1 text-white">{stats.total}</p>
      </div>
      
      <div className="p-4 bg-card/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:bg-card/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 text-green-500 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tersedia</h3>
        <p className="text-3xl font-bold mt-1 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.2)]">{stats.available}</p>
      </div>
      
      <div className="p-4 bg-card/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:bg-card/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 text-blue-500 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dipinjam</h3>
        <p className="text-3xl font-bold mt-1 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.2)]">{stats.borrowed}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      
      {session?.user?.role === "ADMIN" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* KOLOM KIRI (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            
            {/* 1. STATISTIK */}
            {statsCards}

            {/* 2. AKSI CEPAT */}
            <div className="flex flex-col gap-3 mt-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Aksi Cepat</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/admin/users" className="block">
                  <Button className="w-full py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-sm transition-all flex gap-3 items-center justify-start group">
                    <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-semibold text-sm">Kelola Pengguna</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Tambah Kajur/Viewer</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/assets" className="block">
                  <Button className="w-full py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-sm transition-all flex gap-3 items-center justify-start group">
                    <PackagePlus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-semibold text-sm">Registrasi Aset</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Input barang masuk</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/requests" className="block">
                  <Button className="w-full py-6 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all flex gap-3 items-center justify-start group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ClipboardCheck className="w-5 h-5 shrink-0 relative z-10" />
                    <div className="flex flex-col items-start gap-1 relative z-10">
                      <span className="font-semibold text-sm">Persetujuan</span>
                      <span className="text-[10px] opacity-80 font-normal">Tinjau peminjaman</span>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* 3. AKTIVITAS TERAKHIR */}
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col mt-2">
              <h3 className="font-semibold text-white mb-3">Aktivitas Terakhir</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <RecentActivityWidget />
              </div>
            </div>

            {/* 4. ANTREAN PEMINJAMAN */}
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-white">Antrean Peminjaman</h3>
                <Link href="/admin/requests" className="text-xs text-primary hover:underline">Lihat Semua</Link>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <PendingRequestsWidget />
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (1/3) */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            
            {/* 1. KALENDER */}
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-center">
              <h3 className="font-semibold text-white mb-3 w-full text-left">Kalender Jadwal</h3>
              <div className="w-full flex justify-center">
                <DashboardCalendarWidget />
              </div>
            </div>

            {/* 2. JADWAL PENGEMBALIAN */}
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col">
              <h3 className="font-semibold text-white mb-3">Jadwal Pengembalian</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <ReturnScheduleWidget />
              </div>
            </div>
          </div>
        </div>
      )}

      {session?.user?.role === "KAJUR" && (
        <div className="space-y-8 h-full overflow-y-auto pr-2 pb-4">
          {statsCards}

          <div>
            <h2 className="text-xl font-bold mb-4 text-white tracking-tight">Aksi Cepat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/kajur/assets" className="block">
                <Button className="w-full h-auto py-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-300 justify-start px-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col items-start gap-1 relative z-10">
                    <span className="font-semibold">Cari & Pinjam Aset</span>
                    <span className="text-xs opacity-80 font-normal">Lihat ketersediaan barang (First Win)</span>
                  </div>
                </Button>
              </Link>
              <Link href="/kajur/requests" className="block">
                <Button className="w-full h-auto py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-sm transition-all duration-300 justify-start px-6">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold">Status Pengajuan</span>
                    <span className="text-xs text-muted-foreground font-normal">Cek riwayat peminjaman Anda</span>
                  </div>
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Peminjaman Aktif</h3>
                <Link href="/kajur/requests" className="text-xs text-primary hover:underline">Riwayat Lengkap</Link>
              </div>
              <div className="space-y-3">
                {session?.user?.id ? (
                  <ActiveLoansWidget userId={session.user.id} />
                ) : (
                  <p className="text-sm text-zinc-500 py-4 text-center">Sesi tidak valid.</p>
                )}
              </div>
            </div>

            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Pengajuan Terakhir</h3>
              </div>
              <div className="space-y-3">
                {session?.user?.id ? (
                  <RecentRequestsWidget userId={session.user.id} />
                ) : (
                  <p className="text-sm text-zinc-500 py-4 text-center">Sesi tidak valid.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {session?.user?.role === "VIEWER" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* KOLOM KIRI (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            
            {/* 1. STATISTIK */}
            {statsCards}

            {/* 2. AKSI CEPAT (READ-ONLY VIEW) */}
            <div className="flex flex-col gap-3 mt-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Navigasi Laporan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/admin/assets" className="block">
                  <Button className="w-full py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-sm transition-all flex gap-3 items-center justify-start group">
                    <PackagePlus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-semibold text-sm">Lihat Aset</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Daftar Inventaris Sekolah</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/requests" className="block">
                  <Button className="w-full py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-sm transition-all flex gap-3 items-center justify-start group">
                    <ClipboardCheck className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-semibold text-sm">Daftar Peminjaman</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Status & Riwayat Transaksi</span>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* 3. AKTIVITAS TERAKHIR */}
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col mt-2">
              <h3 className="font-semibold text-white mb-3">Aktivitas Terakhir</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <RecentActivityWidget />
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (1/3) */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            
            {/* 1. KALENDER */}
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col items-center">
              <h3 className="font-semibold text-white mb-3 w-full text-left">Kalender Jadwal</h3>
              <div className="w-full flex justify-center">
                <DashboardCalendarWidget />
              </div>
            </div>

            {/* 2. JADWAL PENGEMBALIAN */}
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col">
              <h3 className="font-semibold text-white mb-3">Jadwal Pengembalian</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <ReturnScheduleWidget />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// WIDGET COMPONENTS
// -----------------------------------------------------------------------------

import { desc, asc } from "drizzle-orm";
import { approveRequest } from "@/app/actions/transactions";
import { transactions as txSchema, assetHistory as histSchema } from "@/db/schema";

async function PendingRequestsWidget() {
  const pendingRequests = await db.query.transactions.findMany({
    where: eq(txSchema.approvalStatus, "PENDING"),
    limit: 5,
    orderBy: [desc(txSchema.createdAt)],
    with: { asset: true, borrower: true }
  });

  if (pendingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-3">
        <p className="text-sm text-zinc-500 text-center">Tidak ada antrean persetujuan.</p>
        <Link href="/admin/requests">
          <Button variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/10">Lihat Riwayat</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {pendingRequests.map(req => (
        <div key={req.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5 shrink-0">
          <div>
            <p className="text-sm font-semibold text-white">{req.asset?.namaBarang}</p>
            <p className="text-xs text-zinc-400">Oleh: {req.borrower?.name} | Qty: {req.quantity}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <form action={approveRequest.bind(null, req.id)}>
              <Button size="sm" type="submit" className="h-7 px-2 text-xs bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20">Setujui</Button>
            </form>
            <Button size="sm" variant="destructive" className="h-7 px-2 text-xs bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20">Tolak</Button>
          </div>
        </div>
      ))}
    </>
  );
}

async function RecentActivityWidget() {
  const history = await db.query.assetHistory.findMany({
    limit: 5,
    orderBy: [desc(histSchema.createdAt)],
    with: { asset: true, performer: true }
  });

  if (history.length === 0) {
    return <p className="text-sm text-zinc-500 py-4 text-center">Belum ada aktivitas.</p>;
  }

  return (
    <>
      {history.map(item => (
        <div key={item.id} className="flex gap-3 text-sm shrink-0 items-start">
          <div className="mt-1.5 w-2 h-2 rounded-full bg-primary/50 shrink-0" />
          <div className="flex-1">
            <p className="text-zinc-300 leading-snug">
              <span className="font-semibold text-white">{item.performer?.name || "Sistem"}</span> {item.notes}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{new Date(item.createdAt).toLocaleString("id-ID")}</p>
          </div>
        </div>
      ))}
    </>
  );
}

async function ActiveLoansWidget({ userId }: { userId: string }) {
  const activeLoans = await db.query.transactions.findMany({
    where: and(
      eq(txSchema.borrowerId, userId),
      eq(txSchema.approvalStatus, "APPROVED"),
      isNull(txSchema.tanggalKembaliReal)
    ),
    orderBy: [desc(txSchema.tanggalPinjam)],
    with: { asset: true }
  });

  if (activeLoans.length === 0) {
    return <p className="text-sm text-zinc-500 py-4 text-center">Anda tidak memiliki peminjaman aktif saat ini.</p>;
  }

  return (
    <>
      {activeLoans.map(loan => {
        const today = new Date();
        const dueDate = new Date(loan.batasWaktu);
        const isOverdue = today > dueDate;
        
        return (
          <div key={loan.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5 gap-3 hover:bg-white/10 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate" title={loan.asset?.namaBarang}>{loan.asset?.namaBarang}</p>
              <p className="text-xs text-zinc-400">Jumlah: {loan.quantity}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-zinc-400 mb-1">Batas: {dueDate.toLocaleDateString("id-ID")}</p>
                {isOverdue ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">Terlambat</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Aktif</span>
                )}
              </div>
              <div className="text-right sm:hidden block">
                <p className="text-[10px] text-zinc-400 mb-0.5">{dueDate.toLocaleDateString("id-ID")}</p>
                {isOverdue ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">Terlambat</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Aktif</span>
                )}
              </div>
              <ReturnAssetButton
                loanId={loan.id}
                namaBarang={loan.asset?.namaBarang || ""}
                quantity={loan.quantity}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

async function RecentRequestsWidget({ userId }: { userId: string }) {
  const requests = await db.query.transactions.findMany({
    where: eq(txSchema.borrowerId, userId),
    limit: 5,
    orderBy: [desc(txSchema.createdAt)],
    with: { asset: true }
  });

  if (requests.length === 0) {
    return <p className="text-sm text-zinc-500 py-4 text-center">Belum ada pengajuan peminjaman.</p>;
  }

  return (
    <>
      {requests.map(req => (
        <div key={req.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
          <div>
            <p className="text-sm font-semibold text-white">{req.asset?.namaBarang}</p>
            <p className="text-xs text-zinc-400">{new Date(req.createdAt).toLocaleDateString("id-ID")}</p>
          </div>
          <span className={`px-2 py-1 rounded text-[10px] font-medium border ${
            req.approvalStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
            req.approvalStatus === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {req.approvalStatus}
          </span>
        </div>
      ))}
    </>
  );
}

async function DashboardCalendarWidget() {
  // Fetch pending requests and active loans due dates
  const activeLoans = await db.query.transactions.findMany({
    where: and(
      eq(txSchema.approvalStatus, "APPROVED"),
      isNull(txSchema.tanggalKembaliReal)
    ),
    columns: { batasWaktu: true }
  });
  
  const pendingReqs = await db.query.transactions.findMany({
    where: eq(txSchema.approvalStatus, "PENDING"),
    columns: { createdAt: true }
  });

  const eventDates: Date[] = [];
  activeLoans.forEach(loan => {
    if (loan.batasWaktu) eventDates.push(new Date(loan.batasWaktu));
  });
  pendingReqs.forEach(req => {
    if (req.createdAt) eventDates.push(new Date(req.createdAt));
  });

  return <DashboardCalendarClient eventDates={eventDates} />;
}

async function ReturnScheduleWidget() {
  const activeReturns = await db.query.transactions.findMany({
    where: and(
      eq(txSchema.approvalStatus, "APPROVED"),
      isNull(txSchema.tanggalKembaliReal),
      inArray(txSchema.assetId, db.select({ id: assets.id }).from(assets).where(eq(assets.assetType, "FIXED")))
    ),
    with: { asset: true, borrower: true },
    orderBy: [asc(txSchema.batasWaktu)]
  });

  if (activeReturns.length === 0) {
    return <p className="text-sm text-zinc-500 py-4 text-center">Tidak ada jadwal pengembalian.</p>;
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  
  return (
    <>
      {activeReturns.map(req => {
        const deadline = new Date(req.batasWaktu);
        deadline.setHours(0,0,0,0);
        
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let statusBadge = null;
        if (diffDays < 0) {
          statusBadge = <span className="px-2 py-1 rounded text-[10px] font-medium border bg-red-500/10 text-red-400 border-red-500/20">Terlambat {Math.abs(diffDays)} hari</span>;
        } else if (diffDays === 0) {
          statusBadge = <span className="px-2 py-1 rounded text-[10px] font-medium border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Hari ini</span>;
        } else if (diffDays === 1) {
          statusBadge = <span className="px-2 py-1 rounded text-[10px] font-medium border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Besok</span>;
        } else {
          statusBadge = <span className="px-2 py-1 rounded text-[10px] font-medium border bg-green-500/10 text-green-400 border-green-500/20">Tepat waktu</span>;
        }

        return (
          <div key={req.id} className="flex flex-wrap justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5 shrink-0 hover:bg-white/10 transition-colors gap-2">
            <div className="flex-1 min-w-[120px]">
              <p className="text-sm font-semibold text-white truncate" title={req.asset?.namaBarang}>{req.asset?.namaBarang}</p>
              <p className="text-[11px] text-zinc-400">{req.borrower?.name} | {deadline.toLocaleDateString("id-ID")}</p>
            </div>
            <div className="shrink-0 flex items-center">
              {statusBadge}
            </div>
          </div>
        );
      })}
    </>
  );
}
