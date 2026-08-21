"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const classLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];
const terms = ["FIRST", "SECOND", "THIRD"];

type Subject = { id: string; name: string; slug: string };
type Video = { url: string; teacherName?: string | null };
type Lesson = {
  id: string;
  title: string;
  isPublished: boolean;
  objectives?: string | null;
  introduction?: string | null;
  explanation?: string | null;
  definitions?: string | null;
  workedExamples?: string | null;
  realLifeApplications?: string | null;
  commonMistakes?: string | null;
  summary?: string | null;
  practiceQuestions?: string | null;
  video?: Video | null;
};
type Topic = { id: string; title: string; term: string; lessons: Lesson[] };
type Course = { id: string; classLevel: string; subject: Subject; topics: Topic[] };

export default function ContentManager({ subjects, courses }: { subjects: Subject[]; courses: Course[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"subject" | "course" | "topic" | "lesson" | "doc-import">("subject");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Expanded courses state
  const [expandedCourseIds, setExpandedCourseIds] = useState<string[]>(courses.map((c) => c.id));

  // Document Import state
  const [importTopicId, setImportTopicId] = useState("");
  const [importParsing, setImportParsing] = useState(false);
  const [importHtml, setImportHtml] = useState(""); // Full HTML extracted from Word/PDF
  const [parsedLesson, setParsedLesson] = useState<Record<string, string>>({});

  // Direct document parser: extracts lesson title and keeps 100% of Word document HTML intact
  function parseDocumentHtml(html: string): Record<string, string> {
    let title = "";

    // Extract title from <h1>, <p><strong>Title: ...</strong></p>, or Title: line
    const titleMatch = html.match(/(?:<h1[^>]*>(.*?)<\/h1>|<p>\s*<(?:strong|b)>\s*Title:\s*(.*?)\s*<\/(?:strong|b)>\s*<\/p>|Title:\s*([^\n<]+))/i);
    if (titleMatch) {
      title = (titleMatch[1] || titleMatch[2] || titleMatch[3] || "").replace(/<[^>]+>/g, "").trim();
    }

    // Clean title tag out of body HTML if present to prevent repeating title
    let bodyHtml = html;
    if (titleMatch && titleMatch[0]) {
      bodyHtml = html.replace(titleMatch[0], "").trim();
    }

    return {
      title: title || "",
      objectives: "",
      introduction: "",
      definitions: "",
      explanation: bodyHtml || html, // 100% of Word document content preserved exactly as formatted
      workedExamples: "",
      realLifeApplications: "",
      commonMistakes: "",
      summary: "",
      practiceQuestions: "",
    };
  }

  async function handleFileUpload(file: File) {
    setImportParsing(true);
    setImportHtml("");
    setParsedLesson({});

    try {
      let html = "";
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "docx") {
        try {
          const mammoth = await import("mammoth");
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml(
            { arrayBuffer },
            { convertImage: mammoth.images.dataUri }
          );
          html = result.value;
        } catch (clientErr) {
          console.warn("Client mammoth parse failed, falling back to server...", clientErr);
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/admin/parse-document", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Server failed to parse DOCX.");
          html = data.content;
        }
      } else if (ext === "pdf") {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/parse-document", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to parse PDF file.");
        html = data.content
          .split("\n")
          .map((line: string) => (line.trim() ? `<p>${line.trim()}</p>` : ""))
          .join("\n");
      } else {
        const text = await file.text();
        html = text
          .split("\n")
          .map((line: string) => (line.trim() ? `<p>${line.trim()}</p>` : ""))
          .join("\n");
      }

      setImportHtml(html);
      const parsed = parseDocumentHtml(html);
      setParsedLesson(parsed);
    } catch (err: any) {
      console.error("Document import error:", err);
      alert(`Error reading file: ${err.message || "Failed to process document."}`);
    } finally {
      setImportParsing(false);
    }
  }

  function toggleCourseExpand(id: string) {
    setExpandedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

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



  async function handleDeleteLesson(lessonId: string, title: string) {
    if (!confirm(`Are you sure you want to delete lesson "${title}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
      if (res.ok) {
        setMessage(`Lesson "${title}" deleted.`);
        router.refresh();
      } else {
        alert("Failed to delete lesson");
      }
    } catch {
      alert("Error deleting lesson");
    } finally {
      setLoading(false);
    }
  }



  async function handleImportSubmit() {
    if (!importTopicId) {
      alert("Please select a topic for this lesson.");
      return;
    }
    if (!parsedLesson.title) {
      alert("Please enter a lesson title.");
      return;
    }

    await post("/api/admin/lessons", {
      topicId: importTopicId,
      ...parsedLesson,
      order: 0,
      isPublished: true,
    });

    setImportHtml("");
    setParsedLesson({});
    setImportTopicId("");
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {(
          [
            { id: "subject", label: "Add Subject" },
            { id: "course", label: "Add Course" },
            { id: "topic", label: "Add Topic" },
            { id: "lesson", label: "Add Manual Lesson" },
            { id: "doc-import", label: "📄 Import Word / Doc" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              tab === t.id
                ? "border-b-2 border-brand-700 bg-brand-50 text-brand-800 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
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

        {tab === "doc-import" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">📄 Import Word / PDF Document</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload your <strong>.docx</strong> (Word) or <strong>.pdf</strong> file. Tables, diagrams, bold text, and headings will be preserved automatically. The app will detect lesson sections and assign them correctly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Select Target Topic *</label>
              <select
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={importTopicId}
                onChange={(e) => setImportTopicId(e.target.value)}
              >
                <option value="" disabled>Select a Topic...</option>
                {courses.flatMap((c) =>
                  c.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {c.subject.name} ({c.classLevel}) — {t.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 p-8 text-center">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-sm font-semibold text-brand-800 mb-1">Upload your Word or PDF file</p>
              <p className="text-xs text-slate-500 mb-4">Supports .docx (Word), .pdf, and .txt files — tables and images will be preserved</p>
              <input
                type="file"
                accept=".docx,.pdf,.txt,.md"
                disabled={importParsing}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await handleFileUpload(file);
                }}
                className="block mx-auto text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-700 file:text-white hover:file:bg-brand-800 cursor-pointer"
              />
              {importParsing && (
                <p className="mt-4 text-sm text-brand-700 font-medium animate-pulse">⏳ Parsing document... please wait</p>
              )}
            </div>

            {importHtml && (
              <div className="space-y-6">
                {/* Detected lesson title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Lesson Title (detected)</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    value={parsedLesson.title || ""}
                    onChange={(e) => setParsedLesson((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Enter lesson title..."
                  />
                </div>

                {/* Full document preview with HTML rendering */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">📄 Full Document Preview (with tables & images)</label>
                    <span className="text-[10px] text-slate-400">Scroll to verify content before importing</span>
                  </div>
                  <div
                    className="rounded-xl border border-slate-200 bg-white p-5 max-h-80 overflow-y-auto text-sm text-slate-700 leading-relaxed
                      prose prose-slate max-w-none
                      [&_table]:w-full [&_table]:border-collapse [&_table]:my-3
                      [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-800
                      [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-slate-700
                      [&_img]:my-3 [&_img]:max-h-72 [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200
                      [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
                      [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-brand-800
                      [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                      [&_strong]:font-semibold [&_em]:italic"
                    dangerouslySetInnerHTML={{ __html: importHtml }}
                  />
                </div>

                {/* Detected sections - editable */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">✏️ Detected Lesson Sections (Edit if needed)</p>
                  <div className="space-y-3">
                    {[
                      { key: "objectives", label: "Learning Objectives" },
                      { key: "introduction", label: "Introduction" },
                      { key: "definitions", label: "Definitions & Key Terms" },
                      { key: "explanation", label: "Detailed Explanation & Tables" },
                      { key: "workedExamples", label: "Worked Examples" },
                      { key: "realLifeApplications", label: "Real-Life Applications" },
                      { key: "commonMistakes", label: "Common Mistakes" },
                      { key: "summary", label: "Summary" },
                      { key: "practiceQuestions", label: "Practice Questions" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-slate-600 mb-0.5">{f.label}</label>
                        <textarea
                          rows={parsedLesson[f.key] ? 4 : 2}
                          placeholder={`No content detected for ${f.label}. You can type or paste it here...`}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-700"
                          value={parsedLesson[f.key] || ""}
                          onChange={(e) => setParsedLesson((p) => ({ ...p, [f.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleImportSubmit}
                  disabled={loading || !parsedLesson.title || !importTopicId}
                  className="w-full rounded-full bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                >
                  {loading ? "Importing Lesson..." : "📥 Import Lesson into Selected Topic"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Existing Content Browser & Editor */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-800">Existing Lessons & Content</h2>
        <p className="text-sm text-slate-500">Expand any course to view, edit, or update existing lessons.</p>

        <div className="mt-4 space-y-4">
          {courses.map((c) => {
            const isExpanded = expandedCourseIds.includes(c.id);
            const totalLessons = c.topics.reduce((n, t) => n + t.lessons.length, 0);

            return (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  onClick={() => toggleCourseExpand(c.id)}
                  className="flex w-full items-center justify-between bg-slate-50 px-5 py-4 text-left font-semibold text-slate-800 hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">
                      {c.classLevel}
                    </span>
                    <span>{c.subject.name}</span>
                    <span className="text-xs text-slate-500 font-normal">
                      ({c.topics.length} topics · {totalLessons} lessons)
                    </span>
                  </div>
                  <span className="text-slate-400">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-slate-100 p-4 space-y-4">
                    {c.topics.length === 0 ? (
                      <p className="py-2 text-xs italic text-slate-400">No topics added yet.</p>
                    ) : (
                      c.topics.map((t) => (
                        <div key={t.id} className="pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-brand-900 text-sm">
                              📌 {t.title} <span className="text-xs font-normal text-slate-500">({t.term} Term)</span>
                            </h4>
                          </div>

                          {t.lessons.length === 0 ? (
                            <p className="pl-4 text-xs italic text-slate-400">No lessons in this topic.</p>
                          ) : (
                            <div className="ml-4 space-y-2 border-l-2 border-brand-200 pl-3">
                              {t.lessons.map((l) => (
                                <div
                                  key={l.id}
                                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:border-slate-300"
                                >
                                  <div>
                                    <p className="font-medium text-slate-800 text-sm">
                                      📖 {l.title}
                                    </p>
                                    {l.video?.url && (
                                      <p className="text-xs text-brand-700">
                                        🎥 Video: {l.video.url} {l.video.teacherName ? `(By ${l.video.teacherName})` : ""}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={`/lessons/${l.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                                    >
                                      👁️ View Lesson
                                    </a>
                                    <button
                                      onClick={() => handleDeleteLesson(l.id, l.title)}
                                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 flex items-center gap-1"
                                      title="Delete Lesson"
                                    >
                                      🗑️ Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
