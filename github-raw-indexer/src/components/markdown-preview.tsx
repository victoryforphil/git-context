"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  markdown: string;
}

const markdownComponents: Components = {
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg bg-muted/50 border p-4 text-xs">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted/50 border px-[0.3rem] py-[0.1rem] font-mono text-xs">
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer"
      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold border-b pb-2 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 space-y-1">{children}</ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
};

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  if (!markdown) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
        <div className="text-muted-foreground mb-2">
          <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">Generated markdown preview will appear here</p>
        <p className="text-xs text-muted-foreground mt-1">Enter a GitHub URL and click &quot;Generate Index&quot; to get started</p>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
