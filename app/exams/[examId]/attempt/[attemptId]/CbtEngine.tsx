"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  index: number;
  questionId: string;
  text: string;
  difficulty: string;
  options: { label: string; text: string }[];
};

export default function CbtEngine({ examId, attemptId }: { examId: string; attemptId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load attempt state once.
  useEffect(() => {
    fetch(`/api/exams/attempts/${attemptId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          router.push("/exams");
          return;
        }
        setExamTitle(data.attempt.examTitle);
        setQuestions(data.questions);
        setAnswers(data.answers);
        const elapsed = (Date.now() - new Date(data.attempt.startedAt).getTime()) / 1000;
        const totalSec = data.attempt.durationMin * 60;
        setSecondsLeft(Math.max(0, Math.round(totalSec - elapsed)));
        setLoading(false);
      });
  }, [attemptId, router]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/attempts/${attemptId}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not submit exam");
        setSubmitting(false);
        return;
      }
      router.push(`/exams/${examId}/attempt/${attemptId}/results`);
    } catch {
      setSubmitting(false);
    }
  }, [attemptId, examId, router]);

  // Countdown timer — auto-submits at zero.
  useEffect(() => {
    if (secondsLeft === null || submitting) return;
    if (secondsLeft <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, submitting, submit]);

  async function selectAnswer(questionId: string, label: string) {
    setAnswers((a) => ({ ...a, [questionId]: label }));
    fetch(`/api/exams/attempts/${attemptId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selectedLabel: label }),
    }).catch(() => {});
  }

  const answeredCount = Object.keys(answers).length;
  const timeDisplay = useMemo(() => {
    if (secondsLeft === null) return "--:--";
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [secondsLeft]);

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">Loading exam…</main>;
  }

  const q = questions[current];
  const isLastQuestion = current === questions.length - 1;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 pb-28">
      {/* Header: title + timer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold">{examTitle}</h1>
          <p className="text-xs text-slate-500">
            Question {current + 1} of {questions.length} · {answeredCount} answered
          </p>
        </div>
        <div
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            secondsLeft !== null && secondsLeft < 60 ? "bg-red-100 text-red-700" : "bg-brand-50 text-brand-800"
          }`}
        >
          ⏱ {timeDisplay}
        </div>
      </div>

      {/* Question number panel */}
      <div className="mt-4 grid grid-cols-8 gap-1.5 sm:grid-cols-10">
        {questions.map((qq, i) => {
          const answered = !!answers[qq.questionId];
          const isCurrent = i === current;
          return (
            <button
              key={qq.questionId}
              onClick={() => setCurrent(i)}
              className={`flex h-8 items-center justify-center rounded-lg text-xs font-medium ${
                isCurrent
                  ? "bg-brand-700 text-white"
                  : answered
                  ? "bg-brand-100 text-brand-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Current question */}
      {q && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{q.difficulty}</p>
          <p className="mt-1 font-medium text-slate-900">{q.text}</p>

          <div className="mt-4 space-y-2">
            {q.options.map((opt) => {
              const selected = answers[q.questionId] === opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => selectAnswer(q.questionId, opt.label)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                    selected ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-brand-300"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      selected ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Prev/Next + Submit */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={() => {
                if (answeredCount < questions.length) {
                  const proceed = confirm(
                    `You have ${questions.length - answeredCount} unanswered question(s). Submit anyway?`
                  );
                  if (!proceed) return;
                }
                submit();
              }}
              disabled={submitting}
              className="rounded-full bg-brand-700 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Examination"}
            </button>
          ) : (
            <button
              onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              className="rounded-full bg-brand-700 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
