import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db";
import { assets, userJurusan } from "@/db/schema";
import { eq, isNull, count, and } from "drizzle-orm";

export default async function DashboardPage() {
  const session = await auth();
  
  // Fetch actual stats from DB
  let assetWhere = isNull(assets.deletedAt);
  
  // If KAJUR, only show stats for their jurusan
  if (session?.user?.role === "KAJUR") {
    const myJurusan = await db.query.userJurusan.findFirst({
      where: eq(userJurusan.userId, session.user.id),
    });
    if (myJurusan) {
      assetWhere = and(isNull(assets.deletedAt), eq(assets.jurusanId, myJurusan.jurusanId));
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="relative">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Ringkasan Sistem</h1>
        <p className="text-muted-foreground mt-1 font-medium tracking-wide">Selamat datang kembali, {session?.user?.name}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:bg-card/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Aset</h3>
          <p className="text-4xl font-bold mt-2 text-white">{stats.total}</p>
        </div>
        
        <div className="p-6 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:bg-card/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-green-500 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tersedia</h3>
          <p className="text-4xl font-bold mt-2 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.2)]">{stats.available}</p>
        </div>
        
        <div className="p-6 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:bg-card/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-blue-500 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dipinjam</h3>
          <p className="text-4xl font-bold mt-2 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.2)]">{stats.borrowed}</p>
        </div>
      </div>

      {/* Quick actions based on role */}
      {session?.user?.role === "ADMIN" && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6 text-white tracking-tight">Aksi Cepat Admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users" className="block">
              <Button className="w-full h-auto py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-sm transition-all duration-300 justify-start px-6">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-semibold">Kelola Pengguna</span>
                  <span className="text-xs text-muted-foreground font-normal">Tambah Kajur atau Viewer</span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/assets" className="block">
              <Button className="w-full h-auto py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-sm transition-all duration-300 justify-start px-6">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-semibold">Registrasi Aset</span>
                  <span className="text-xs text-muted-foreground font-normal">Input barang masuk baru</span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/requests" className="block">
              <Button className="w-full h-auto py-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-300 justify-start px-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col items-start gap-1 relative z-10">
                  <span className="font-semibold">Persetujuan Peminjaman</span>
                  <span className="text-xs opacity-80 font-normal">Tinjau antrean peminjaman</span>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      {session?.user?.role === "KAJUR" && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6 text-white tracking-tight">Aksi Cepat Kajur</h2>
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
      )}
    </div>
  );
}
