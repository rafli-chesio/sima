"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { returnAssetAction, uploadReturnPhoto } from "@/app/actions/transactions";

interface ReturnAssetButtonProps {
  loanId: string;
  namaBarang: string;
  quantity: number;
}

export function ReturnAssetButton({ loanId, namaBarang, quantity }: ReturnAssetButtonProps) {
  const [open, setOpen] = useState(false);
  const [kondisi, setKondisi] = useState<'B' | 'KB' | 'RB'>('B');
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleClearPhoto = () => {
    setPhoto(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      handleClearPhoto();
      setErrorMsg("");
    }
  };

  const handleReturn = async () => {
    if (!photo) {
      setErrorMsg("Foto bukti fisik barang wajib diunggah.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      // 1. Upload photo first
      const formData = new FormData();
      formData.append("file", photo);
      
      const photoUrl = await uploadReturnPhoto(formData);

      // 2. Submit the return details
      const res = await returnAssetAction(loanId, kondisi, photoUrl);
      if (res.success) {
        setOpen(false);
        handleClearPhoto();
        router.refresh();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem saat memproses pengembalian.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs h-7 px-3 rounded-lg"
          />
        }
      >
        Kembalikan
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-white max-w-sm w-full shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            Konfirmasi Pengembalian
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Silakan pilih kondisi barang dan sertakan foto bukti fisik untuk menyelesaikan pengembalian.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1">
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Aset yang Dipinjam</p>
            <p className="text-sm font-semibold text-white truncate" title={namaBarang}>{namaBarang}</p>
            <p className="text-xs text-zinc-400">
              Jumlah: <span className="font-semibold text-zinc-200">{quantity}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">Kondisi Pengembalian</label>
            <div className="relative">
              <select
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value as 'B' | 'KB' | 'RB')}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer text-sm"
              >
                <option value="B" className="bg-zinc-900 text-white">Baik (B)</option>
                <option value="KB" className="bg-zinc-900 text-white">Kurang Baik (KB)</option>
                <option value="RB" className="bg-zinc-900 text-white">Rusak Berat (RB)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            
            <p className="text-[11px] text-zinc-500 leading-snug">
              {kondisi === 'B' && "Aset dalam kondisi baik dan siap untuk dipinjamkan kembali."}
              {kondisi === 'KB' && "Aset mengalami kerusakan ringan. Kondisi aset akan ditandai sebagai Rusak Ringan."}
              {kondisi === 'RB' && "Aset mengalami kerusakan berat. Kondisi aset akan ditandai sebagai Rusak Berat."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 text-emerald-400 flex items-center gap-1">
              <span>Foto Bukti Fisik Barang</span>
              <span className="text-red-400 text-[10px]">*</span>
            </label>
            {!previewUrl ? (
              <div className="relative border border-dashed border-white/10 rounded-xl p-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group flex flex-col items-center justify-center gap-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading}
                  required
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-emerald-400 transition-colors"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <p className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">Pilih / Seret Foto</p>
                <p className="text-[10px] text-zinc-500">Format JPEG, PNG, atau WebP</p>
              </div>
            ) : (
              <div className="relative border border-white/10 rounded-xl overflow-hidden group">
                <img
                  src={previewUrl}
                  alt="Preview Bukti Fisik"
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    disabled={loading}
                    className="p-2 bg-red-500/20 border border-red-500/30 rounded-full hover:bg-red-500 hover:text-white transition-all text-red-400"
                    title="Ganti Foto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 animate-in fade-in slide-in-from-top-2 duration-200">
              {errorMsg}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex flex-row gap-2 justify-end bg-transparent p-0 border-t-0 -mx-0 -mb-0">
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                className="hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl h-9 px-4 text-sm font-semibold transition-all border-0"
              />
            }
          >
            Batal
          </DialogClose>
          <Button
            onClick={handleReturn}
            disabled={loading || !photo}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 rounded-xl h-9 px-5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              "Konfirmasi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
