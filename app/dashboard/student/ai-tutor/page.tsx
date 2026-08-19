import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AiTutorChat from "./AiTutorChat";

export default async function AiTutorPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">AI Tutor</h1>
      <p className="text-sm text-slate-600">
        Ask a question about any subject. The AI tutor is being rolled out gradually — for now you&apos;ll get a
        helpful placeholder response, but the chat interface below is fully wired up for when it goes live.
      </p>
      <AiTutorChat />
    </main>
  );
}
