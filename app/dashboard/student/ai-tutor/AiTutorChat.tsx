"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

export default function AiTutorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.answer ?? "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="min-h-[200px] space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">Try asking something like &quot;Explain Newton&apos;s first law&quot;.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              m.role === "user" ? "ml-auto bg-brand-700 text-white" : "bg-slate-100 text-slate-800"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="max-w-[85%] rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-400">Thinking…</div>}
      </div>

      <form onSubmit={ask} className="mt-3 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
