"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function YearFilter({ years }: { years: number[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = searchParams.get("tahun") || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const currentParams = new URLSearchParams(searchParams.toString());

    if (value) {
      currentParams.set("tahun", value);
    } else {
      currentParams.delete("tahun");
    }
    // Reset page to 1 when filter changes
    currentParams.set("page", "1");

    router.push(`?${currentParams.toString()}`);
  };

  return (
    <div className="flex items-center">
      <select
        value={currentYear}
        onChange={handleChange}
        className="px-3.5 h-10 bg-zinc-900/60 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium cursor-pointer"
      >
        <option value="">Semua Tahun</option>
        {years.map((year) => (
          <option key={year} value={year.toString()}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
