import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ResultsView from "./ResultsView";

export default async function ResultsPage({ params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    redirect("/login");
  }

  return <ResultsView attemptId={params.attemptId} />;
}
