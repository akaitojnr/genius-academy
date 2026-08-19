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

type ParsedRow = {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  difficulty: string;
  classLevel: string;
  term: string;
  explanation: string;
  topicTitle: string;
};

const CSV_TEMPLATE = `text,optionA,optionB,optionC,optionD,correctOption,difficulty,classLevel,term,explanation,topicTitle
"Which is a fundamental quantity?","Length","Speed","Area","Volume","A","EASY","SS1","FIRST","Length is one of 7 base quantities.","Measurement"
"The SI unit of mass is the:","Gram","Kilogram","Newton","Pound","B","EASY","SS1","FIRST","Kilogram (kg) is the SI base unit of mass.","Measurement"`;

function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    errors.push("CSV must have a header row and at least one question row.");
    return { rows, errors };
  }

  const requiredHeaders = ["text", "optionA", "optionB", "optionC", "optionD", "correctOption", "difficulty", "classLevel", "term"];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const missing = requiredHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    errors.push(`CSV is missing required columns: ${missing.join(", ")}`);
    return { rows, errors };
  }

  const validDifficulties = ["EASY", "MEDIUM", "HARD"];
  const validClassLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];
  const validTerms = ["FIRST", "SECOND", "THIRD"];
  const validCorrect = ["A", "B", "C", "D"];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handles quoted values)
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());

    const get = (key: string) => cols[headers.indexOf(key)] ?? "";

    const rowNum = i + 1;
    const text = get("text");
    const optionA = get("optiona");
    const optionB = get("optionb");
    const optionC = get("optionc");
    const optionD = get("optiond");
    const correctOption = get("correctoption").toUpperCase();
    const difficulty = get("difficulty").toUpperCase();
    const classLevel = get("classlevel").toUpperCase();
    const term = get("term").toUpperCase();
    const explanation = get("explanation");
    const topicTitle = get("topictitle");

    if (!text) { errors.push(`Row ${rowNum}: "text" is empty.`); continue; }
    if (!optionA || !optionB || !optionC || !optionD) { errors.push(`Row ${rowNum}: All four options (A-D) are required.`); continue; }
    if (!validCorrect.includes(correctOption)) { errors.push(`Row ${rowNum}: "correctOption" must be A, B, C, or D. Got: "${correctOption}"`); continue; }
    if (!validDifficulties.includes(difficulty)) { errors.push(`Row ${rowNum}: "difficulty" must be EASY, MEDIUM, or HARD. Got: "${difficulty}"`); continue; }
    if (!validClassLevels.includes(classLevel)) { errors.push(`Row ${rowNum}: "classLevel" must be JSS1–JSS3 or SS1–SS3. Got: "${classLevel}"`); continue; }
    if (!validTerms.includes(term)) { errors.push(`Row ${rowNum}: "term" must be FIRST, SECOND, or THIRD. Got: "${term}"`); continue; }

    rows.push({ text, optionA, optionB, optionC, optionD, correctOption, difficulty, classLevel, term, explanation, topicTitle });
  }

  return { rows, errors };
}

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
  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  // ---- Manual add state ----
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

  // ---- Import state ----
  const [importSubjectId, setImportSubjectId] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  function showMessage(msg: string, type: "success" | "error" = "success") {
    setMessage(msg);
    setMessageType(type);
  }

  function updateOption(label: string, val: string) {
    setOptions((opts) => opts.map((o) => (o.label === label ? { ...o, text: val } : o)));
  }

  function setCorrect(label: string) {
    setOptions((opts) => opts.map((o) => ({ ...o, isCorrect: o.label === label })));
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, topicId: topicId || undefined, classLevel, term, difficulty, text, explanation: explanation || undefined, options }),
      });
      const data = await res.json();
      if (!res.ok) { showMessage(data.error || "Could not save question.", "error"); return; }
      showMessage("Question added successfully.");
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

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const { rows, errors } = parseCSV(content);
      setParsedRows(rows.length > 0 ? rows : null);
      setParseErrors(errors);
      setMessage(null);
    };
    reader.readAsText(file);
  }

  async function submitImport() {
    if (!importSubjectId) { showMessage("Please select a subject before importing.", "error"); return; }
    if (!parsedRows || parsedRows.length === 0) { showMessage("No valid questions to import.", "error"); return; }

    setLoading(true);
    setMessage(null);
    try {
      const payload = parsedRows.map((row) => ({
        text: row.text,
        classLevel: row.classLevel,
        term: row.term,
        difficulty: row.difficulty,
        explanation: row.explanation || undefined,
        topicTitle: row.topicTitle || undefined,
        options: [
          { label: "A", text: row.optionA, isCorrect: row.correctOption === "A" },
          { label: "B", text: row.optionB, isCorrect: row.correctOption === "B" },
          { label: "C", text: row.optionC, isCorrect: row.correctOption === "C" },
          { label: "D", text: row.optionD, isCorrect: row.correctOption === "D" },
        ],
      }));

      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: importSubjectId, questions: payload }),
      });
      const data = await res.json();
      if (!res.ok) { showMessage(data.error || "Import failed.", "error"); return; }
      showMessage(`✓ ${data.message}`);
      setParsedRows(null);
      setParseErrors([]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "genius-academy-questions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6">
      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 mb-6">
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === "manual" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
        >
          ✏️ Add Manually
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === "import" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
        >
          📥 Import Bulk (CSV)
        </button>
      </div>

      {/* ---- MANUAL TAB ---- */}
      {activeTab === "manual" && (
        <form onSubmit={submitManual} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
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
          <textarea required placeholder="Question text" rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="space-y-2">
            {options.map((opt) => (
              <div key={opt.label} className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs font-semibold">
                  <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setCorrect(opt.label)} />
                  {opt.label}
                </label>
                <input required placeholder={`Option ${opt.label}`} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={opt.text} onChange={(e) => updateOption(opt.label, e.target.value)} />
              </div>
            ))}
            <p className="text-xs text-slate-400">Select the radio button next to the correct option.</p>
          </div>
          <textarea placeholder="Explanation (shown to student after submission)" rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          {message && <p className={`rounded-lg px-3 py-2 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-800"}`}>{message}</p>}
          <button type="submit" disabled={loading} className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
            {loading ? "Saving…" : "Add Question"}
          </button>
        </form>
      )}

      {/* ---- IMPORT TAB ---- */}
      {activeTab === "import" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <h2 className="font-semibold">Bulk Import Questions (CSV)</h2>
            <p className="mt-1 text-xs text-slate-500">Upload a CSV file with multiple questions. The system will validate each row before importing.</p>
          </div>

          {/* Step 1 — Subject select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Step 1: Select Subject</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={importSubjectId} onChange={(e) => setImportSubjectId(e.target.value)}>
              <option value="">Choose a subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Step 2 — Download template */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Step 2: Download & Fill CSV Template</label>
            <button onClick={downloadTemplate} className="mt-1 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100">
              ⬇ Download Template CSV
            </button>
            <p className="mt-1 text-xs text-slate-400">Required columns: text, optionA–D, correctOption (A/B/C/D), difficulty (EASY/MEDIUM/HARD), classLevel (SS1–JSS3), term (FIRST/SECOND/THIRD). Optional: explanation, topicTitle.</p>
          </div>

          {/* Step 3 — Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Step 3: Upload Your CSV</label>
            <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100" />
          </div>

          {/* Validation errors */}
          {parseErrors.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-xs font-bold text-red-700 mb-2">⚠️ {parseErrors.length} validation error(s) found — fix these in your CSV before importing:</p>
              <ul className="space-y-1">
                {parseErrors.map((err, i) => <li key={i} className="text-xs text-red-600">• {err}</li>)}
              </ul>
            </div>
          )}

          {/* Preview */}
          {parsedRows && parsedRows.length > 0 && parseErrors.length === 0 && (
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 space-y-2">
              <p className="text-sm font-semibold text-brand-800">✓ {parsedRows.length} questions ready to import</p>
              <div className="flex flex-wrap gap-2 text-xs text-brand-700">
                {Object.entries(
                  parsedRows.reduce((acc, r) => {
                    acc[r.classLevel] = (acc[r.classLevel] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([cl, count]) => (
                  <span key={cl} className="rounded-full bg-white border border-brand-300 px-2 py-0.5">{cl}: {count}</span>
                ))}
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {parsedRows.slice(0, 5).map((r, i) => (
                  <p key={i} className="text-xs text-slate-600 truncate">• {r.text}</p>
                ))}
                {parsedRows.length > 5 && <p className="text-xs text-slate-400">…and {parsedRows.length - 5} more</p>}
              </div>
            </div>
          )}

          {message && (
            <p className={`rounded-lg px-3 py-2 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-800"}`}>{message}</p>
          )}

          <button
            onClick={submitImport}
            disabled={loading || !parsedRows || parsedRows.length === 0 || parseErrors.length > 0 || !importSubjectId}
            className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40"
          >
            {loading ? "Importing…" : `Import ${parsedRows?.length ?? 0} Questions`}
          </button>
        </div>
      )}

      {/* Question list */}
      <div className="mt-8">
        <h2 className="mb-2 font-semibold">Questions ({initialQuestions.length})</h2>
        <div className="space-y-2">
          {initialQuestions.map((q) => (
            <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{q.text}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {q.subject.name} · {q.classLevel} · {q.difficulty}{q.topic ? ` · ${q.topic.title}` : ""}
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
