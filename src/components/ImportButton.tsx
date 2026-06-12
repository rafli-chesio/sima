"use client";

import { useState, useRef } from "react";
import { importKibExcel } from "@/app/actions/import";
import { useRouter } from "next/navigation";

export function ImportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsLoading(true);
    setErrorText(null);
    setSuccessCount(null);
    setStatusText("Mempersiapkan berkas Excel...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate step-by-step reading status for beautiful UX
      setTimeout(() => {
        setStatusText("Membaca sheet KIB A, B, dan C...");
      }, 800);

      setTimeout(() => {
        setStatusText("Memvalidasi ribuan baris data aset...");
      }, 1800);

      setTimeout(() => {
        setStatusText("Mengirim data ke database lokal (transaksi SQL)...");
      }, 2800);

      const res = await importKibExcel(formData);

      if (res.success && res.count) {
        setSuccessCount(res.count);
        setStatusText("Import Excel KIB selesai!");
        router.refresh();
      } else {
        setErrorText(res.error || "Gagal mengimpor berkas Excel.");
      }
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Terjadi kesalahan koneksi saat mengimpor.");
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCloseSuccess = () => {
    setSuccessCount(null);
    setErrorText(null);
    // Reload page to reflect fresh database data
    window.location.reload();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        className="hidden"
      />
      
      <button
        onClick={handleButtonClick}
        className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 print:hidden cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Import Excel KIB
      </button>

      {/* Modern Premium Glassmorphic Loading & Status Dialog */}
      {(isLoading || successCount !== null || errorText !== null) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          {/* Blur backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={!isLoading ? handleCloseSuccess : undefined}
          />
          
          <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 p-8 text-center animate-in zoom-in-95 duration-300">
            {isLoading && (
              <div className="space-y-6">
                {/* Glowing Spinner */}
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">Mengimpor Data Aset...</h3>
                  <p className="text-sm text-emerald-400 font-medium animate-pulse">{statusText}</p>
                </div>
                
                {/* Custom Elegant Progress bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: 
                        statusText.includes("Mempersiapkan") ? "20%" :
                        statusText.includes("Membaca") ? "45%" :
                        statusText.includes("Memvalidasi") ? "75%" : "90%"
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-500">Mohon jangan menutup halaman ini, proses KIB sekolah dapat memakan waktu beberapa detik karena volume data yang besar.</p>
              </div>
            )}

            {successCount !== null && (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                {/* Glowing Check */}
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">Impor Berhasil!</h3>
                  <p className="text-sm text-zinc-400">
                    Sistem berhasil memvalidasi dan memasukkan sebanyak{" "}
                    <span className="text-emerald-400 font-bold text-base bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {successCount.toLocaleString("id-ID")}
                    </span>{" "}
                    baris data aset dari berkas Excel Anda ke database.
                  </p>
                </div>

                <button
                  onClick={handleCloseSuccess}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
                >
                  Selesai & Muat Ulang
                </button>
              </div>
            )}

            {errorText !== null && (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                {/* Glowing Error */}
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">Impor Gagal</h3>
                  <div className="max-h-32 overflow-y-auto bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-left">
                    <p className="text-xs text-red-400 font-mono leading-relaxed whitespace-pre-wrap">{errorText}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setErrorText(null);
                      setSuccessCount(null);
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold py-3 px-6 rounded-xl border border-white/10 transition-all duration-300 cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleButtonClick}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
