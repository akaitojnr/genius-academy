"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const classLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];
const subjectOptions = [
  { slug: "physics", name: "Physics" },
  { slug: "chemistry", name: "Chemistry" },
  { slug: "biology", name: "Biology" },
  { slug: "further-mathematics", name: "Further Mathematics" },
  { slug: "mathematics", name: "Mathematics" },
  { slug: "english-language", name: "English Language" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    classLevel: "SS1",
    school: "",
    state: "",
    parentName: "",
    parentPhone: "",
  });
  const [subjects, setSubjects] = useState<string[]>([]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSubject(slug: string) {
    setSubjects((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, preferredSubjectSlugs: subjects }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-800">Create your student account</h1>
      <p className="mt-1 text-sm text-slate-600">Join BrightPath Academy in a few minutes.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Full name" required>
          <input required className="input" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
        </Field>
        <Field label="Email" required>
          <input required type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </Field>
        <Field label="Phone number" required>
          <input required className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </Field>
        <Field label="Password" required>
          <input required type="password" minLength={8} className="input" value={form.password} onChange={(e) => update("password", e.target.value)} />
        </Field>
        <Field label="Class" required>
          <select required className="input" value={form.classLevel} onChange={(e) => update("classLevel", e.target.value)}>
            {classLevels.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="School">
          <input className="input" value={form.school} onChange={(e) => update("school", e.target.value)} />
        </Field>
        <Field label="State">
          <input className="input" value={form.state} onChange={(e) => update("state", e.target.value)} />
        </Field>
        <Field label="Preferred subjects">
          <div className="grid grid-cols-2 gap-2">
            {subjectOptions.map((s) => (
              <label key={s.slug} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input type="checkbox" checked={subjects.includes(s.slug)} onChange={() => toggleSubject(s.slug)} />
                {s.name}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Parent/guardian name" required>
          <input required className="input" value={form.parentName} onChange={(e) => update("parentName", e.target.value)} />
        </Field>
        <Field label="Parent/guardian phone" required>
          <input required className="input" value={form.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} />
        </Field>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-700 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="font-medium text-brand-700">Log in</Link>
      </p>
      <p className="mt-1 text-center text-xs text-slate-500">
        Parent or guardian? <Link href="/register/parent" className="font-medium text-brand-700">Create a parent account</Link>
      </p>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          padding: 0.65rem 0.9rem;
          font-size: 0.95rem;
        }
        .input:focus {
          outline: 2px solid #0f766e;
          outline-offset: 1px;
        }
      `}</style>
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
