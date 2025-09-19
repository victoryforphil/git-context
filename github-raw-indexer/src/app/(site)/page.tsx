"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTree } from "@/lib/markdown/formatTree";
import type { FileNode, ParsedTarget } from "@/lib/github/types";

interface ErrorState {
  code: string;
  message: string;
}

type ResolvedTarget = ParsedTarget & { ref: string };

const DEFAULT_DEPTH = 2;

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState<number>(DEFAULT_DEPTH);
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [target, setTarget] = useState<ResolvedTarget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [copied, setCopied] = useState(false);
  const [appliedDepth, setAppliedDepth] = useState<number>(DEFAULT_DEPTH);
  const [appliedUrl, setAppliedUrl] = useState<string>("");

  const markdown = useMemo(() => {
    if (!nodes.length || !target) {
      return "";
    }

    const header = buildHeaderMarkdown(appliedUrl, target, appliedDepth, nodes);
    const tree = formatTree(nodes);
    return tree ? `${header}\n\n${tree}` : header;
  }, [appliedUrl, target, appliedDepth, nodes]);

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
    <main className="container py-12">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>GitHub RAW Indexer</CardTitle>
            <CardDescription>
              Generate a Markdown index of RAW links for any GitHub repository, directory, or file. All GitHub requests run on the
              server so your token stays private.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="repoUrl">GitHub URL</Label>
                <Input
                  id="repoUrl"
                  placeholder="https://github.com/user/repo[/tree|blob]/path"
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="depth">Max Depth</Label>
                <Input
                  id="depth"
                  type="number"
                  min={0}
                  max={8}
                  value={maxDepth}
                  onChange={(event) =>
                    setMaxDepth(() => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value) || value < 0) {
                        return 0;
                      }
                      return Math.floor(value);
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Depth 0 lists items directly under the starting path. Increase to include nested directories.
                </p>
              </div>
              {error ? <ErrorMessage error={error} /> : null}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSubmit} disabled={!repoUrl || isLoading}>
                  {isLoading ? "Generating…" : "Generate Index"}
                </Button>
                <Button variant="outline" onClick={handleCopy} disabled={!markdown}>
                  {copied ? "Copied" : "Copy Markdown"}
                </Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="result">Result (Markdown)</Label>
                <textarea
                  id="result"
                  className="min-h-[280px] w-full resize-y rounded-md border bg-transparent p-3 text-sm font-mono"
                  value={markdown}
                  readOnly
                  placeholder="Generated markdown will appear here."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
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
