import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { NotificationBell } from "@/components/NotificationBell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen">
      {/* Glassmorphism Sidebar */}
      <aside className="w-64 bg-sidebar backdrop-blur-xl border-r border-sidebar-border p-6 flex flex-col h-screen sticky top-0 shadow-2xl z-10">
        <div className="mb-8 flex items-center gap-3">
          <img src="/Logosekolah.png" alt="Logo Sekolah" className="w-14 h-14 object-contain rounded-xl bg-white p-1" />
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">SIMMA</h1>
            <p className="text-xs text-primary font-medium tracking-wider">ADMIN PANEL</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Main</p>
            <Link href="/dashboard" className="block px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all duration-300 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Dashboard</span>
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Master Data</p>
            {[
              { href: "/admin/locations", label: "Lokasi" },
              { href: "/admin/jurusan", label: "Jurusan" },
              { href: "/admin/users", label: "Pengguna" },
            ].map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Inventory</p>
            <Link href="/admin/assets" className="block px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all duration-300 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Aset</span>
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Transactions</p>
            <Link href="/admin/requests" className="block px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all duration-300 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Peminjaman</span>
            </Link>
          </div>
        </nav>

        <div className="mt-auto border-t border-border pt-6">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold text-white">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
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
      <main className="flex-1 overflow-y-auto relative z-0">
        <header className="sticky top-0 z-20 w-full bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex justify-end px-8">
          <NotificationBell />
        </header>
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
