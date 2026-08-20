import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

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
      // Parse PDF server-side using pdf-parse
      const pdfData = await pdfParse(buffer);
      return NextResponse.json({ type: "text", content: pdfData.text });
    }

    if (ext === "docx") {
      // Parse DOCX server-side with mammoth HTML output (preserves tables, images, headings)
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml(
        { buffer },
        {
          convertImage: mammoth.images.dataUri, // embed images as base64 data URIs
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "b => strong",
            "i => em",
          ],
        }
      );
      return NextResponse.json({ type: "html", content: result.value, messages: result.messages });
    }

    // Plain text files (.txt, .md)
    const text = buffer.toString("utf-8");
    return NextResponse.json({ type: "text", content: text });
  } catch (err: any) {
    console.error("parse-document error:", err);
    return NextResponse.json({ error: err.message || "Failed to parse document." }, { status: 500 });
  }
}
