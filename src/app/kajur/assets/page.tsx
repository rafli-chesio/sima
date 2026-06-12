import { db } from "@/db";
import { assets, userJurusan } from "@/db/schema";
import { eq, and, isNull, sql, or, ilike, inArray } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { SearchInput } from "@/app/admin/assets/SearchInput";

export default async function KajurAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get active Kajur's departments
  const myJurusans = await db.select().from(userJurusan).where(eq(userJurusan.userId, session.user.id));

  if (myJurusans.length === 0) {
    return (
      <div className="p-8 text-center bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl">
        <p className="text-sm text-zinc-500">Jurusan tidak ditemukan untuk akun Anda. Hubungi Administrator.</p>
      </div>
    );
  }

  const myJurusanIds = myJurusans.map((j) => j.jurusanId);

  const params = await searchParams;
  const activeKib = params.tab || "ALL";
  const searchQuery = params.search || "";

  // Helper function to build dynamic search & category conditions scoped to this Kajur's department
  const getWhereClause = (category?: "KIB_A" | "KIB_B" | "KIB_C", type?: "INTRA" | "EXTRA") => {
    const conds = [
      isNull(assets.deletedAt),
      inArray(assets.jurusanId, myJurusanIds),
    ];
    
    if (searchQuery) {
      conds.push(
        or(
          ilike(assets.namaBarang, `%${searchQuery}%`),
          ilike(assets.kodeBarang, `%${searchQuery}%`)
        )!
      );
    }
    
    if (category) {
      conds.push(eq(assets.kibCategory, category));
    }
    
    if (type) {
      conds.push(eq(assets.kibType, type));
    }
    
    return and(...conds);
  };

  // Build dynamic where clause based on activeKib tab
  let whereClause;
  if (activeKib === "KIB_A") {
    whereClause = getWhereClause("KIB_A");
  } else if (activeKib === "KIB_B_INTRA") {
    whereClause = getWhereClause("KIB_B", "INTRA");
  } else if (activeKib === "KIB_B_EXTRA") {
    whereClause = getWhereClause("KIB_B", "EXTRA");
  } else if (activeKib === "KIB_C_INTRA") {
    whereClause = getWhereClause("KIB_C", "INTRA");
  } else if (activeKib === "KIB_C_EXTRA") {
    whereClause = getWhereClause("KIB_C", "EXTRA");
  } else {
    whereClause = getWhereClause();
  }

  // Calculate counts for all tabs for dynamic numbers in tabs (filtering by search and scoped to department too)
  const [
    countAll,
    countKibA,
    countKibBIntra,
    countKibBExtra,
    countKibCIntra,
    countKibCExtra
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(assets).where(getWhereClause()),
    db.select({ count: sql<number>`count(*)` }).from(assets).where(getWhereClause("KIB_A")),
    db.select({ count: sql<number>`count(*)` }).from(assets).where(getWhereClause("KIB_B", "INTRA")),
    db.select({ count: sql<number>`count(*)` }).from(assets).where(getWhereClause("KIB_B", "EXTRA")),
    db.select({ count: sql<number>`count(*)` }).from(assets).where(getWhereClause("KIB_C", "INTRA")),
    db.select({ count: sql<number>`count(*)` }).from(assets).where(getWhereClause("KIB_C", "EXTRA")),
  ]);

  const allCounts = {
    ALL: Number(countAll[0]?.count || 0),
    KIB_A: Number(countKibA[0]?.count || 0),
    KIB_B_INTRA: Number(countKibBIntra[0]?.count || 0),
    KIB_B_EXTRA: Number(countKibBExtra[0]?.count || 0),
    KIB_C_INTRA: Number(countKibCIntra[0]?.count || 0),
    KIB_C_EXTRA: Number(countKibCExtra[0]?.count || 0),
  };

  // Pagination Math
  const limit = 15;
  const totalItems = allCounts[activeKib as keyof typeof allCounts] || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = Math.min(Math.max(1, Number(params.page || "1")), totalPages);
  const offset = (currentPage - 1) * limit;

  // Get active asset list (scoped and paginated)
  const assetsData = await db.query.assets.findMany({
    where: whereClause,
    with: {
      jurusan: true,
      location: true,
      images: true,
    },
    orderBy: (assets, { asc }) => [asc(assets.namaBarang)],
    limit: limit,
    offset: offset,
  });

  const tabs = [
    { id: "ALL", label: "Semua Aset", count: allCounts.ALL },
    { id: "KIB_B_INTRA", label: "KIB B - Intra", count: allCounts.KIB_B_INTRA },
    { id: "KIB_B_EXTRA", label: "KIB B - Extra", count: allCounts.KIB_B_EXTRA },
    { id: "KIB_C_INTRA", label: "KIB C - Intra", count: allCounts.KIB_C_INTRA },
    { id: "KIB_C_EXTRA", label: "KIB C - Extra", count: allCounts.KIB_C_EXTRA },
  ];

  // Dynamic columns configuration
  const showKibBColumns = activeKib === "KIB_B_INTRA" || activeKib === "KIB_B_EXTRA";
  const showKibCColumns = activeKib === "KIB_C_INTRA" || activeKib === "KIB_C_EXTRA";

  // Calculate total columns dynamically for Kajur (excluding hidden/deleted columns)
  let totalColumns = 7; // Status, Nama Barang, Kode Barang, Stok, Kondisi, Lokasi, Aksi
  if (!showKibBColumns && !showKibCColumns) {
    totalColumns += 1; // No. Register
  }
  if (showKibBColumns) {
    totalColumns += 1; // Merk/Type
  }
  if (activeKib === "ALL") {
    totalColumns += 1; // Kategori KIB
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Daftar Aset Jurusan</h1>
          <p className="text-sm text-muted-foreground mt-1">Lihat spesifikasi KIB dan ajukan peminjaman aset untuk jurusan Anda.</p>
        </div>
      </div>

      {/* Modern Glassmorphic Dynamic Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/60 border border-white/5 rounded-2xl backdrop-blur-xl print:hidden">
        {tabs.map((tab) => {
          const isActive = activeKib === tab.id;
          return (
            <Link
              key={tab.id}
              href={`?tab=${tab.id}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
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

      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"></span>
          Daftar Aset ({tabs.find(t => t.id === activeKib)?.label})
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SearchInput />
        </div>
      </div>

      <div className="w-full bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-4 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase w-16">Status</th>
                <th className="px-4 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Nama Barang</th>
                <th className="px-4 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Kode Barang</th>
                
                {/* No. Register - Hidden for Kajur on KIB B & KIB C */}
                {!showKibBColumns && !showKibCColumns && (
                  <th className="px-4 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">No. Register</th>
                )}

                {/* KIB B Specific Columns - Bahan hidden for Kajur */}
                {showKibBColumns && (
                  <>
                    <th className="px-4 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Merk/Type</th>
                  </>
                )}

                {/* KIB C Specific Columns - All dynamic KIB C columns hidden for Kajur */}

                {/* Global Columns */}
                <th className="px-4 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Stok</th>
                <th className="px-4 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Kondisi</th>

                {/* If ALL tab, show category info */}
                {activeKib === "ALL" && (
                  <th className="px-4 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Kategori KIB</th>
                )}
                
                <th className="px-4 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Lokasi Penempatan</th>
                <th className="pl-4 pr-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assetsData.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className="px-6 py-12 text-center text-muted-foreground">
                    Belum ada data aset untuk kategori ini.
                  </td>
                </tr>
              ) : (
                assetsData.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        asset.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {asset.status === 'AVAILABLE' ? 'Tersedia' : 'Dipinjam'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{asset.namaBarang}</p>
                      <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 mt-1 inline-block">
                        {asset.kodeUnik}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-zinc-300 font-mono text-xs">
                      {asset.kodeBarang || "-"}
                    </td>
                    
                    {/* No. Register - Hidden for Kajur on KIB B & KIB C */}
                    {!showKibBColumns && !showKibCColumns && (
                      <td className="px-4 py-4 text-zinc-300 font-mono text-xs">
                        {asset.noRegister || "-"}
                      </td>
                    )}

                    {/* KIB B Specific Columns - Bahan hidden for Kajur */}
                    {showKibBColumns && (
                      <>
                        <td className="px-4 py-4 text-zinc-300 text-xs">{asset.merk || "-"}</td>
                      </>
                    )}

                    {/* KIB C Specific Columns - All dynamic KIB C columns hidden for Kajur */}

                    {/* Global Columns */}
                    <td className="px-4 py-4 text-emerald-400 font-bold text-xs font-mono">
                      {asset.quantity}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-[10px] font-semibold rounded-full border ${
                        asset.kondisi === 'BAIK' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(16,185_129,0.05)]' : 
                        asset.kondisi === 'RUSAK_RINGAN' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.05)]' :
                        'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]'
                      }`}>
                        {asset.kondisi === 'BAIK' ? 'Baik' : asset.kondisi === 'RUSAK_RINGAN' ? 'Rusak Ringan' : 'Rusak Berat'}
                      </span>
                    </td>

                    {/* If ALL tab, also show category info */}
                    {activeKib === "ALL" && (
                      <td className="px-4 py-4">
                        {asset.kibCategory ? (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded border border-purple-500/20 bg-purple-500/5 text-purple-400">
                            {asset.kibCategory.replace("_", " ")} ({asset.kibType || 'INTRA'})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded border border-white/10 bg-white/5 text-zinc-400">
                            Umum
                          </span>
                        )}
                      </td>
                    )}
                    
                    <td className="px-4 py-4">
                      <div className="text-xs">
                        <p className="text-zinc-300 font-medium">{asset.location?.namaLokasi || "-"}</p>
                      </div>
                    </td>

                    <td className="pl-4 pr-6 py-4 text-right">
                      <Link href={`/kajur/assets/${asset.id}/request`}>
                        <Button size="sm" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all rounded-xl px-3 py-1.5 text-xs">
                          Ajukan
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-white/5 bg-white/[0.02]">
          <p className="text-xs text-zinc-400">
            Menampilkan <span className="font-semibold text-emerald-400 font-mono">{totalItems === 0 ? 0 : offset + 1}</span> - <span className="font-semibold text-emerald-400 font-mono">{Math.min(offset + limit, totalItems)}</span> dari <span className="font-semibold text-zinc-300 font-mono">{totalItems}</span> aset
          </p>
          
          <div className="flex items-center gap-2">
            {currentPage <= 1 ? (
              <Button variant="outline" size="sm" disabled className="opacity-50 pointer-events-none dark:border-white/5 dark:bg-white/5 text-zinc-500">
                {"<<"}
              </Button>
            ) : (
              <Link href={`?tab=${activeKib}&page=1${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}>
                <Button variant="outline" size="sm" className="dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer">
                  {"<<"}
                </Button>
              </Link>
            )}

            {currentPage <= 1 ? (
              <Button variant="outline" size="sm" disabled className="opacity-50 pointer-events-none dark:border-white/5 dark:bg-white/5 text-zinc-500 text-xs gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Sebelumnya
              </Button>
            ) : (
              <Link href={`?tab=${activeKib}&page=${currentPage - 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}>
                <Button variant="outline" size="sm" className="dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-300 hover:text-white text-xs gap-1 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  Sebelumnya
                </Button>
              </Link>
            )}
            
            <span className="text-xs font-medium text-zinc-400 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 font-mono">
              Hal <span className="text-emerald-400 font-bold">{currentPage}</span> / <span className="text-zinc-300 font-bold">{totalPages}</span>
            </span>
            
            {currentPage >= totalPages ? (
              <Button variant="outline" size="sm" disabled className="opacity-50 pointer-events-none dark:border-white/5 dark:bg-white/5 text-zinc-500 text-xs gap-1">
                Berikutnya
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </Button>
            ) : (
              <Link href={`?tab=${activeKib}&page=${currentPage + 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}>
                <Button variant="outline" size="sm" className="dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-300 hover:text-white text-xs gap-1 cursor-pointer">
                  Berikutnya
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </Button>
              </Link>
            )}

            {currentPage >= totalPages ? (
              <Button variant="outline" size="sm" disabled className="opacity-50 pointer-events-none dark:border-white/5 dark:bg-white/5 text-zinc-500">
                {">>"}
              </Button>
            ) : (
              <Link href={`?tab=${activeKib}&page=${totalPages}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}>
                <Button variant="outline" size="sm" className="dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer">
                  {">>"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
