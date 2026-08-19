"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/teacher/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, audience }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not send announcement");
        return;
      }
      setMessage("Announcement sent.");
      setTitle("");
      setBody("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <input required placeholder="Title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea required placeholder="Message" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={audience} onChange={(e) => setAudience(e.target.value)}>
        <option value="STUDENT">All Students</option>
        <option value="PARENT">All Parents</option>
      </select>
      {message && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{message}</p>}
      <button type="submit" disabled={loading} className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
        {loading ? "Sending…" : "Send Announcement"}
      </button>
    </form>
  );
}
