"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const classLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

type LiveClass = {
  id: string;
  subjectName: string;
  topic: string;
  classLevel: string;
  description: string | null;
  scheduledAt: string;
  meetingLink: string;
  recordingUrl: string | null;
};

export default function LiveClassManager({ initialLiveClasses }: { initialLiveClasses: LiveClass[] }) {
  const router = useRouter();
  const [subjectName, setSubjectName] = useState("");
  const [topic, setTopic] = useState("");
  const [classLevel, setClassLevel] = useState("SS1");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/teacher/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName,
          topic,
          classLevel,
          description: description || undefined,
          scheduledAt: new Date(scheduledAt).toISOString(),
          meetingLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not schedule class");
        return;
      }
      setMessage("Live class scheduled.");
      setTopic("");
      setDescription("");
      setMeetingLink("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function addRecording(id: string) {
    const url = prompt("Paste the recording URL:");
    if (!url) return;
    await fetch(`/api/teacher/live-classes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordingUrl: url }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this live class?")) return;
    await fetch(`/api/teacher/live-classes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-6">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Schedule a live class</h2>
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Subject (e.g. Physics)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={classLevel} onChange={(e) => setClassLevel(e.target.value)}>
            {classLevels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <input required placeholder="Topic" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <textarea placeholder="Description" rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input required type="datetime-local" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <input required type="url" placeholder="Zoom/Meet link" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
        </div>
        {message && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{message}</p>}
        <button type="submit" disabled={loading} className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {loading ? "Scheduling…" : "Schedule Class"}
        </button>
      </form>

      <div className="mt-8 space-y-2">
        <h2 className="font-semibold">Your Live Classes</h2>
        {initialLiveClasses.map((lc) => {
          const start = new Date(lc.scheduledAt);
          const isLive = Math.abs(Date.now() - start.getTime()) < 60 * 60 * 1000 && Date.now() >= start.getTime();
          const isPast = Date.now() > start.getTime() + 60 * 60 * 1000;
          return (
            <div key={lc.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {lc.subjectName} — {lc.topic} {isLive && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">LIVE NOW</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lc.classLevel} · {start.toLocaleString()}
                  </p>
                </div>
                <button onClick={() => remove(lc.id)} className="shrink-0 text-xs font-medium text-red-600 hover:underline">
                  Delete
                </button>
              </div>
              {isPast && !lc.recordingUrl && (
                <button onClick={() => addRecording(lc.id)} className="mt-2 text-xs font-medium text-brand-700 hover:underline">
                  + Add recording link
                </button>
              )}
              {lc.recordingUrl && <p className="mt-2 text-xs text-brand-700">Recording added ✓</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
