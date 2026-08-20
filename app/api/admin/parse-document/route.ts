import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (ext === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      return NextResponse.json({ type: "text", content: pdfData.text });
    }

    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml(
        { buffer },
        { convertImage: mammoth.images.dataUri }
      );
      return NextResponse.json({ type: "html", content: result.value });
    }

    const text = buffer.toString("utf-8");
    return NextResponse.json({ type: "text", content: text });
  } catch (err: any) {
    console.error("parse-document error:", err);
    return NextResponse.json({ error: err.message || "Failed to parse document." }, { status: 500 });
  }
}
