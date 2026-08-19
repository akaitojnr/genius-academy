import Link from "next/link";
import { db } from "@/lib/db";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || "").trim();

  const results =
    q.length >= 2
      ? await Promise.all([
          db.subject.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 5 }),
          db.topic.findMany({
            where: { title: { contains: q, mode: "insensitive" } },
            include: { course: { include: { subject: true } } },
            take: 5,
          }),
          db.lesson.findMany({
            where: { title: { contains: q, mode: "insensitive" }, isPublished: true },
            include: { topic: { include: { course: { include: { subject: true } } } } },
            take: 10,
          }),
          db.teacher.findMany({
            where: { fullName: { contains: q, mode: "insensitive" } },
            include: { subjects: true },
            take: 5,
          }),
        ])
      : [[], [], [], []];

  const [subjects, topics, lessons, teachers] = results;
  const totalResults = subjects.length + topics.length + lessons.length + teachers.length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Search</h1>
      <p className="text-sm text-slate-600">
        {q ? `Results for "${q}"` : "Enter a search term above to find subjects, topics, lessons and teachers."}
      </p>

      {q && q.length >= 2 && totalResults === 0 && (
        <p className="mt-6 text-sm text-slate-500">No results found for &quot;{q}&quot;.</p>
      )}

      {subjects.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Subjects</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {subjects.map((s) => (
              <Link key={s.id} href={`/courses/${s.slug}/SS1`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm hover:border-brand-400">
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {topics.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Topics</h2>
          <div className="space-y-2">
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/courses/${t.course.subject.slug}/${t.course.classLevel}`}
                className="block rounded-xl border border-slate-200 bg-white p-3 text-sm hover:border-brand-400"
              >
                <span className="font-medium">{t.title}</span>
                <span className="ml-2 text-xs text-slate-400">{t.course.subject.name} · {t.course.classLevel}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {lessons.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Lessons</h2>
          <div className="space-y-2">
            {lessons.map((l) => (
              <Link key={l.id} href={`/lessons/${l.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 text-sm hover:border-brand-400">
                <span className="font-medium">{l.title}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {l.topic.course.subject.name} · {l.topic.course.classLevel} · {l.topic.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {teachers.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Teachers</h2>
          <div className="space-y-2">
            {teachers.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <span className="font-medium">{t.fullName}</span>
                <span className="ml-2 text-xs text-slate-400">{t.subjects.map((s) => s.name).join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
