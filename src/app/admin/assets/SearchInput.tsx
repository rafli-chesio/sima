"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial value from URL
  const currentSearch = searchParams.get("search") || "";
  const [value, setValue] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);

  // Sync state during render if URL changes from outside
  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch);
    setValue(currentSearch);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentParams = new URLSearchParams(searchParams.toString());
      const currentSearch = currentParams.get("search") || "";
      
      if (value !== currentSearch) {
        if (value) {
          currentParams.set("search", value);
        } else {
          currentParams.delete("search");
        }
        // If search value changes, always reset page to 1
        currentParams.set("page", "1");
        
        router.push(`?${currentParams.toString()}`);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, router, searchParams]);

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
      <Input
        type="text"
        placeholder="Cari nama atau kode barang..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 bg-zinc-900/40 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus:ring-emerald-500/50 focus:border-emerald-500/50 h-10 w-full transition-all"
      />
    </div>
  );
}
