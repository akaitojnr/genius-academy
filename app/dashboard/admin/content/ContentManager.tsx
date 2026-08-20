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

  // Editing state
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [expandedCourseIds, setExpandedCourseIds] = useState<string[]>(courses.map((c) => c.id));

  // Document Import state
  const [importTopicId, setImportTopicId] = useState("");
  const [docText, setDocText] = useState("");
  const [parsedLesson, setParsedLesson] = useState<Record<string, string>>({});

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

  function openEditModal(lesson: Lesson) {
    setEditingLesson(lesson);
    setEditForm({
      title: lesson.title || "",
      objectives: lesson.objectives || "",
      introduction: lesson.introduction || "",
      explanation: lesson.explanation || "",
      definitions: lesson.definitions || "",
      workedExamples: lesson.workedExamples || "",
      realLifeApplications: lesson.realLifeApplications || "",
      commonMistakes: lesson.commonMistakes || "",
      summary: lesson.summary || "",
      practiceQuestions: lesson.practiceQuestions || "",
      videoUrl: lesson.video?.url || "",
      teacherName: lesson.video?.teacherName || "",
    });
  }

  async function handleUpdateLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLesson) return;
    setLoading(true);
    setMessage(null);

    try {
      const { videoUrl, teacherName, ...rest } = editForm;
      const res = await fetch(`/api/admin/lessons/${editingLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          ...(videoUrl ? { video: { url: videoUrl, teacherName } } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update lesson");
        return;
      }
      setMessage("Lesson updated successfully.");
      setEditingLesson(null);
      router.refresh();
    } catch {
      alert("Network error updating lesson.");
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

  // Parse Word / Document text into lesson fields smartly line-by-line
  function parseDocument(rawText: string) {
    const result: Record<string, string> = {
      title: "",
      objectives: "",
      introduction: "",
      definitions: "",
      explanation: "",
      workedExamples: "",
      realLifeApplications: "",
      commonMistakes: "",
      summary: "",
      practiceQuestions: "",
    };

    const lines = rawText.split("\n");
    let currentSection: string | null = null;
    const sectionBuffers: Record<string, string[]> = {
      title: [],
      objectives: [],
      introduction: [],
      definitions: [],
      explanation: [],
      workedExamples: [],
      realLifeApplications: [],
      commonMistakes: [],
      summary: [],
      practiceQuestions: [],
    };

    function detectHeading(line: string): string | null {
      const clean = line
        .trim()
        .replace(/^[\#\*\d\.\-\:]+/, "") // Remove leading numbers, #, *, dots, dashes
        .replace(/[\:\-\=\*]+$/, "") // Remove trailing colons, dashes
        .trim()
        .toLowerCase();

      if (!clean) return null;

      if (/^(title|lesson title|topic title)$/i.test(clean) || clean.startsWith("title")) return "title";
      if (/^(learning objectives|objectives|objective|goals)$/i.test(clean) || clean.startsWith("objective")) return "objectives";
      if (/^(introduction|intro)$/i.test(clean) || clean.startsWith("intro")) return "introduction";
      if (/^(definitions|definition|key terms|definitions & key terms|definitions and key terms|vocabulary)$/i.test(clean) || clean.includes("definit") || clean.includes("key terms")) return "definitions";
      if (/^(detailed explanation|explanation|detailed explanation & tables|explanation & tables|lesson content|body)$/i.test(clean) || clean.includes("explain") || clean.includes("explanation")) return "explanation";
      if (/^(worked examples|worked examples & solutions|examples|examples & solutions|step-by-step solutions)$/i.test(clean) || clean.includes("worked example") || clean.includes("sample problem")) return "workedExamples";
      if (/^(real-life applications|applications|real life applications|real life application)$/i.test(clean) || clean.includes("application")) return "realLifeApplications";
      if (/^(common mistakes|common student mistakes|mistakes to avoid|common errors)$/i.test(clean) || clean.includes("mistake") || clean.includes("errors to avoid")) return "commonMistakes";
      if (/^(summary|recap|key takeaways|conclusion)$/i.test(clean) || clean.startsWith("summary")) return "summary";
      if (/^(practice questions|questions|quiz|exercise|practice exercises|self test)$/i.test(clean) || clean.includes("practice question") || clean.includes("exercises")) return "practiceQuestions";

      return null;
    }

    for (let line of lines) {
      const heading = detectHeading(line);
      if (heading) {
        currentSection = heading;
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const inlineText = line.slice(colonIdx + 1).trim();
          if (inlineText) {
            sectionBuffers[heading].push(inlineText);
          }
        }
      } else {
        if (!currentSection) {
          if (line.trim() && sectionBuffers.title.length === 0) {
            sectionBuffers.title.push(line.trim());
            currentSection = "title";
          }
        } else {
          sectionBuffers[currentSection].push(line);
        }
      }
    }

    Object.keys(sectionBuffers).forEach((key) => {
      result[key] = sectionBuffers[key].join("\n").trim();
    });

    setParsedLesson(result);
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!importTopicId) {
      alert("Please select a topic for this lesson.");
      return;
    }
    if (!parsedLesson.title) {
      alert("Please enter or parse a lesson title.");
      return;
    }

    await post("/api/admin/lessons", {
      topicId: importTopicId,
      ...parsedLesson,
      order: 0,
      isPublished: true,
    });

    setDocText("");
    setParsedLesson({});
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
              <h3 className="text-lg font-bold text-slate-800">📄 Import Word / PDF Document Lesson</h3>
              <p className="text-xs text-slate-500 mt-1">
                Copy text from your Word document or PDF file and paste it below. You can include tables (e.g. <code>| Col 1 | Col 2 |</code> or HTML <code>&lt;table&gt;</code>) and diagrams (<code>![Diagram](image_url)</code>).
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Paste Document / Word Text
                </label>
                <textarea
                  rows={14}
                  placeholder={`Title: Speed, Velocity and Acceleration\n\nObjectives:\n1. Define speed and velocity.\n2. Calculate acceleration.\n\nExplanation:\nSpeed is distance divided by time.\n| Quantity | Unit | Formula |\n| Speed | m/s | s = d/t |\n\nWorked Examples:\nA car travels 100m in 5s. Calculate speed:\nSpeed = 100/5 = 20 m/s`}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono"
                  value={docText}
                  onChange={(e) => {
                    setDocText(e.target.value);
                    parseDocument(e.target.value);
                  }}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Upload .docx / .txt file:</span>
                  <input
                    type="file"
                    accept=".docx,.txt,.md,.text"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      if (file.name.endsWith(".docx")) {
                        try {
                          const mammoth = await import("mammoth");
                          const arrayBuffer = await file.arrayBuffer();
                          const result = await mammoth.extractRawText({ arrayBuffer });
                          setDocText(result.value);
                          parseDocument(result.value);
                        } catch (err) {
                          alert("Could not read .docx file. Try copying and pasting the text directly.");
                        }
                      } else {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          setDocText(text);
                          parseDocument(text);
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Extracted Lesson Preview
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-3 max-h-[350px] overflow-y-auto">
                  <div>
                    <span className="font-bold text-slate-700">Title:</span> {parsedLesson.title || "(Not detected)"}
                  </div>
                  {parsedLesson.objectives && (
                    <div>
                      <span className="font-bold text-slate-700">Objectives:</span>
                      <p className="whitespace-pre-line text-slate-600 mt-0.5">{parsedLesson.objectives}</p>
                    </div>
                  )}
                  {parsedLesson.explanation && (
                    <div>
                      <span className="font-bold text-slate-700">Explanation:</span>
                      <p className="whitespace-pre-line text-slate-600 mt-0.5">{parsedLesson.explanation}</p>
                    </div>
                  )}
                  {parsedLesson.workedExamples && (
                    <div>
                      <span className="font-bold text-slate-700">Worked Examples:</span>
                      <p className="whitespace-pre-line text-slate-600 mt-0.5">{parsedLesson.workedExamples}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleImportSubmit}
              disabled={loading || !parsedLesson.title}
              className="w-full rounded-full bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {loading ? "Importing Lesson..." : "📥 Import Lesson into Selected Topic"}
            </button>
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
                                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                    >
                                      👁️ View
                                    </a>
                                    <button
                                      onClick={() => openEditModal(l)}
                                      className="rounded-lg bg-brand-700 px-3 py-1 text-xs font-medium text-white hover:bg-brand-800"
                                    >
                                      ✏️ Edit Lesson
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLesson(l.id, l.title)}
                                      className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                                    >
                                      🗑️
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

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Edit Lesson: {editingLesson.title}</h3>
              <button
                onClick={() => setEditingLesson(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Lesson Title</label>
                <input
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Video URL (optional)</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={editForm.videoUrl || ""}
                    onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Teacher Name</label>
                  <input
                    placeholder="Mr. Shedrach Makama"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={editForm.teacherName || ""}
                    onChange={(e) => setEditForm({ ...editForm, teacherName: e.target.value })}
                  />
                </div>
              </div>

              {[
                { name: "objectives", label: "Learning Objectives" },
                { name: "introduction", label: "Introduction" },
                { name: "definitions", label: "Definitions & Key Terms" },
                { name: "explanation", label: "Detailed Explanation & Tables" },
                { name: "workedExamples", label: "Worked Examples & Solutions" },
                { name: "realLifeApplications", label: "Real-Life Applications" },
                { name: "commonMistakes", label: "Common Student Mistakes" },
                { name: "summary", label: "Summary" },
                { name: "practiceQuestions", label: "Practice Questions" },
              ].map((f) => (
                <div key={f.name}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{f.label}</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt("Enter Diagram / Image URL (e.g. https://...):");
                          if (!url) return;
                          const caption = prompt("Enter Diagram Title / Caption (optional):", "Diagram") || "Diagram";
                          const imgMarkdown = `\n\n![${caption}](${url})\n\n`;
                          setEditForm((prev) => ({ ...prev, [f.name]: (prev[f.name] || "") + imgMarkdown }));
                        }}
                        className="text-[10px] font-semibold text-brand-700 hover:underline bg-brand-50 px-2 py-0.5 rounded"
                      >
                        🖼️ + Diagram
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tableTemplate = `\n\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Value 1 | Value 2 | Value 3 |\n\n`;
                          setEditForm((prev) => ({ ...prev, [f.name]: (prev[f.name] || "") + tableTemplate }));
                        }}
                        className="text-[10px] font-semibold text-brand-700 hover:underline bg-brand-50 px-2 py-0.5 rounded"
                      >
                        📊 + Table
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={editForm[f.name] || ""}
                    onChange={(e) => setEditForm({ ...editForm, [f.name]: e.target.value })}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-brand-700 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
