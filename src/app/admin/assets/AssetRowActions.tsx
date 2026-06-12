"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAsset, updateAsset, addAssetStock, deleteAssetImage } from "@/app/actions/assets";
import Link from "next/link";

interface JurusanItem {
  id: string;
  namaJurusan: string;
}

interface LocationItem {
  id: string;
  namaLokasi: string;
}

interface AssetImageItem {
  id: string;
  urlFile: string;
  tipeFile: string;
}

interface AssetInstance {
  id: string;
  namaBarang: string;
  kodeUnik: string;
  assetType: string;
  merk?: string | null;
  tahunPengadaan?: number | null;
  kondisi: string;
  status: string;
  quantity: number;
  jurusanId?: string | null;
  locationId?: string | null;
  images?: AssetImageItem[] | null;
}

export function AssetRowActions({ 
  asset, 
  jurusanList, 
  locationList,
  isViewer = false,
}: { 
  asset: AssetInstance, 
  jurusanList: JurusanItem[], 
  locationList: LocationItem[],
  isViewer?: boolean,
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [assetType, setAssetType] = useState(asset.assetType);

  return (
    <div className="flex justify-end gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
      
      {/* TOMBOL DETAIL */}
      <Link href={`/admin/assets/${asset.id}`}>
        <Button size="sm" variant="outline" className="bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10 transition-all">
          Detail
        </Button>
      </Link>
      
      {/* TOMBOL TAMBAH STOK (Hanya untuk CONSUMABLE) */}
      {asset.assetType === "CONSUMABLE" && !isViewer && (
        <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
          <DialogTrigger render={<Button size="sm" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all" />}>
            + Stok
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Tambah Stok: {asset.namaBarang}</DialogTitle>
            </DialogHeader>
            <form 
              action={async (formData) => {
                try {
                  await addAssetStock(asset.id, formData);
                  setIsStockOpen(false);
                } catch (e) {
                  alert(e instanceof Error ? e.message : "Gagal menambah stok");
                }
              }}
              className="space-y-4 pt-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Stok Saat Ini: {asset.quantity}</label>
                <input 
                  type="number" 
                  name="additionalStock" 
                  required 
                  min={1}
                  placeholder="Jumlah tambahan"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600" 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsStockOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">Tambah</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* TOMBOL EDIT */}
      {!isViewer && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger render={<Button size="sm" variant="outline" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all" />}>
          Edit
        </DialogTrigger>
        <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Aset</DialogTitle>
          </DialogHeader>
          <form 
            action={async (formData) => {
              try {
                await updateAsset(asset.id, formData);
                setIsEditOpen(false);
              } catch (e) {
                alert(e instanceof Error ? e.message : "Gagal mengedit aset");
              }
            }} 
            className="space-y-5 pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Nama Aset</label>
                <input type="text" name="namaBarang" defaultValue={asset.namaBarang} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Tipe Aset</label>
                <select 
                  name="assetType" 
                  required 
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                >
                  <option value="FIXED" className="bg-zinc-900 text-white">Barang Inventaris</option>
                  <option value="CONSUMABLE" className="bg-zinc-900 text-white">Barang Habis Pakai</option>
                </select>
              </div>

              {assetType === "FIXED" && (
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                  <label className="text-xs font-medium text-zinc-400">Kode Inventaris</label>
                  <input type="text" name="kodeUnik" defaultValue={asset.kodeUnik} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Merk / Produsen</label>
                <input type="text" name="merk" defaultValue={asset.merk || ""} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Tahun Pengadaan</label>
                <input type="number" name="tahunPengadaan" defaultValue={asset.tahunPengadaan || ""} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Kondisi</label>
                <select name="kondisi" defaultValue={asset.kondisi} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                  <option value="BAIK" className="bg-zinc-900">Baik</option>
                  <option value="RUSAK_RINGAN" className="bg-zinc-900">Rusak Ringan</option>
                  <option value="RUSAK_BERAT" className="bg-zinc-900">Rusak Berat</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Jurusan Pemilik</label>
                <select name="jurusanId" defaultValue={asset.jurusanId || ""} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                  <option value="" className="bg-zinc-900">-- Pilih Jurusan --</option>
                  {jurusanList.map((j) => <option key={j.id} value={j.id} className="bg-zinc-900">{j.namaJurusan}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Lokasi Penempatan</label>
                <select name="locationId" defaultValue={asset.locationId || ""} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                  <option value="" className="bg-zinc-900">-- Pilih Ruangan --</option>
                  {locationList.map((l) => <option key={l.id} value={l.id} className="bg-zinc-900">{l.namaLokasi}</option>)}
                </select>
              </div>

              {assetType === "CONSUMABLE" && (
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                  <label className="text-xs font-medium text-zinc-400">Jumlah Stok</label>
                  <input type="number" name="quantity" defaultValue={asset.quantity} min={1} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
              )}
            </div>

            {/* Image Gallery and Upload inside the form */}
            <div className="border-t border-white/5 pt-5 space-y-5">
              {asset.images && asset.images.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Foto Aset Saat Ini</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {asset.images.map((img) => (
                      <div key={img.id} className="relative aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden group/thumb">
                        <img 
                          src={img.urlFile} 
                          alt="Thumbnail Aset" 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm("Apakah Anda yakin ingin menghapus foto ini?")) {
                              try {
                                await deleteAssetImage(img.id);
                              } catch (e) {
                                alert(e instanceof Error ? e.message : "Gagal menghapus foto");
                              }
                            }
                          }}
                          className="absolute inset-0 bg-red-600/80 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all duration-200 cursor-pointer"
                          title="Hapus Foto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Unggah Foto Baru (Opsional)</label>
                <input 
                  type="file" 
                  name="image" 
                  accept="image/*" 
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="hover:bg-white/5 text-zinc-300">
                Batal
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 rounded-xl px-6">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      )}

      {/* TOMBOL HAPUS */}
      {!isViewer && (
        <form action={deleteAsset.bind(null, asset.id)} onSubmit={(e) => {
          if(!confirm('Apakah Anda yakin ingin menghapus aset ini?')) e.preventDefault();
        }}>
          <Button variant="destructive" size="sm" type="submit" className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all">
            Hapus
          </Button>
        </form>
      )}

    </div>
  );
}
