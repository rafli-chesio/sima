import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { NotificationBell } from "@/components/NotificationBell";
import { redirect } from "next/navigation";

export default async function KajurLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "KAJUR") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Glassmorphism Sidebar */}
      <aside className="w-64 bg-sidebar backdrop-blur-xl border-r border-sidebar-border p-6 flex flex-col h-screen z-10 shadow-2xl shrink-0">
        <div className="mb-8 flex items-center gap-3">
          <img src="/Logosekolah.png" alt="Logo Sekolah" className="w-14 h-14 object-contain rounded-xl bg-white p-1" />
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-zinc-800 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">SIMMA</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-6">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Main</p>
            <Link href="/dashboard" className="block px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-zinc-800/5 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white transition-all duration-300 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Dashboard</span>
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Operations</p>
            {[
              { href: "/kajur/assets", label: "Cari Aset" },
              { href: "/kajur/requests", label: "Riwayat Peminjaman" },
            ].map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-zinc-800/5 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-auto border-t border-border pt-6">
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <Button type="submit" variant="destructive" className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all duration-300">
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto relative z-0 flex flex-col">
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 py-3 px-8 flex justify-between items-center transition-all duration-300 shadow-sm">

          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-white/10 pl-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-foreground">{session?.user?.name}</span>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

