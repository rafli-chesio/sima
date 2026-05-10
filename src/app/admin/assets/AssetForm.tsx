"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { createAsset } from "@/app/actions/assets";

export function AssetForm({ jurusanList, locationList }: { jurusanList: any[], locationList: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [assetType, setAssetType] = useState("FIXED");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Reset state back to default so next open is clean
    setTimeout(() => {
      setAssetType("FIXED");
    }, 200); // wait for animation
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center z-20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Registrasi Aset Baru
          </h2>
          <button 
            type="button"
            onClick={handleClose}
            className="text-zinc-500 hover:text-white transition-colors p-1"
            title="Tutup"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="p-6">
          <form 
            action={async (formData) => {
              try {
                await createAsset(formData);
                handleClose();
              } catch (e: any) {
                alert(e.message || "Gagal menambahkan aset");
              }
            }} 
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Nama Aset</label>
                <input type="text" name="namaBarang" required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600" placeholder="Contoh: Proyektor Epson" />
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
                  <input type="text" name="kodeUnik" required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600" placeholder="PRJ-001" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Merk / Produsen</label>
                <input type="text" name="merk" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600" placeholder="Contoh: Epson" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Tahun Pengadaan</label>
                <input type="number" name="tahunPengadaan" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600" placeholder="2024" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Kondisi</label>
                <select name="kondisi" required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                  <option value="BAIK" className="bg-zinc-900">Baik</option>
                  <option value="RUSAK_RINGAN" className="bg-zinc-900">Rusak Ringan</option>
                  <option value="RUSAK_BERAT" className="bg-zinc-900">Rusak Berat</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Jurusan Pemilik</label>
                <select name="jurusanId" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                  <option value="" className="bg-zinc-900">-- Pilih Jurusan --</option>
                  {jurusanList.map((j) => <option key={j.id} value={j.id} className="bg-zinc-900">{j.namaJurusan}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Lokasi Penempatan</label>
                <select name="locationId" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                  <option value="" className="bg-zinc-900">-- Pilih Ruangan --</option>
                  {locationList.map((l) => <option key={l.id} value={l.id} className="bg-zinc-900">{l.namaLokasi}</option>)}
                </select>
              </div>

              {assetType === "CONSUMABLE" && (
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                  <label className="text-xs font-medium text-zinc-400">Jumlah Stok</label>
                  <input type="number" name="quantity" defaultValue={1} min={1} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
              )}

              <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                <label className="text-xs font-medium text-zinc-400">Foto Aset (Opsional)</label>
                <input type="file" name="image" accept="image/*" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={handleClose} className="hover:bg-white/5 text-zinc-300">
                Batal
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 rounded-xl px-6">
                Simpan Aset
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 rounded-xl px-6"
      >
        + Tambah Aset
      </Button>

      {mounted && typeof document !== "undefined" && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
