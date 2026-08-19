import Link from "next/link";
import { db } from "@/lib/db";

const classLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] as const;

export default async function CourseCatalogPage() {
  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Courses</h1>
      <p className="text-sm text-slate-600">Choose a subject, then your class, to see topics and lessons.</p>

      <div className="mt-8 space-y-8">
        {subjects.map((s) => (
          <section key={s.id}>
            <h2 className="mb-3 text-lg font-semibold text-brand-800">{s.name}</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {classLevels.map((c) => (
                <Link
                  key={c}
                  href={`/courses/${s.slug}/${c}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-center text-sm font-medium shadow-sm hover:border-brand-500 hover:text-brand-700"
                >
                  {c}
                </Link>
              ))}
            </div>
          </section>
        ))}

        {subjects.length === 0 && (
          <p className="text-sm text-slate-500">No subjects have been added yet.</p>
        )}
      </div>
    </main>
  );
}
