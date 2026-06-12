"use client";

import { useState } from "react";
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

interface ViewProofButtonProps {
  assetName: string;
  borrowerName: string;
  borrowerEmail: string;
  tanggalPinjam: string;
  batasWaktu: string;
  tanggalKembaliReal: string;
  quantity: number;
  photoUrl: string;
}

export function ViewProofButton({
  assetName,
  borrowerName,
  borrowerEmail,
  tanggalPinjam,
  batasWaktu,
  tanggalKembaliReal,
  quantity,
  photoUrl,
}: ViewProofButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs h-8 px-3 rounded-lg"
          />
        }
      >
        Lihat Bukti
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-white max-w-lg w-full shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            Bukti Fisik Pengembalian
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Visual check bukti fisik aset yang diunggah oleh Kajur saat barang dikembalikan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Proof Photo Display */}
          <div className="relative border border-white/10 rounded-xl overflow-hidden shadow-lg bg-zinc-900 flex justify-center items-center h-52">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Foto Bukti Fisik Pengembalian"
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
              />
            ) : (
              <div className="text-zinc-500 text-xs flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span>Foto bukti fisik tidak tersedia</span>
              </div>
            )}
          </div>

          {/* Details Table */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Aset</span>
              <span className="col-span-2 font-semibold text-zinc-100">{assetName}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Jumlah</span>
              <span className="col-span-2 text-zinc-200">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {quantity} Pcs
                </span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Peminjam</span>
              <span className="col-span-2 text-zinc-200">
                <p className="font-semibold text-zinc-100">{borrowerName}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{borrowerEmail}</p>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Peminjaman</span>
              <span className="col-span-2 text-zinc-400">
                <span>{tanggalPinjam} s.d. {batasWaktu}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Tanggal Kembali</span>
              <span className="col-span-2 font-semibold text-emerald-400">
                {tanggalKembaliReal}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-row gap-2 justify-end bg-transparent p-0 border-t-0 -mx-0 -mb-0">
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                className="hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl h-9 px-4 text-sm font-semibold transition-all border-0"
              />
            }
          >
            Tutup
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
