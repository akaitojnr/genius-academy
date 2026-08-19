"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const classLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];
const terms = ["FIRST", "SECOND", "THIRD"];

type Subject = { id: string; name: string; slug: string };
type Lesson = { id: string; title: string; isPublished: boolean };
type Topic = { id: string; title: string; term: string; lessons: Lesson[] };
type Course = { id: string; classLevel: string; subject: Subject; topics: Topic[] };

export default function ContentManager({ subjects, courses }: { subjects: Subject[]; courses: Course[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"subject" | "course" | "topic" | "lesson">("subject");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function post(url: string, body: any) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Something went wrong");
        return;
      }
      setMessage("Saved successfully.");
      router.refresh();
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex gap-2 border-b border-slate-200">
        {(["subject", "course", "topic", "lesson"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-b-2 border-brand-700 text-brand-700" : "text-slate-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {message && <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{message}</p>}

      <div className="mt-6">
        {tab === "subject" && (
          <Form
            fields={[
              { name: "name", label: "Subject name", required: true },
              { name: "slug", label: "Slug (e.g. physics)", required: true },
              { name: "description", label: "Description" },
            ]}
            onSubmit={(values) => post("/api/admin/subjects", values)}
            loading={loading}
          />
        )}

        {tab === "course" && (
          <Form
            fields={[
              { name: "subjectId", label: "Subject", type: "select", options: subjects.map((s) => ({ value: s.id, label: s.name })), required: true },
              { name: "classLevel", label: "Class", type: "select", options: classLevels.map((c) => ({ value: c, label: c })), required: true },
              { name: "title", label: "Course title", required: true },
              { name: "description", label: "Description" },
            ]}
            onSubmit={(values) => post("/api/admin/courses", { ...values, isPublished: true })}
            loading={loading}
          />
        )}

        {tab === "topic" && (
          <Form
            fields={[
              {
                name: "courseId",
                label: "Course",
                type: "select",
                options: courses.map((c) => ({ value: c.id, label: `${c.subject.name} — ${c.classLevel}` })),
                required: true,
              },
              { name: "term", label: "Term", type: "select", options: terms.map((t) => ({ value: t, label: t })), required: true },
              { name: "title", label: "Topic title", required: true },
            ]}
            onSubmit={(values) => post("/api/admin/topics", { ...values, order: 0 })}
            loading={loading}
          />
        )}

        {tab === "lesson" && (
          <Form
            fields={[
              {
                name: "topicId",
                label: "Topic",
                type: "select",
                options: courses.flatMap((c) => c.topics.map((t) => ({ value: t.id, label: `${c.subject.name} ${c.classLevel} — ${t.title}` }))),
                required: true,
              },
              { name: "title", label: "Lesson title", required: true },
              { name: "objectives", label: "Learning objectives", textarea: true },
              { name: "introduction", label: "Introduction", textarea: true },
              { name: "explanation", label: "Detailed explanation", textarea: true },
              { name: "definitions", label: "Definitions", textarea: true },
              { name: "workedExamples", label: "Worked examples / step-by-step solutions", textarea: true },
              { name: "realLifeApplications", label: "Real-life applications", textarea: true },
              { name: "commonMistakes", label: "Common mistakes", textarea: true },
              { name: "summary", label: "Summary", textarea: true },
              { name: "practiceQuestions", label: "Practice questions", textarea: true },
              { name: "videoUrl", label: "Video URL (optional)" },
              { name: "teacherName", label: "Teacher name (for video credit)" },
            ]}
            onSubmit={(values) => {
              const { videoUrl, teacherName, ...rest } = values;
              post("/api/admin/lessons", {
                ...rest,
                order: 0,
                isPublished: true,
                ...(videoUrl ? { video: { url: videoUrl, teacherName } } : {}),
              });
            }}
            loading={loading}
          />
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-2 font-semibold">Existing Courses</h2>
        <div className="space-y-2 text-sm">
          {courses.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="font-medium">{c.subject.name} — {c.classLevel}</p>
              <p className="text-xs text-slate-500">
                {c.topics.length} topics · {c.topics.reduce((n, t) => n + t.lessons.length, 0)} lessons
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type FieldDef = {
  name: string;
  label: string;
  required?: boolean;
  textarea?: boolean;
  type?: "select";
  options?: { value: string; label: string }[];
};

function Form({
  fields,
  onSubmit,
  loading,
}: {
  fields: FieldDef[];
  onSubmit: (values: Record<string, string>) => void;
  loading: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-3"
    >
      {fields.map((f) => (
        <label key={f.name} className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            {f.label} {f.required && <span className="text-red-500">*</span>}
          </span>
          {f.type === "select" ? (
            <select
              required={f.required}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            >
              <option value="" disabled>Select…</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : f.textarea ? (
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
          ) : (
            <input
              required={f.required}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
          )}
        </label>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
