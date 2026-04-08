"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function PlayerSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [value, setValue] = useState(searchParams.get("q") || "");
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedValue) {
      params.set("q", debouncedValue);
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedValue, pathname, router, searchParams]);

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input 
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher un joueur..." 
        className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-10 pr-10 text-white text-sm focus:ring-2 focus:ring-pickle-green/50 outline-none transition-all"
      />
      {value && (
        <button 
          onClick={() => setValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
