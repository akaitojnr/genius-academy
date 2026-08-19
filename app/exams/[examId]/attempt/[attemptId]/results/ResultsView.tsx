"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

type ReviewItem = {
  questionId: string;
  text: string;
  selectedLabel: string | null;
  correctLabel: string | null;
  isCorrect: boolean | null;
  explanation: string | null;
  topic: string | null;
  recommendedLessonId: string | null;
  options: { label: string; text: string }[];
};

type Results = {
  examTitle: string;
  subject: string | null;
  score: number;
  total: number;
  percent: number;
  grade: string;
  timeUsedSec: number | null;
  review: ReviewItem[];
};

export default function ResultsView({ attemptId }: { attemptId: string }) {
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/exams/attempts/${attemptId}/results`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setResults(data);
      });
  }, [attemptId]);

  if (error) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-red-600">{error}</main>;
  }
  if (!results) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">Loading results…</main>;
  }

  const wrongCount = results.review.filter((r) => r.isCorrect === false && r.selectedLabel).length;
  const unansweredCount = results.review.filter((r) => !r.selectedLabel).length;
  const minutes = results.timeUsedSec ? Math.floor(results.timeUsedSec / 60) : 0;
  const seconds = results.timeUsedSec ? results.timeUsedSec % 60 : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">{results.examTitle}{results.subject ? ` · ${results.subject}` : ""}</p>
        <p className="mt-2 text-4xl font-extrabold text-brand-800">
          Your Score: {results.score}/{results.total}
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-700">{results.percent}% · Grade {results.grade}</p>
        <p className="mt-1 text-xs text-slate-400">
          Time used: {minutes}m {seconds}s
        </p>

        <div className="mt-4 flex justify-center gap-6 text-sm">
          <span className="flex items-center gap-1 text-brand-700">
            <CheckCircle2 size={16} /> {results.score} correct
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <XCircle size={16} /> {wrongCount} wrong
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <MinusCircle size={16} /> {unansweredCount} unanswered
          </span>
        </div>

        <Link
          href="/exams"
          className="mt-6 inline-block rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Back to CBT Practice
        </Link>
      </div>

      <h2 className="mt-8 mb-3 font-semibold">Answer Review</h2>
      <div className="space-y-4">
        {results.review.map((item, i) => (
          <div key={item.questionId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-900">
                {i + 1}. {item.text}
              </p>
              {item.isCorrect ? (
                <CheckCircle2 size={18} className="shrink-0 text-brand-600" />
              ) : item.selectedLabel ? (
                <XCircle size={18} className="shrink-0 text-red-500" />
              ) : (
                <MinusCircle size={18} className="shrink-0 text-slate-400" />
              )}
            </div>

            <div className="mt-3 space-y-1.5">
              {item.options.map((opt) => {
                const isSelected = item.selectedLabel === opt.label;
                const isCorrectOpt = item.correctLabel === opt.label;
                return (
                  <div
                    key={opt.label}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      isCorrectOpt
                        ? "border-brand-500 bg-brand-50"
                        : isSelected
                        ? "border-red-300 bg-red-50"
                        : "border-slate-100"
                    }`}
                  >
                    <span className="font-semibold">{opt.label}.</span> {opt.text}
                    {isCorrectOpt && <span className="ml-2 text-xs font-medium text-brand-700">Correct answer</span>}
                    {isSelected && !isCorrectOpt && <span className="ml-2 text-xs font-medium text-red-600">Your answer</span>}
                  </div>
                );
              })}
            </div>

            {item.explanation && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-semibold">Explanation: </span>
                {item.explanation}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>{item.topic ? `Topic: ${item.topic}` : ""}</span>
              {!item.isCorrect && item.recommendedLessonId && (
                <Link href={`/lessons/${item.recommendedLessonId}`} className="font-medium text-brand-700 hover:underline">
                  Review this topic →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
