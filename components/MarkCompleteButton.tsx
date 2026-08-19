"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function MarkCompleteButton({
  lessonId,
  initiallyCompleted,
}: {
  lessonId: string;
  initiallyCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !completed;
    setCompleted(next); // optimistic
    try {
      const res = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh(); // refreshes progress bars elsewhere on the page/dashboard
    } catch {
      setCompleted(!next); // revert on failure
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
        completed
          ? "bg-brand-50 text-brand-700 border border-brand-200"
          : "bg-brand-700 text-white hover:bg-brand-800"
      }`}
    >
      <CheckCircle2 size={18} />
      {completed ? "Completed" : "Mark as Completed"}
    </button>
  );
}
