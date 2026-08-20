import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Route -> allowed roles. Any dashboard route not listed here defaults to
// "must be logged in" only. Admin and teacher routes are explicitly locked
// down so a student can never reach them by editing the URL.
const roleRules: { prefix: string; roles: string[] }[] = [
  { prefix: "/dashboard/admin/content", roles: ["ADMIN", "TEACHER"] },
  { prefix: "/dashboard/admin/questions", roles: ["ADMIN", "TEACHER"] },
  { prefix: "/dashboard/admin", roles: ["ADMIN"] },
  { prefix: "/dashboard/teacher", roles: ["TEACHER"] },
  { prefix: "/dashboard/parent", roles: ["PARENT"] },
  { prefix: "/dashboard/student", roles: ["STUDENT"] },
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = (req as any).nextauth?.token;
    const role = token?.role as string | undefined;

    const rule = roleRules.find((r) => pathname.startsWith(r.prefix));
    if (rule && (!role || !rule.roles.includes(role))) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Must at least be logged in to reach anything under /dashboard or /api/admin etc.
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*", "/api/teacher/:path*"],
};
