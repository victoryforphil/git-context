"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState(2);
  const [resultMarkdown, setResultMarkdown] = useState<string>("");

  function handleGenerate() {
    const mock = `# Index for ${repoUrl || "<repo-url>"}\n\n- depth: ${maxDepth}\n\n\n\n[//]: # (This is a mock output. Real generation to be implemented.)`;
    setResultMarkdown(mock);
  }

  return (
    <main className="container py-12">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>GitHub Raw Indexer</CardTitle>
            <CardDescription>
              Enter a GitHub repository URL or path. Configure depth and generate a markdown index of RAW file links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="repoUrl">GitHub URL or path</Label>
                <Input
                  id="repoUrl"
                  placeholder="https://github.com/user/repo[/tree|blob]/path"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
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
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleGenerate} disabled={!repoUrl}>
                  Generate Mock Index
                </Button>
              </div>
              <div className="grid gap-2">
                <Label>Result (Markdown)</Label>
                <textarea
                  className="min-h-[240px] w-full resize-y rounded-md border bg-transparent p-3 text-sm font-mono"
                  value={resultMarkdown}
                  readOnly
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
