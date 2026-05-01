"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./markdown/components";
import { ArticleContactCTA } from "./ArticleContactCTA";

interface ArticleContentProps {
  markdown: string;
}

const CTA_REGEX = /^\{\{CTA:\s*"(.+?)"\s*\}\}$/;

function splitByCTAs(markdown: string): Array<{ type: "md"; content: string } | { type: "cta"; label: string }> {
  const segments: Array<{ type: "md"; content: string } | { type: "cta"; label: string }> = [];
  let mdBuffer: string[] = [];

  for (const line of markdown.split("\n")) {
    const match = line.trim().match(CTA_REGEX);
    if (match) {
      if (mdBuffer.length > 0) {
        segments.push({ type: "md", content: mdBuffer.join("\n") });
        mdBuffer = [];
      }
      segments.push({ type: "cta", label: match[1] });
    } else {
      mdBuffer.push(line);
    }
  }

  if (mdBuffer.length > 0) {
    segments.push({ type: "md", content: mdBuffer.join("\n") });
  }

  return segments;
}

export function ArticleContent({ markdown }: ArticleContentProps) {
  const segments = splitByCTAs(markdown);

  return (
    <div className="max-w-2xl mx-auto">
      {segments.map((seg, i) =>
        seg.type === "cta" ? (
          <ArticleContactCTA key={i} label={seg.label} />
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {seg.content}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}
