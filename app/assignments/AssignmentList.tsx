"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Submission = {
  content: string | null;
  fileUrl: string | null;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
};
type Assignment = {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  teacherName: string;
  submission: Submission | null;
};

export default function AssignmentList({ assignments }: { assignments: Assignment[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(assignmentId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content || undefined, fileUrl: fileUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not submit");
        return;
      }
      setContent("");
      setFileUrl("");
      setOpenId(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {assignments.map((a) => {
        const overdue = new Date(a.dueDate).getTime() < Date.now() && !a.submission;
        const status = a.submission?.score !== null && a.submission?.score !== undefined
          ? "Graded"
          : a.submission
          ? "Submitted"
          : overdue
          ? "Overdue"
          : "Pending";

        const statusColor =
          status === "Graded"
            ? "bg-brand-50 text-brand-700"
            : status === "Submitted"
            ? "bg-blue-50 text-blue-700"
            : status === "Overdue"
            ? "bg-red-50 text-red-700"
            : "bg-amber-50 text-amber-700";

        return (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-slate-500">
                  {a.teacherName} · Due {new Date(a.dueDate).toLocaleDateString()}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>{status}</span>
            </div>

            <p className="mt-2 text-sm text-slate-600">{a.instructions}</p>

            {a.submission?.score !== null && a.submission?.score !== undefined && (
              <p className="mt-2 text-sm font-semibold text-brand-700">Score: {a.submission.score}/100</p>
            )}
            {a.submission?.feedback && <p className="mt-1 text-xs italic text-slate-500">Feedback: {a.submission.feedback}</p>}

            {openId === a.id ? (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <textarea
                  placeholder="Type your answer here…"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <input
                  type="url"
                  placeholder="Or paste a link to your file (Google Drive, etc.)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submit(a.id)}
                    disabled={loading}
                    className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                  >
                    {loading ? "Submitting…" : a.submission ? "Resubmit" : "Submit"}
                  </button>
                  <button onClick={() => setOpenId(null)} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setOpenId(a.id)} className="mt-3 text-sm font-medium text-brand-700 hover:underline">
                {a.submission ? "View / Resubmit" : "Submit Assignment"}
              </button>
            )}
          </div>
        );
      })}

      {assignments.length === 0 && <p className="text-sm text-slate-500">No assignments yet.</p>}
    </div>
  );
}
