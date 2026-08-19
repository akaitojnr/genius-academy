"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Submission = {
  id: string;
  student: { fullName: string };
  content: string | null;
  fileUrl: string | null;
  submittedAt: string | Date;
  score: number | null;
  feedback: string | null;
};
type Assignment = {
  id: string;
  title: string;
  instructions: string;
  dueDate: string | Date;
  submissions: Submission[];
};

export default function AssignmentManager({ initialAssignments }: { initialAssignments: Assignment[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, instructions, dueDate: new Date(dueDate).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not create assignment");
        return;
      }
      setMessage("Assignment created.");
      setTitle("");
      setInstructions("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function grade(assignmentId: string, submissionId: string) {
    const score = prompt("Score (0-100):");
    if (score === null) return;
    const feedback = prompt("Feedback (optional):") || undefined;
    await fetch(`/api/teacher/assignments/${assignmentId}/submissions/${submissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(score), feedback }),
    });
    router.refresh();
  }

  return (
    <div className="mt-6">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Create an assignment</h2>
        <input required placeholder="Title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea required placeholder="Instructions" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        <input required type="datetime-local" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        {message && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{message}</p>}
        <button type="submit" disabled={loading} className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {loading ? "Creating…" : "Create Assignment"}
        </button>
      </form>

      <div className="mt-8 space-y-3">
        <h2 className="font-semibold">Your Assignments</h2>
        {initialAssignments.map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <button className="flex w-full items-center justify-between text-left" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-slate-500">
                  Due {new Date(a.dueDate).toLocaleDateString()} · {a.submissions.length} submission(s)
                </p>
              </div>
              <span className="text-xs text-brand-700">{expanded === a.id ? "Hide" : "View"}</span>
            </button>

            {expanded === a.id && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {a.submissions.length === 0 && <p className="text-xs text-slate-400">No submissions yet.</p>}
                {a.submissions.map((s) => (
                  <div key={s.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{s.student.fullName}</p>
                      {s.score !== null ? (
                        <span className="text-xs font-semibold text-brand-700">Graded: {s.score}/100</span>
                      ) : (
                        <button onClick={() => grade(a.id, s.id)} className="text-xs font-medium text-brand-700 hover:underline">
                          Grade
                        </button>
                      )}
                    </div>
                    {s.content && <p className="mt-1 text-xs text-slate-600">{s.content}</p>}
                    {s.fileUrl && (
                      <a href={s.fileUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-brand-700 underline">
                        View submitted file
                      </a>
                    )}
                    {s.feedback && <p className="mt-1 text-xs italic text-slate-500">Feedback: {s.feedback}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
