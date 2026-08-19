"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Subject = { id: string; name: string };
type Teacher = {
  id: string;
  fullName: string;
  user: { email: string };
  subjects: Subject[];
  _count: { courses: number; liveClasses: number };
};

export default function TeacherManager({ subjects, initialTeachers }: { subjects: Subject[]; initialTeachers: Teacher[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleSubject(id: string) {
    setSubjectIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, subjectIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not create teacher");
        return;
      }
      setMessage("Teacher account created.");
      setFullName("");
      setEmail("");
      setPassword("");
      setSubjectIds([]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Add a teacher</h2>
        <input required placeholder="Full name" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input required type="email" placeholder="Email" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input required type="password" minLength={8} placeholder="Temporary password" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          {subjects.map((s) => (
            <label key={s.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input type="checkbox" checked={subjectIds.includes(s.id)} onChange={() => toggleSubject(s.id)} />
              {s.name}
            </label>
          ))}
        </div>
        {message && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{message}</p>}
        <button type="submit" disabled={loading} className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {loading ? "Creating…" : "Create Teacher"}
        </button>
      </form>

      <div className="mt-8 space-y-2">
        <h2 className="font-semibold">Teachers ({initialTeachers.length})</h2>
        {initialTeachers.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div>
              <p className="font-medium">{t.fullName}</p>
              <p className="text-xs text-slate-500">
                {t.user.email} · {t.subjects.map((s) => s.name).join(", ") || "No subjects assigned"} · {t._count.courses} courses · {t._count.liveClasses} live classes
              </p>
            </div>
            <button
              onClick={async () => {
                const newPass = prompt(`Set new password for ${t.user.email}:`, "Admin@2026");
                if (!newPass) return;
                const res = await fetch("/api/admin/users/reset-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: t.user.email, newPassword: newPass }),
                });
                const data = await res.json();
                alert(res.ok ? data.message : data.error || "Reset failed");
              }}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              🔑 Reset Password
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
