"use client";

import { useCallback, useMemo, useState, useEffect } from "react";

import { FileTree } from "@/components/file-tree";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"; 
import { Copy, Eye, Code, FileText, FolderOpen, Download, Github } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { FileNode, ParsedTarget } from "@/lib/github/types";
import { formatTree } from "@/lib/markdown/formatTree";
import useLocalStorage from "@/lib/hooks/useLocalStorage";

interface ErrorState {
  code: string;
  message: string;
}

type ResolvedTarget = ParsedTarget & { ref: string };

const DEFAULT_DEPTH = 2;

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useLocalStorage("github-indexer-url", "");
  const [maxDepth, setMaxDepth] = useLocalStorage("github-indexer-depth", DEFAULT_DEPTH);
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [target, setTarget] = useState<ResolvedTarget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [copied, setCopied] = useState(false);
  const [appliedDepth, setAppliedDepth] = useState<number>(DEFAULT_DEPTH);
  const [appliedUrl, setAppliedUrl] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"raw" | "preview">("raw");

  useEffect(() => {
    setMounted(true);
  }, []);

  const markdown = useMemo(() => {
    if (!nodes.length || !target) {
      return "";
    }

    const header = buildHeaderMarkdown(appliedUrl, target, appliedDepth, nodes);
    const tree = formatTree(nodes);
    return tree ? `${header}\n\n${tree}` : header;
  }, [appliedUrl, target, appliedDepth, nodes]);

  const filesCount = useMemo(() => nodes.filter((node) => node.type === "file").length, [nodes]);
  const characterCount = markdown.length;
  const fileTreeBasePath = target?.path ?? "";
  const fileTreeLabel = target
    ? target.path
      ? `Directory: ${target.path}/`
      : "Repository files"
    : "File tree";
  const fileTreeHref = target ? buildSourceUrl(target, appliedUrl) : undefined;

  const handleSubmit = useCallback(async () => {
    if (!repoUrl) {
      setError({ code: "invalid_input", message: "Enter a GitHub URL." });
      return;
    }

    const depthToUse = maxDepth;
    const urlToUse = repoUrl.trim();
    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/github/traverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToUse, maxDepth: depthToUse }),
      });

      const data = (await response.json()) as { error?: ErrorState; nodes?: FileNode[]; target?: ResolvedTarget };

      if (!response.ok || data.error) {
        setNodes([]);
        setTarget(null);
        setError(
          data.error ?? {
            code: "unknown_error",
            message: "Unable to generate the index. Try again later.",
          }
        );
        return;
      }

      setNodes(data.nodes ?? []);
      setTarget(data.target ?? null);
      setAppliedDepth(depthToUse);
      setAppliedUrl(urlToUse);
    } catch (err) {
      setNodes([]);
      setTarget(null);
      setError({ code: "network_error", message: "Failed to contact the server. Check your connection and try again." });
    } finally {
      setIsLoading(false);
    }
  }, [repoUrl, maxDepth]);

  const handleCopy = useCallback(async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError({ code: "copy_failed", message: "Unable to copy to clipboard. Copy manually from the textarea." });
    }
  }, [markdown]);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header with Configuration */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">GitHub Raw Indexer</h1>
                <p className="text-xs text-muted-foreground">Generate markdown indexes</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
        
        {/* Configuration Bar */}
        <div className="border-t bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Label htmlFor="repoUrl" className="text-sm font-medium whitespace-nowrap">URL:</Label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/user/repo[/tree|blob]/path"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                autoComplete="off"
                className="flex-1 min-w-[300px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="depth" className="text-sm font-medium whitespace-nowrap">Depth:</Label>
              <Input
                id="depth"
                type="number"
                min={0}
                max={8}
                value={maxDepth}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (!Number.isFinite(value) || value < 0) {
                    setMaxDepth(0);
                  } else {
                    setMaxDepth(Math.floor(value));
                  }
                }}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSubmit} 
                disabled={!mounted || !repoUrl.trim() || isLoading}
                size="sm"
              >
                <Code className="h-4 w-4 mr-2" />
                {isLoading ? "Generating…" : "Generate"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCopy} 
                disabled={!mounted || !markdown}
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            {target && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{characterCount.toLocaleString()} chars</span>
                <span>{filesCount.toLocaleString()} files</span>
              </div>
            )}
          </div>
          {error && (
            <div className="mt-3">
              <ErrorMessage error={error} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 w-full overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="w-full">
          {/* File Tree Panel */}
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <div className="flex h-full flex-col border-r">
              <FileTree
                nodes={nodes}
                basePath={fileTreeBasePath}
                rootLabel={fileTreeLabel}
                rootHref={fileTreeHref}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          
          {/* Markdown Panel */}
          <ResizablePanel defaultSize={65} minSize={30}>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b bg-background px-4 py-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <h2 className="font-semibold">Markdown Output</h2>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={viewMode === "raw" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("raw")}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Raw
                  </Button>
                  <Button
                    variant={viewMode === "preview" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("preview")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <div className="mx-2 h-4 w-px bg-border" />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCopy} 
                    disabled={!mounted || !markdown}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {viewMode === "raw" ? (
                <textarea
                  className="flex-1 resize-none border-0 bg-transparent p-4 text-sm font-mono outline-none"
                  value={markdown}
                  readOnly
                  placeholder="Generated markdown will appear here."
                  spellCheck={false}
                />
              ) : (
                <div className="flex-1 overflow-auto p-4">
                  <MarkdownPreview markdown={markdown} />
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

function buildHeaderMarkdown(inputUrl: string, target: ResolvedTarget, depth: number, nodes: FileNode[]): string {
  const sourceUrl = buildSourceUrl(target, inputUrl);
  const filesCount = nodes.filter((node) => node.type === "file").length;
  const pathLabel = target.path ? target.path : "/";

  const lines = [
    `# Index for ${sourceUrl}`,
    `- ref: ${target.ref}`,
    `- path: ${pathLabel}`,
    `- depth: ${depth}`,
    `- files: ${filesCount}`,
  ];

  return lines.join("\n");
}

function buildSourceUrl(target: ResolvedTarget, inputUrl: string): string {
  if (inputUrl && inputUrl.includes("github.com")) {
    return inputUrl;
  }

  if (target.kind === "repo") {
    return `https://github.com/${target.owner}/${target.repo}`;
  }

  const ref = target.ref ?? "";
  const suffix = target.path ? `/${target.path}` : "";
  return `https://github.com/${target.owner}/${target.repo}/${target.kind}/${ref}${suffix}`;
}

function ErrorMessage({ error }: { error: ErrorState }) {
  const suggestion = error.code === "rate_limit" ? "Add a GITHUB_TOKEN on the server to raise your rate limits." : null;
  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
      <p className="font-medium">{error.message}</p>
      {suggestion ? <p className="mt-1">{suggestion}</p> : null}
    </div>
  );
}