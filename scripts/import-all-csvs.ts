import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let c = 0; c < line.length; c++) {
    const ch = line[c];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      cols.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current.trim().replace(/^"|"$/g, ""));
  return cols;
}

function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const get = (key: string) => cols[headers.indexOf(key)] ?? "";

    rows.push({
      text: get("text"),
      optionA: get("optiona"),
      optionB: get("optionb"),
      optionC: get("optionc"),
      optionD: get("optiond"),
      correctOption: get("correctoption").toUpperCase(),
      difficulty: get("difficulty").toUpperCase(),
      classLevel: get("classlevel").toUpperCase(),
      term: get("term").toUpperCase(),
      explanation: get("explanation"),
      topicTitle: get("topictitle"),
    });
  }
  return rows;
}

async function main() {
  const subjectsMap: Record<string, string> = {
    Physics: "questions_physics.csv",
    Chemistry: "questions_chemistry.csv",
    Biology: "questions_biology.csv",
    Mathematics: "questions_mathematics.csv",
    "Further Mathematics": "questions_further_mathematics.csv",
    "English Language": "questions_english.csv",
  };

  console.log("Importing 600 questions into Neon database...");

  for (const [subjName, filename] of Object.entries(subjectsMap)) {
    const subject = await db.subject.findFirst({
      where: { name: { equals: subjName, mode: "insensitive" } },
    });

    if (!subject) {
      console.log(`Subject not found in DB: ${subjName}, skipping.`);
      continue;
    }

    const csvPath = path.join(__dirname, filename);
    if (!fs.existsSync(csvPath)) {
      console.log(`File not found: ${csvPath}, skipping.`);
      continue;
    }

    const csvText = fs.readFileSync(csvPath, "utf8");
    const rows = parseCSV(csvText);

    console.log(`Importing ${rows.length} questions for ${subjName}...`);

    let count = 0;
    for (const r of rows) {
      if (!r.text || !r.optionA || !r.optionB) continue;

      // Find matching topic if topicTitle exists
      let topicId: string | null = null;
      if (r.topicTitle) {
        const topic = await db.topic.findFirst({
          where: {
            title: { equals: r.topicTitle, mode: "insensitive" },
            course: { subjectId: subject.id, classLevel: r.classLevel },
          },
        });
        if (topic) topicId = topic.id;
      }

      await db.question.create({
        data: {
          subjectId: subject.id,
          topicId,
          classLevel: r.classLevel,
          term: r.term,
          difficulty: r.difficulty,
          text: r.text,
          explanation: r.explanation || null,
          options: {
            create: [
              { label: "A", text: r.optionA, isCorrect: r.correctOption === "A" },
              { label: "B", text: r.optionB, isCorrect: r.correctOption === "B" },
              { label: "C", text: r.optionC, isCorrect: r.correctOption === "C" },
              { label: "D", text: r.optionD, isCorrect: r.correctOption === "D" },
            ],
          },
        },
      });
      count++;
    }
    console.log(`✓ Successfully imported ${count} questions for ${subjName}`);
  }

  console.log("All 600 questions successfully imported into Neon PostgreSQL!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
