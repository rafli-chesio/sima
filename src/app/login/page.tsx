"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau password tidak valid");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] -z-10 pointer-events-none" />

      <div className="w-full max-w-md p-8 space-y-8 bg-card/40 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/5 relative z-10">
        <div className="text-center flex flex-col items-center">
          <img src="/Logosekolah.png" alt="Logo Sekolah" className="w-20 h-20 object-contain rounded-2xl bg-white p-2 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">SIMMA</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium tracking-wide">Sistem Manajemen Aset Sekolah</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-950/30 rounded-xl border border-red-900/30 text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2 group">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <input
              {...form.register("email")}
              id="email"
              type="email"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-zinc-600"
              placeholder="admin@simma.com"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2 group">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <input
              {...form.register("password")}
              id="password"
              type="password"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-zinc-600"
              placeholder="••••••••"
            />
            {form.formState.errors.password && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 mt-4 text-base font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-[1.02]" 
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Authenticating..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
