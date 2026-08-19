"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const classLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];
const difficulties = ["EASY", "MEDIUM", "HARD"];

type Subject = { id: string; name: string };
type Exam = {
  id: string;
  title: string;
  durationMin: number;
  subject: Subject | null;
  classLevel: string | null;
  _count: { examQuestions: number; attempts: number };
};

export default function ExamBuilder({ subjects, initialExams }: { subjects: Subject[]; initialExams: Exam[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classLevel, setClassLevel] = useState("SS1");
  const [difficulty, setDifficulty] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [questionCount, setQuestionCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subjectId: subjectId || undefined,
          classLevel: classLevel || undefined,
          difficulty: difficulty || undefined,
          durationMin: Number(durationMin),
          questionCount: Number(questionCount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not create exam");
        return;
      }
      setMessage(`Exam created with ${data.questionsAttached} questions.`);
      setTitle("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteExam(id: string) {
    if (!confirm("Delete this exam? Student attempts will also be removed.")) return;
    await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-6">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Create an exam</h2>
        <input
          required
          placeholder="Exam title (e.g. Physics SS1 First Term Test)"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Any subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={classLevel} onChange={(e) => setClassLevel(e.target.value)}>
            {classLevels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">Any difficulty</option>
            {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            Duration (min)
            <input
              type="number"
              min={5}
              max={180}
              className="w-20 rounded-xl border border-slate-200 px-2 py-2 text-sm"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            No. of questions
            <input
              type="number"
              min={1}
              max={100}
              className="w-20 rounded-xl border border-slate-200 px-2 py-2 text-sm"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
          </label>
        </div>

        {message && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create Exam"}
        </button>
      </form>

      <div className="mt-8 space-y-2">
        <h2 className="font-semibold">Existing Exams</h2>
        {initialExams.map((exam) => (
          <div key={exam.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div>
              <p className="font-medium">{exam.title}</p>
              <p className="text-xs text-slate-500">
                {exam.subject?.name ?? "Mixed"} · {exam.classLevel ?? "Any class"} · {exam._count.examQuestions} questions ·{" "}
                {exam.durationMin} min · {exam._count.attempts} attempts
              </p>
            </div>
            <button onClick={() => deleteExam(exam.id)} className="text-xs font-medium text-red-600 hover:underline">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
