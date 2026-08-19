import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";

interface ImportQuestionInput {
  text: string;
  classLevel: any;
  term: any;
  difficulty: any;
  explanation?: string;
  topicTitle?: string;
  options: { label: string; text: string; isCorrect: boolean }[];
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "TEACHER"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  try {
    const { subjectId, questions } = (await req.json()) as {
      subjectId: string;
      questions: ImportQuestionInput[];
    };

    if (!subjectId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Missing subjectId or questions array" }, { status: 400 });
    }

    // Pre-fetch all topics for this subject to quickly resolve topicId from topicTitle
    const allTopics = await db.topic.findMany({
      where: { course: { subjectId } },
      include: { course: true },
    });

    const parsedQuestions = questions.map((q) => {
      // Find matching topic by title (case-insensitive) for this class level
      let topicId: string | null = null;
      if (q.topicTitle) {
        const match = allTopics.find(
          (t) =>
            t.title.trim().toLowerCase() === q.topicTitle!.trim().toLowerCase() &&
            t.course.classLevel === q.classLevel
        );
        if (match) {
          topicId = match.id;
        }
      }

      return {
        subjectId,
        topicId,
        classLevel: q.classLevel,
        term: q.term,
        difficulty: q.difficulty,
        text: q.text,
        explanation: q.explanation || null,
        options: q.options,
      };
    });

    // Bulk insert inside a transaction
    await db.$transaction(
      parsedQuestions.map((pq) =>
        db.question.create({
          data: {
            subjectId: pq.subjectId,
            topicId: pq.topicId,
            classLevel: pq.classLevel,
            term: pq.term,
            difficulty: pq.difficulty,
            text: pq.text,
            explanation: pq.explanation,
            options: {
              create: pq.options.map((o) => ({
                label: o.label,
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            },
          },
        })
      )
    );

    return NextResponse.json({
      message: `Successfully imported ${questions.length} questions.`,
      count: questions.length,
    });
  } catch (error) {
    console.error("Bulk import questions error:", error);
    return NextResponse.json({ error: "An error occurred during import" }, { status: 500 });
  }
}
