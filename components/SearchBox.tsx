"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search subjects, topics, lessons, teachers…"
        className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
      />
    </form>
  );
}
