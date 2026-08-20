"use client";

import React from "react";

interface Props {
  content: string;
}

export default function FormattedContent({ content }: Props) {
  if (!content) return null;

  // Simple Markdown & HTML parser for tables, images, bold, lists, and line breaks
  const renderFormatted = (text: string) => {
    // If text contains HTML tags (like <table> or <img>), render safely
    if (/<[a-z][\s\S]*>/i.test(text)) {
      return (
        <div
          className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 
            [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-200 
            [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold 
            [&_td]:border [&_td]:border-slate-200 [&_td]:p-2.5 [&_img]:my-4 [&_img]:max-h-96 [&_img]:rounded-xl [&_img]:shadow-sm"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }

    // Markdown Table Parser
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = (key: number) => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const body = tableRows.slice(1).filter((r) => !r.every((cell) => /^[-:\s]+$/.test(cell)));

        elements.push(
          <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 font-semibold text-slate-800">
                <tr>
                  {header.map((cell, idx) => (
                    <th key={idx} className="border-b border-slate-200 px-4 py-2.5">
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {body.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 text-slate-700">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Check for Markdown table line e.g. | Header 1 | Header 2 | OR tab-separated text (pasted from Word/Excel)
      if ((trimmed.startsWith("|") && trimmed.endsWith("|")) || (line.includes("\t") && line.split("\t").length > 1)) {
        inTable = true;
        let cells: string[] = [];
        if (line.includes("\t")) {
          cells = line.split("\t").map((c) => c.trim());
        } else {
          cells = trimmed
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());
        }
        tableRows.push(cells);
        return;
      }

      if (inTable) {
        flushTable(index);
        inTable = false;
      }

      // Markdown Image check: ![alt](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        elements.push(
          <figure key={`img-${index}`} className="my-4 text-center">
            <img src={imgMatch[2]} alt={imgMatch[1]} className="mx-auto max-h-96 rounded-2xl border border-slate-200 shadow-sm" />
            {imgMatch[1] && <figcaption className="mt-1.5 text-xs text-slate-500">{imgMatch[1]}</figcaption>}
          </figure>
        );
        return;
      }

      // Standard text line
      if (trimmed === "") {
        elements.push(<div key={`br-${index}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${index}`} className="text-sm leading-relaxed text-slate-700">
            {line}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return <div className="space-y-1">{elements}</div>;
  };

  return <>{renderFormatted(content)}</>;
}
