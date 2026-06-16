"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { approveConsumableRequest, rejectConsumableRequest } from "@/app/actions/consumables";

interface RequestInstance {
  id: string;
  assetId: string;
  quantity: number;
  notes?: string | null;
  approvalStatus: string;
  rejectedReason?: string | null;
  createdAt: Date;
  approvedAt?: Date | null;
  asset: {
    namaBarang: string;
    kodeUnik: string;
    quantity: number;
    jurusan?: { namaJurusan: string } | null;
    location?: { namaLokasi: string } | null;
  };
  requester: {
    name: string;
    email: string;
  };
  approver?: {
    name: string;
  } | null;
}

export function AdminConsumableRequestsClient({
  pendingRequests,
  processedRequests,
  isViewer = false,
}: {
  pendingRequests: RequestInstance[];
  processedRequests: RequestInstance[];
  isViewer?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menyetujui permintaan ini? Stok barang akan langsung berkurang.")) return;
    setError(null);
    startTransition(async () => {
      const res = await approveConsumableRequest(id);
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  const handleOpenReject = (id: string) => {
    setRejectRequestId(id);
    setRejectReason("");
    setError(null);
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setError("Alasan penolakan wajib diisi");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await rejectConsumableRequest(rejectRequestId, rejectReason);
      if (res.success) {
        setIsRejectOpen(false);
      } else {
        setError(res.message);
      }
    });
  };

  const tabs = [
    { id: "pending", label: "Menunggu Persetujuan", count: pendingRequests.length },
    { id: "history", label: "Riwayat", count: processedRequests.length },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Persetujuan Barang Habis Pakai
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tinjau pengajuan consumable dan kelola pendistribusian stok barang habis pakai sekolah.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/60 border border-white/5 rounded-2xl backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "pending" | "history")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 border ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] font-bold"
                  : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5 hover:border-white/5"
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 text-[10px] rounded font-mono font-bold ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/5 text-zinc-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "pending" ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Barang</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Pemohon</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Jumlah</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Catatan</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Tanggal Pengajuan</th>
                  {!isViewer && <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={isViewer ? 5 : 6} className="px-6 py-12 text-center text-zinc-500">
                      Tidak ada permintaan barang habis pakai yang menunggu persetujuan.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {req.asset?.namaBarang}
                        </p>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                            {req.asset?.kodeUnik}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {req.asset?.jurusan?.namaJurusan || "Umum"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{req.requester?.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{req.requester?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white">{req.quantity}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Stok: {req.asset?.quantity ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300 max-w-xs truncate" title={req.notes || ""}>
                        {req.notes || "-"}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-xs">
                        {new Date(req.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      {!isViewer && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            {req.asset && req.asset.quantity < req.quantity ? (
                              <span className="text-xs text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-xl border border-red-500/20 font-medium mr-2">
                                Stok tidak mencukupi (Sisa: {req.asset.quantity})
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleApprove(req.id)}
                                disabled={isPending}
                                className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 shadow-sm transition-all duration-300 rounded-xl"
                              >
                                Setujui
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOpenReject(req.id)}
                              disabled={isPending}
                              className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all duration-300 rounded-xl"
                            >
                              Tolak
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Barang</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Pemohon</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Jumlah</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Status</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Tanggal & Diproses</th>
                  <th className="px-6 py-4 font-semibold text-zinc-300 tracking-wider text-xs uppercase">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {processedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      Belum ada riwayat pemrosesan barang habis pakai.
                    </td>
                  </tr>
                ) : (
                  processedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {req.asset?.namaBarang}
                        </p>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                            {req.asset?.kodeUnik}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{req.requester?.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{req.requester?.email}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white">{req.quantity}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            req.approvalStatus === "APPROVED"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {req.approvalStatus === "APPROVED" ? "Disetujui" : "Ditolak"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400">
                        <p>
                          Proses:{" "}
                          {req.approvedAt
                            ? new Date(req.approvedAt).toLocaleDateString("id-ID")
                            : "-"}
                        </p>
                        <p className="text-zinc-500 mt-1">
                          Oleh: <span className="font-medium text-zinc-400">{req.approver?.name || "Admin"}</span>
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs break-words whitespace-normal">
                        {req.approvalStatus === "REJECTED" ? (
                          <p className="text-red-400 font-medium">
                            Alasan ditolak: <span className="text-zinc-300 font-normal">{req.rejectedReason || "-"}</span>
                          </p>
                        ) : (
                          <p className="text-zinc-500 italic">Berhasil didistribusikan & stok dikurangi</p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Tolak Permintaan Consumable</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRejectSubmit} className="space-y-4 pt-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Alasan Penolakan
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                rows={4}
                required
                className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm"
              />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRejectOpen(false)}
                className="hover:bg-white/5 text-zinc-300 rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all px-6"
              >
                {isPending ? "Mengirim..." : "Tolak Pengajuan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
