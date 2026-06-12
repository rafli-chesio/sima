import { db } from "@/db";
import { assets, assetImages, transactions, assetHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, ImageIcon } from "lucide-react";
import { AssetImageThumbnail } from "../AssetImageThumbnail";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, resolvedParams.id),
    with: {
      jurusan: true,
      location: true,
      images: true,
      transactions: {
        orderBy: (tx, { desc }) => [desc(tx.createdAt)],
        with: {
          borrower: true,
          approver: true,
        }
      },
      history: {
        orderBy: (hist, { desc }) => [desc(hist.createdAt)],
        with: {
          performer: true,
        }
      }
    }
  });

  if (!asset) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/admin/assets" className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Detail Aset
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informasi lengkap, galeri foto, dan riwayat peminjaman.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Informasi Aset & Foto */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Informasi Utama</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Nama Aset</p>
                <p className="font-semibold text-white text-lg">{asset.namaBarang}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kode Inventaris / Unik</p>
                <p className="font-medium text-zinc-300">{asset.kodeUnik}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                  <p className="font-medium text-zinc-300">{asset.assetType === "FIXED" ? "Inventaris" : "Habis Pakai"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={`font-medium ${asset.status === 'AVAILABLE' ? 'text-green-400' : asset.status === 'BORROWED' ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {asset.status === 'AVAILABLE' ? 'Tersedia' : asset.status === 'BORROWED' ? 'Dipinjam' : 'Maintenance'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Merk</p>
                  <p className="font-medium text-zinc-300">{asset.merk || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tahun</p>
                  <p className="font-medium text-zinc-300">{asset.tahunPengadaan || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kondisi</p>
                  <p className="font-medium text-zinc-300">{asset.kondisi}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stok</p>
                  <p className="font-medium text-zinc-300">{asset.quantity}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-muted-foreground">Lokasi Penempatan</p>
                <p className="font-medium text-zinc-300">{asset.location?.namaLokasi || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jurusan Pemilik</p>
                <p className="font-medium text-zinc-300">{asset.jurusan?.namaJurusan || "-"}</p>
              </div>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Galeri Foto</h2>
            {asset.images.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/5 rounded-xl border-dashed">
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-zinc-500">Belum ada foto.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {asset.images.map((img) => (
                  <div key={img.id} className="aspect-square relative group">
                    <AssetImageThumbnail 
                      imageUrl={img.urlFile} 
                      altText={`${asset.namaBarang} - ${img.tipeFile}`} 
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Riwayat Transaksi & Histori Edit */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 flex flex-col h-[400px]">
            <h2 className="text-lg font-semibold text-white mb-4">Riwayat Peminjaman</h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {asset.transactions.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">Belum ada riwayat peminjaman.</p>
              ) : (
                <div className="space-y-3">
                  {asset.transactions.map((tx) => (
                    <div key={tx.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-white">Peminjam: {tx.borrower?.name}</p>
                          <p className="text-xs text-zinc-400">Tgl Pinjam: {new Date(tx.tanggalPinjam).toLocaleDateString("id-ID")}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-medium border ${
                          tx.approvalStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                          tx.approvalStatus === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {tx.approvalStatus}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-300">
                        Batas Waktu: {new Date(tx.batasWaktu).toLocaleDateString("id-ID")}
                        {tx.tanggalKembaliReal && ` | Dikembalikan: ${new Date(tx.tanggalKembaliReal).toLocaleDateString("id-ID")}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 flex flex-col h-[300px]">
            <h2 className="text-lg font-semibold text-white mb-4">Aktivitas Sistem</h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {asset.history.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">Belum ada aktivitas.</p>
              ) : (
                <div className="space-y-4">
                  {asset.history.map((hist) => (
                    <div key={hist.id} className="flex gap-3 text-sm">
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary/50 shrink-0" />
                      <div>
                        <p className="text-zinc-300">
                          <span className="font-semibold text-white">{hist.performer?.name || "Sistem"}</span> {hist.notes}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{new Date(hist.createdAt).toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
