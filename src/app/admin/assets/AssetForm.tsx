"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { createAssetAction } from "@/app/actions/assets";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { assetSchema } from "@/lib/validations/asset";

export function AssetForm({
  jurusanList,
  locationList
}: {
  jurusanList: { id: string; namaJurusan: string }[];
  locationList: { id: string; namaLokasi: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Find dynamic default ID for 'Umum / Sekolah' department
  const defaultJurusan = jurusanList.find(
    (j) => j.namaJurusan.toLowerCase().includes("umum") || j.namaJurusan.toLowerCase().includes("sekolah")
  );

  const form = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      namaBarang: "",
      kodeUnik: "",
      assetType: "FIXED",
      merkType: "",
      ukuranCc: "",
      bahan: "",
      tahunPembelian: new Date().getFullYear(),
      asalUsul: "",
      jumlahBarang: 1,
      hargaSatuan: 0,
      jurusanId: defaultJurusan?.id || "",
      locationId: "",
      kondisi: "BAIK",
    },
  });

  const [assetType, setAssetType] = useState<"FIXED" | "CONSUMABLE">("FIXED");

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
    setPhoto(null);
    setAssetType("FIXED");
  };

  const onSubmit = async (values: z.infer<typeof assetSchema>) => {
    try {
      const formData = new FormData();
      formData.append("namaBarang", values.namaBarang);
      formData.append("kodeUnik", values.kodeUnik || "");
      formData.append("assetType", values.assetType);
      formData.append("merkType", values.merkType || "");
      formData.append("ukuranCc", values.ukuranCc || "");
      formData.append("bahan", values.bahan || "");
      if (values.tahunPembelian) formData.append("tahunPembelian", String(values.tahunPembelian));
      formData.append("asalUsul", values.asalUsul || "");
      formData.append("jumlahBarang", String(values.jumlahBarang));
      formData.append("hargaSatuan", String(values.hargaSatuan));
      formData.append("kondisi", values.kondisi);
      if (values.jurusanId) formData.append("jurusanId", values.jurusanId);
      if (values.locationId) formData.append("locationId", values.locationId);
      if (photo) formData.append("image", photo);

      await createAssetAction(formData);
      handleClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menambahkan aset");
    }
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={handleClose}
      />
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center z-20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
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

        {/* Content Form */}
        <div className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* Row 1 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Nama Aset <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  {...form.register("namaBarang")}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 text-sm"
                  placeholder="Contoh: Laptop Asus Vivobook"
                />
                {form.formState.errors.namaBarang && (
                  <p className="text-[11px] text-red-400 mt-1">{form.formState.errors.namaBarang.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Tipe Aset <span className="text-red-400">*</span></label>
                <select
                  {...form.register("assetType", {
                    onChange: (e) => setAssetType(e.target.value as "FIXED" | "CONSUMABLE")
                  })}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer text-sm"
                >
                  <option value="FIXED" className="bg-zinc-900 text-white">Barang Inventaris</option>
                  <option value="CONSUMABLE" className="bg-zinc-900 text-white">Barang Habis Pakai</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Kondisi Aset <span className="text-red-400">*</span></label>
                <select
                  {...form.register("kondisi")}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer text-sm"
                >
                  <option value="BAIK" className="bg-zinc-900">Baik</option>
                  <option value="RUSAK_RINGAN" className="bg-zinc-900">Rusak Ringan</option>
                  <option value="RUSAK_BERAT" className="bg-zinc-900">Rusak Berat</option>
                </select>
              </div>

              {/* Row 2 */}
              {assetType === "FIXED" && (
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                  <label className="text-xs font-semibold text-zinc-400">Kode Inventaris <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    {...form.register("kodeUnik")}
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 text-sm"
                    placeholder="Contoh: LAP-001"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Merk / Brand</label>
                <input
                  type="text"
                  {...form.register("merkType")}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 text-sm"
                  placeholder="Contoh: Asus"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Ukuran CC / Kapasitas</label>
                <input
                  type="text"
                  {...form.register("ukuranCc")}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 text-sm"
                  placeholder="Contoh: 14 Inch / 150cc"
                />
              </div>

              {/* Row 3 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Bahan Pembuatan</label>
                <input
                  type="text"
                  {...form.register("bahan")}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 text-sm"
                  placeholder="Contoh: Plastik, Alumunium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Tahun Pembelian</label>
                <input
                  type="number"
                  {...form.register("tahunPembelian", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Asal-Usul Dana</label>
                <input
                  type="text"
                  {...form.register("asalUsul")}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 text-sm"
                  placeholder="Contoh: BOS, Hibah"
                />
              </div>

              {/* Row 4 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Jumlah Barang / Stok</label>
                <input
                  type="number"
                  {...form.register("jumlahBarang", { valueAsNumber: true })}
                  min={1}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  {...form.register("hargaSatuan", { valueAsNumber: true })}
                  min={0}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Jurusan Pemilik</label>
                <div className="relative">
                  <select
                    {...form.register("jurusanId")}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer text-sm"
                  >
                    <option value="" className="bg-zinc-900">-- Tidak Ada / Umum --</option>
                    {jurusanList.map((j) => (
                      <option key={j.id} value={j.id} className="bg-zinc-900">
                        {j.namaJurusan}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Row 5 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Lokasi Penempatan</label>
                <div className="relative">
                  <select
                    {...form.register("locationId")}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer text-sm"
                  >
                    <option value="" className="bg-zinc-900">-- Pilih Ruangan Penempatan --</option>
                    {locationList.map((l) => (
                      <option key={l.id} value={l.id} className="bg-zinc-900">
                        {l.namaLokasi}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2 lg:col-span-3 pt-3">
                <label className="text-xs font-semibold text-zinc-400">Foto Aset (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer text-xs"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-white/5">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="hover:bg-white/5 text-zinc-300 rounded-xl px-5 h-10 text-sm font-semibold transition-all border-0"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 rounded-xl px-6 h-10 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Aset"}
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
        className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 rounded-xl px-6"
      >
        + Tambah Aset
      </Button>

      {mounted && typeof document !== "undefined" && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
