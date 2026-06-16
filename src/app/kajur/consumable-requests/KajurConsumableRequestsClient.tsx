"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestConsumable } from "@/app/actions/consumables";

interface ConsumableAsset {
  id: string;
  namaBarang: string;
  kodeUnik: string;
  quantity: number;
  merk?: string | null;
  location?: { namaLokasi: string } | null;
  jurusan?: { namaJurusan: string } | null;
}

interface RequestInstance {
  id: string;
  assetId: string;
  quantity: number;
  notes?: string | null;
  approvalStatus: string;
  rejectedReason?: string | null;
  createdAt: Date;
  asset: {
    namaBarang: string;
    kodeUnik: string;
  };
  approver?: {
    name: string;
  } | null;
}

export function KajurConsumableRequestsClient({
  consumables,
  requests,
}: {
  consumables: ConsumableAsset[];
  requests: RequestInstance[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(consumables[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Find currently selected asset to determine maximum stock limits
  const selectedAsset = consumables.find((c) => c.id === selectedAssetId);
  const maxQuantity = selectedAsset ? selectedAsset.quantity : 1;

  const handleOpenDialog = () => {
    if (consumables.length === 0) {
      alert("Tidak ada barang habis pakai dengan stok tersedia di jurusan Anda.");
      return;
    }
    setSelectedAssetId(consumables[0]?.id || "");
    setQuantity(1);
    setNotes("");
    setError(null);
    setIsOpen(true);
  };

  const handleAssetChange = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = consumables.find((c) => c.id === assetId);
    if (asset) {
      // Clamp quantity to the new asset's max quantity if necessary
      if (quantity > asset.quantity) {
        setQuantity(asset.quantity);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity <= 0) {
      setError("Jumlah barang harus minimal 1");
      return;
    }

    if (quantity > maxQuantity) {
      setError(`Jumlah barang melebihi stok yang tersedia (${maxQuantity})`);
      return;
    }

    startTransition(async () => {
      const res = await requestConsumable(selectedAssetId, quantity, notes);
      if (res.success) {
        setIsOpen(false);
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Permintaan Barang Habis Pakai
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ajukan permintaan spidol, kertas, alat kebersihan, dan barang consumable lainnya.
          </p>
        </div>
        <Button
          onClick={handleOpenDialog}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
        >
          Ajukan Permintaan
        </Button>
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Barang</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Jumlah</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Catatan Keperluan</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Tanggal Pengajuan</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Status</th>
                <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Belum ada pengajuan barang habis pakai.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {req.asset?.namaBarang}
                      </p>
                      <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 mt-1 inline-block">
                        {req.asset?.kodeUnik}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white font-mono">{req.quantity}</td>
                    <td className="px-6 py-4 text-zinc-300 max-w-xs truncate" title={req.notes || ""}>
                      {req.notes || "-"}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {new Date(req.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          req.approvalStatus === "PENDING"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            : req.approvalStatus === "APPROVED"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {req.approvalStatus === "PENDING"
                          ? "Menunggu"
                          : req.approvalStatus === "APPROVED"
                          ? "Disetujui"
                          : "Ditolak"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs max-w-xs break-words whitespace-normal">
                      {req.approvalStatus === "REJECTED" && (
                        <p className="text-red-400">
                          <span className="font-semibold">Alasan:</span> {req.rejectedReason || "-"}
                        </p>
                      )}
                      {req.approvalStatus === "APPROVED" && (
                        <p className="text-zinc-500">
                          Diproses oleh: <span className="font-semibold text-zinc-300">{req.approver?.name || "Admin"}</span>
                        </p>
                      )}
                      {req.approvalStatus === "PENDING" && (
                        <span className="text-zinc-500 italic">Menunggu review Admin Sarpras</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Ajukan Barang Habis Pakai</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Pilih Barang Habis Pakai
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => handleAssetChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
              >
                {consumables.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.namaBarang} ({item.kodeUnik}) - Stok: {item.quantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Jumlah Yang Diminta
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Tersedia: {maxQuantity} unit
                </span>
              </div>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setQuantity(val);
                }}
                min={1}
                max={maxQuantity}
                required
                className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Catatan / Keperluan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Kertas HVS untuk cetak modul ujian..."
                rows={3}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
              />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/5 text-zinc-300 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all px-6"
              >
                {isPending ? "Mengirim..." : "Kirim Permintaan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
