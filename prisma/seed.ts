import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const subjects = [
  { name: "Physics", slug: "physics" },
  { name: "Chemistry", slug: "chemistry" },
  { name: "Biology", slug: "biology" },
  { name: "Further Mathematics", slug: "further-mathematics" },
  { name: "Mathematics", slug: "mathematics" },
  { name: "English Language", slug: "english-language" },
];

const plans = [
  { name: "BASIC", description: "One subject", priceKobo: 150000, subjectLimit: 1, includesLive: false },
  { name: "STANDARD", description: "Three subjects", priceKobo: 300000, subjectLimit: 3, includesLive: false },
  { name: "PREMIUM", description: "All subjects + live classes", priceKobo: 500000, subjectLimit: null, includesLive: true },
];

async function main() {
  console.log("Seeding subjects…");
  for (const s of subjects) {
    await db.subject.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  console.log("Seeding plans…");
  for (const p of plans) {
    await db.plan.upsert({ where: { name: p.name }, update: {}, create: p as any });
  }

  console.log("Seeding default admin account…");
  const adminEmail = "akaitojnr@gmail.com";
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin@2026", 12);
    await db.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        admin: { create: { fullName: "Platform Administrator" } },
      },
    });
    console.log(`Created admin: ${adminEmail} / Admin@2026 (change this immediately)`);
  }

  console.log("Seeding sample Physics SS1 course with one full lesson…");
  const physics = await db.subject.findUnique({ where: { slug: "physics" } });
  if (physics) {
    const course = await db.course.upsert({
      where: { subjectId_classLevel: { subjectId: physics.id, classLevel: "SS1" } },
      update: {},
      create: {
        subjectId: physics.id,
        classLevel: "SS1",
        title: "Physics — SS1",
        description: "Foundations of physics for SS1 students.",
        isPublished: true,
      },
    });

    const topicTitles = ["Measurement", "Motion", "Force", "Work, Energy and Power", "Heat", "Waves", "Electricity"];
    const topics = [];
    for (const [i, title] of topicTitles.entries()) {
      const topic = await db.topic.upsert({
        where: { id: `seed-physics-ss1-${i}` },
        update: {},
        create: { id: `seed-physics-ss1-${i}`, courseId: course.id, term: "FIRST", title, order: i },
      });
      topics.push(topic);
    }

    const measurement = topics[0];
    const existingLesson = await db.lesson.findFirst({ where: { topicId: measurement.id, title: "Fundamental Quantities" } });
    if (!existingLesson) {
      await db.lesson.create({
        data: {
          topicId: measurement.id,
          title: "Fundamental Quantities",
          order: 0,
          isPublished: true,
          objectives: "By the end of this lesson, students should be able to list and define the seven fundamental quantities and their SI units.",
          introduction: "Every measurement in physics is expressed in terms of a small set of base quantities. Understanding these is the foundation for everything else in the subject.",
          explanation: "A fundamental (base) quantity is one that cannot be defined in terms of other quantities. There are seven: length, mass, time, electric current, temperature, amount of substance, and luminous intensity. Every other physical quantity (derived quantity) is built from combinations of these.",
          definitions: "Fundamental quantity: a physical quantity that is independent and not derived from others.\nSI unit: the standard unit assigned to a quantity under the International System of Units.",
          workedExamples: "Example: Identify the fundamental quantities in speed.\nSolution: Speed = distance/time. Distance depends on length (metres) and time (seconds). So speed is derived from two fundamental quantities: length and time.",
          diagrams: "[Diagram: table showing the 7 fundamental quantities with their SI units and symbols]",
          realLifeApplications: "Fundamental quantities underpin everyday measurements: a tailor measuring length in metres, a nurse measuring temperature in Kelvin/Celsius, a runner's time in seconds.",
          commonMistakes: "Students often confuse fundamental and derived quantities — e.g. thinking 'area' or 'speed' are fundamental when they are actually derived.",
          summary: "There are 7 fundamental quantities: length, mass, time, electric current, temperature, amount of substance, and luminous intensity. All other quantities are derived from these.",
          practiceQuestions: "1. List the seven fundamental quantities and their SI units.\n2. Classify the following as fundamental or derived: volume, mass, velocity, temperature.",
        },
      });
    }
    // Sample CBT questions for the Measurement topic, plus one ready-to-take exam.
    const existingQuestions = await db.question.count({ where: { topicId: measurement.id } });
    if (existingQuestions === 0) {
      const sampleQuestions = [
        {
          text: "Which of the following is a fundamental quantity?",
          difficulty: "EASY" as const,
          explanation: "Length is one of the seven fundamental (base) quantities in physics.",
          options: [
            { label: "A", text: "Length", isCorrect: true },
            { label: "B", text: "Speed", isCorrect: false },
            { label: "C", text: "Area", isCorrect: false },
            { label: "D", text: "Volume", isCorrect: false },
          ],
        },
        {
          text: "The SI unit of mass is the:",
          difficulty: "EASY" as const,
          explanation: "The kilogram (kg) is the SI base unit of mass.",
          options: [
            { label: "A", text: "Gram", isCorrect: false },
            { label: "B", text: "Kilogram", isCorrect: true },
            { label: "C", text: "Newton", isCorrect: false },
            { label: "D", text: "Pound", isCorrect: false },
          ],
        },
        {
          text: "Which quantity is derived, not fundamental?",
          difficulty: "MEDIUM" as const,
          explanation: "Speed = distance/time, so it is derived from length and time.",
          options: [
            { label: "A", text: "Time", isCorrect: false },
            { label: "B", text: "Mass", isCorrect: false },
            { label: "C", text: "Speed", isCorrect: true },
            { label: "D", text: "Temperature", isCorrect: false },
          ],
        },
        {
          text: "How many fundamental quantities are there in the SI system?",
          difficulty: "EASY" as const,
          explanation: "There are seven fundamental quantities.",
          options: [
            { label: "A", text: "5", isCorrect: false },
            { label: "B", text: "6", isCorrect: false },
            { label: "C", text: "7", isCorrect: true },
            { label: "D", text: "8", isCorrect: false },
          ],
        },
        {
          text: "The SI unit of electric current is the:",
          difficulty: "MEDIUM" as const,
          explanation: "The ampere (A) is the SI base unit of electric current.",
          options: [
            { label: "A", text: "Volt", isCorrect: false },
            { label: "B", text: "Ohm", isCorrect: false },
            { label: "C", text: "Ampere", isCorrect: true },
            { label: "D", text: "Watt", isCorrect: false },
          ],
        },
      ];

      for (const q of sampleQuestions) {
        await db.question.create({
          data: {
            subjectId: physics.id,
            topicId: measurement.id,
            classLevel: "SS1",
            term: "FIRST",
            difficulty: q.difficulty,
            text: q.text,
            explanation: q.explanation,
            options: { create: q.options },
          },
        });
      }

      const allQuestions = await db.question.findMany({ where: { topicId: measurement.id } });
      await db.exam.create({
        data: {
          title: "Physics SS1 — Measurement Practice Test",
          subjectId: physics.id,
          classLevel: "SS1",
          durationMin: 15,
          examQuestions: { create: allQuestions.map((q) => ({ questionId: q.id })) },
        },
      });
    }

    // Sample teacher account, assigned to the seeded Physics SS1 course.
    console.log("Seeding sample teacher account…");
    const teacherEmail = "akaitojnr+teacher@gmail.com";
    let teacherRecord = await db.teacher.findFirst({ where: { user: { email: teacherEmail } } });
    if (!teacherRecord) {
      const passwordHash = await bcrypt.hash("Admin@2026", 12);
      const teacherUser = await db.user.create({
        data: {
          email: teacherEmail,
          passwordHash,
          role: "TEACHER",
          teacher: {
            create: {
              fullName: "Mrs. Adaeze Okoro",
              bio: "Physics teacher with 8 years of WAEC/JAMB prep experience.",
              subjects: { connect: [{ id: physics.id }] },
            },
          },
        },
        include: { teacher: true },
      });
      teacherRecord = teacherUser.teacher;
      console.log(`Created teacher: ${teacherEmail} / Admin@2026`);

      await db.course.update({ where: { id: course.id }, data: { teacherId: teacherRecord!.id } });

      console.log("Seeding sample live class and assignment…");
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await db.liveClass.create({
        data: {
          teacherId: teacherRecord!.id,
          subjectName: "Physics",
          topic: "Introduction to Measurement",
          classLevel: "SS1",
          description: "A live walkthrough of fundamental and derived quantities with worked examples.",
          scheduledAt: nextWeek,
          meetingLink: "https://meet.google.com/example-link",
        },
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      await db.assignment.create({
        data: {
          teacherId: teacherRecord!.id,
          title: "Measurement Worksheet 1",
          instructions:
            "List the seven fundamental quantities with their SI units, and classify 5 given quantities as fundamental or derived.",
          dueDate,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
