import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Small helper so every admin/teacher API route enforces role checks the
// same way, instead of re-writing the same session logic everywhere.
// This is a second line of defense behind middleware.ts — middleware
// blocks page navigation, this blocks the underlying API calls directly.
export async function requireRole(roles: string[]) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session || !role || !roles.includes(role)) {
    return { ok: false as const, status: role ? 403 : 401, session: null };
  }
  return { ok: true as const, status: 200, session };
}
