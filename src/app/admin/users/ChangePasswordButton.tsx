"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserPassword } from "@/app/actions/users";
import { KeyIcon, Loader2 } from "lucide-react";

interface ChangePasswordButtonProps {
  userId: string;
  userName: string;
}

export function ChangePasswordButton({ userId, userName }: ChangePasswordButtonProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password baru dan konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserPassword(userId, password);
      if (res.success) {
        setSuccess(res.message);
        setPassword("");
        setConfirmPassword("");
        // Close modal after a brief delay
        setTimeout(() => {
          setOpen(false);
          setSuccess("");
        }, 1200);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all text-xs">
            <KeyIcon className="h-3 w-3" />
            Password
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-zinc-950 border border-zinc-800 text-white rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
            <KeyIcon className="h-5 w-5 text-yellow-500" />
            Ubah Password
          </DialogTitle>
          <div className="text-xs text-zinc-400 mt-1">
            Mengubah password untuk pengguna: <strong className="text-zinc-200">{userName}</strong>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Password Baru</label>
            <Input
              type="password"
              placeholder="Masukkan password baru (min. 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-800 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Konfirmasi Password Baru</label>
            <Input
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-800 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl">{error}</p>}
          {success && <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl">{success}</p>}

          <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-zinc-900 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-zinc-400 hover:text-white"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
