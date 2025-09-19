"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  markdown: string;
}

const markdownComponents: Components = {
  pre: ({ className, ...props }) => (
    <pre
      {...props}
      className={["overflow-x-auto rounded-md bg-muted p-3 text-xs", className].filter(Boolean).join(" ")}
    />
  ),
  code: ({ inline, className, children, ...props }) =>
    inline ? (
      <code
        {...props}
        className={["rounded bg-muted px-[0.3rem] py-[0.1rem] font-mono text-xs", className].filter(Boolean).join(" ")}
      >
        {children}
      </code>
    ) : (
      <code {...props} className={["block font-mono text-xs", className].filter(Boolean).join(" ")}>
        {children}
      </code>
    ),
};

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  if (!markdown) {
    return <p className="text-sm text-muted-foreground">Generated markdown preview will appear here.</p>;
  }

  return (
    <ReactMarkdown
      className="prose prose-sm max-w-none dark:prose-invert"
      remarkPlugins={[remarkGfm]}
      linkTarget="_blank"
      linkRel="noreferrer"
      components={markdownComponents}
    >
      {markdown}
    </ReactMarkdown>
  );
}
