"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartExamButton({ examId }: { examId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch(`/api/exams/${examId}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not start exam");
        return;
      }
      router.push(`/exams/${examId}/attempt/${data.attemptId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className="shrink-0 rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
    >
      {loading ? "Starting…" : "Start Exam"}
    </button>
  );
}
