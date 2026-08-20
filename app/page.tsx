import Link from "next/link";
import {
  GraduationCap,
  Video,
  ClipboardCheck,
  TrendingUp,
  Users,
  BookOpen,
} from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const subjects = [
  { name: "Physics", icon: "⚛️" },
  { name: "Chemistry", icon: "🧪" },
  { name: "Biology", icon: "🧬" },
  { name: "Further Mathematics", icon: "📐" },
  { name: "Mathematics", icon: "➗" },
  { name: "English Language", icon: "📖" },
];

const faqs = [
  { q: "Which classes does Genius Academy support?", a: "JSS1 to SS3, plus focused prep for WAEC, NECO and JAMB." },
  { q: "Can I pay in installments?", a: "Yes, monthly subscription plans are available alongside termly options." },
  { q: "Can parents monitor progress?", a: "Yes, every student account can be linked to a parent dashboard." },
];

export default async function LandingPage() {
  const dbPlans = await db.plan.findMany({ where: { isActive: true }, orderBy: { priceKobo: "asc" } });
  const plans = dbPlans.map((p) => ({
    name: p.name,
    price: `₦${(p.priceKobo / 100).toLocaleString()}/mo`,
    desc: p.description ?? "",
    features: [
      p.subjectLimit ? `${p.subjectLimit} subject${p.subjectLimit > 1 ? "s" : ""}` : "All subjects",
      "Lessons & videos",
      "CBT practice",
      ...(p.includesLive ? ["Live classes"] : []),
    ],
    highlight: p.name === "STANDARD",
  }));

  return (
    <main>
      {/* NAV */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-bold text-brand-700">
            <GraduationCap size={22} />
            <span>Genius Academy</span>
          </div>
          <nav className="hidden gap-6 text-sm font-medium text-slate-600 sm:flex">
            <a href="#features">Features</a>
            <a href="#subjects">Subjects</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="flex gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
              Log In
            </Link>
            <Link href="/register" className="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
              Start Learning
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        <p className="mb-3 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Learn. Practise. Master.
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Master Your Subjects. Improve Your Scores.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          Learn Physics, Chemistry, Mathematics, Biology, English and other subjects through
          structured lessons, expert teaching, CBT practice and live classes.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="rounded-full bg-brand-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-brand-800">
            Start Learning
          </Link>
          <a href="#subjects" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100">
            View Courses
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Everything you need to excel</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Users, title: "Expert Teachers", desc: "Learn from qualified subject teachers." },
              { icon: BookOpen, title: "Interactive Lessons", desc: "Structured lessons with worked examples." },
              { icon: ClipboardCheck, title: "CBT Practice", desc: "Timed practice questions with instant marking." },
              { icon: Video, title: "Live Classes", desc: "Join scheduled live sessions with your teacher." },
              { icon: TrendingUp, title: "Progress Tracking", desc: "See exactly where you're strong or weak." },
              { icon: GraduationCap, title: "Exam Preparation", desc: "Built for WAEC, NECO and JAMB success." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                <f.icon className="text-brand-700" size={28} />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Subjects</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {subjects.map((s) => (
              <div key={s.name} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="text-3xl">{s.icon}</div>
                <p className="mt-2 text-sm font-medium">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">How It Works</h2>
          <ol className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              "Create an account",
              "Choose your subjects",
              "Make payment",
              "Start learning",
              "Practise CBT",
              "Track your progress",
            ].map((step, i) => (
              <li key={step} className="rounded-2xl border border-slate-200 p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 font-medium">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Pricing</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-6 shadow-sm ${
                  p.highlight ? "border-brand-700 bg-brand-50" : "border-slate-200 bg-white"
                }`}
              >
                <h3 className="font-bold text-brand-800">{p.name}</h3>
                <p className="mt-1 text-2xl font-extrabold">{p.price}</p>
                <p className="text-sm text-slate-600">{p.desc}</p>
                <ul className="mt-4 space-y-1 text-sm text-slate-700">
                  {p.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-6 block rounded-full bg-brand-700 py-2 text-center text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Choose Plan
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            Prices are configurable by the administrator and may change.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS placeholder */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">What Students Say</h2>
          <p className="mt-4 text-sm text-slate-500">
            Testimonials will appear here once published by the administrator.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-700 py-16 text-center text-white">
        <h2 className="text-2xl font-bold sm:text-3xl">Your academic success starts here.</h2>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold text-brand-800 hover:bg-brand-50"
        >
          Start Learning
        </Link>
      </section>

      <footer className="bg-slate-900 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Genius Academy. All rights reserved.
      </footer>
    </main>
  );
}
