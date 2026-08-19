import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GraduationCap, Bell } from "lucide-react";
import SearchBox from "@/components/SearchBox";

export default async function DashboardNav() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  const links: { href: string; label: string }[] = [];
  if (role === "STUDENT") {
    links.push(
      { href: "/dashboard/student", label: "Dashboard" },
      { href: "/courses", label: "Courses" },
      { href: "/exams", label: "CBT Practice" },
      { href: "/live-classes", label: "Live Classes" },
      { href: "/assignments", label: "Assignments" },
      { href: "/pricing", label: "Pricing" },
      { href: "/dashboard/student/ai-tutor", label: "AI Tutor" }
    );
  } else if (role === "TEACHER") {
    links.push(
      { href: "/dashboard/teacher", label: "Dashboard" },
      { href: "/dashboard/teacher/live-classes", label: "Live Classes" },
      { href: "/dashboard/teacher/assignments", label: "Assignments" },
      { href: "/dashboard/teacher/announcements", label: "Announcements" }
    );
  } else if (role === "ADMIN") {
    links.push(
      { href: "/dashboard/admin", label: "Dashboard" },
      { href: "/dashboard/admin/content", label: "Content" },
      { href: "/dashboard/admin/questions", label: "Questions" },
      { href: "/dashboard/admin/exams", label: "Exams" },
      { href: "/dashboard/admin/teachers", label: "Teachers" },
      { href: "/dashboard/admin/payments", label: "Payments" },
      { href: "/dashboard/admin/plans", label: "Plans" },
      { href: "/dashboard/admin/analytics", label: "Analytics" }
    );
  } else if (role === "PARENT") {
    links.push({ href: "/dashboard/parent", label: "My Children" });
  }

  if (session) {
    links.push({ href: "/dashboard/settings", label: "Settings" });
  }

  const unreadCount = session
    ? await db.notification.count({ where: { userId: (session.user as any).id, isRead: false } })
    : 0;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-brand-700">
          <GraduationCap size={20} />
          <span className="hidden sm:inline">Genius Academy</span>
        </Link>

        {session && (
          <div className="hidden flex-1 sm:block">
            <SearchBox />
          </div>
        )}

        <nav className="flex shrink-0 items-center gap-4 text-sm font-medium text-slate-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hidden hover:text-brand-700 lg:inline">
              {l.label}
            </Link>
          ))}
          {session && (
            <Link href="/notifications" className="relative hover:text-brand-700">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          {session ? (
            <Link href="/api/auth/signout" className="hover:text-brand-700">Log out</Link>
          ) : (
            <Link href="/login" className="hover:text-brand-700">Log in</Link>
          )}
        </nav>
      </div>
      {session && (
        <div className="border-t border-slate-100 px-4 py-2 sm:hidden">
          <SearchBox />
        </div>
      )}
    </header>
  );
}
