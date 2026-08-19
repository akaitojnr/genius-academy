// ============================================================
// AI-ready architecture (Phase 7 scaffolding)
// ------------------------------------------------------------
// The functions below define the *interface* every future AI feature
// (Section 28 of the spec) will implement: AI tutor Q&A, explanation
// generation, practice-question generation, personalized study plans,
// weak-topic detection, lesson-plan generation, and marking assistance.
//
// None of these call a paid LLM API yet — that's intentional. Wiring one
// up is a single change inside each function (e.g. a fetch to Anthropic's
// /v1/messages with the relevant prompt), without touching any of the
// UI code that already calls these functions. This keeps v1 free of
// per-request AI costs while the rest of the platform is validated.
// ============================================================

export type TutorAnswer = {
  answer: string;
  relatedLessonId?: string;
  isStub: true;
};

export async function askAiTutor(question: string, context?: { subjectId?: string; classLevel?: string }): Promise<TutorAnswer> {
  // TODO(Phase 8+): replace with a real call, e.g.
  //   const res = await fetch("https://api.anthropic.com/v1/messages", { ... })
  // scoped to `context` (subject/class) and the student's recent weak topics.
  return {
    answer:
      "The AI tutor isn't switched on yet. In the meantime, check the lesson's Common Mistakes and Summary sections, or ask your teacher on the Announcements page.",
    isStub: true,
  };
}

export async function generateExplanation(topicTitle: string): Promise<{ explanation: string; isStub: true }> {
  return {
    explanation: `AI-generated explanations for "${topicTitle}" are coming soon. For now, see the lesson's written explanation.`,
    isStub: true,
  };
}

export async function generatePracticeQuestions(topicId: string, count: number): Promise<{ questions: []; isStub: true }> {
  return { questions: [], isStub: true };
}

export async function detectWeakTopics(studentId: string): Promise<{ topics: string[]; isStub: true }> {
  // A real implementation would look at ExamAnswer.isCorrect grouped by
  // Question.topicId for this student and return the lowest-scoring topics.
  return { topics: [], isStub: true };
}

export async function generateStudyPlan(studentId: string): Promise<{ plan: string; isStub: true }> {
  return {
    plan: "Personalized study plans are coming soon. Meanwhile, use your dashboard's progress bars and CBT results to see where to focus.",
    isStub: true,
  };
}
