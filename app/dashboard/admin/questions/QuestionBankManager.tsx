"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const classLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];
const terms = ["FIRST", "SECOND", "THIRD"];
const difficulties = ["EASY", "MEDIUM", "HARD"];

type Subject = { id: string; name: string };
type Topic = { id: string; title: string; course: { subject: Subject } };
type Option = { label: string; text: string; isCorrect: boolean };
type Question = {
  id: string;
  text: string;
  difficulty: string;
  classLevel: string;
  subject: Subject;
  topic: { title: string } | null;
  options: Option[];
};

export default function QuestionBankManager({
  subjects,
  topics,
  initialQuestions,
}: {
  subjects: Subject[];
  topics: Topic[];
  initialQuestions: Question[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [classLevel, setClassLevel] = useState("SS1");
  const [term, setTerm] = useState("FIRST");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [text, setText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<Option[]>([
    { label: "A", text: "", isCorrect: true },
    { label: "B", text: "", isCorrect: false },
    { label: "C", text: "", isCorrect: false },
    { label: "D", text: "", isCorrect: false },
  ]);

  function updateOption(label: string, text: string) {
    setOptions((opts) => opts.map((o) => (o.label === label ? { ...o, text } : o)));
  }

  function setCorrect(label: string) {
    setOptions((opts) => opts.map((o) => ({ ...o, isCorrect: o.label === label })));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          topicId: topicId || undefined,
          classLevel,
          term,
          difficulty,
          text,
          explanation: explanation || undefined,
          options,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not save question");
        return;
      }
      setMessage("Question added.");
      setText("");
      setExplanation("");
      setOptions(options.map((o) => ({ ...o, text: "", isCorrect: o.label === "A" })));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-6">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Add a question</h2>
        <div className="grid grid-cols-2 gap-3">
          <select required className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="" disabled>Subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">Topic (optional)…</option>
            {topics.filter((t) => t.course.subject.id === subjectId).map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={classLevel} onChange={(e) => setClassLevel(e.target.value)}>
            {classLevels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={term} onChange={(e) => setTerm(e.target.value)}>
            {terms.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <textarea
          required
          placeholder="Question text"
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt.label} className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs font-semibold">
                <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setCorrect(opt.label)} />
                {opt.label}
              </label>
              <input
                required
                placeholder={`Option ${opt.label}`}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={opt.text}
                onChange={(e) => updateOption(opt.label, e.target.value)}
              />
            </div>
          ))}
          <p className="text-xs text-slate-400">Select the radio button next to the correct option.</p>
        </div>

        <textarea
          placeholder="Explanation (shown after submission)"
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />

        {message && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Add Question"}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="mb-2 font-semibold">Questions ({initialQuestions.length})</h2>
        <div className="space-y-2">
          {initialQuestions.map((q) => (
            <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{q.text}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {q.subject.name} · {q.classLevel} · {q.difficulty} {q.topic ? `· ${q.topic.title}` : ""}
                  </p>
                </div>
                <button onClick={() => deleteQuestion(q.id)} className="shrink-0 text-xs font-medium text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
