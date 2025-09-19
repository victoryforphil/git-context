import { describe, expect, it } from "vitest";

import { resolveRef } from "@/lib/github/api";
import type { ErrorLike } from "@/lib/github/errors";
import { parseTarget } from "@/lib/github/parseTarget";
import { traverse } from "@/lib/github/traverse";
import type { ParsedTarget } from "@/lib/github/types";

function isTarget(value: ParsedTarget | ErrorLike): value is ParsedTarget {
  return !("code" in value);
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  if ("code" in error && (error as { code?: string }).code === "network_error") {
    return true;
  }

  const err = error as NodeJS.ErrnoException & { cause?: NodeJS.ErrnoException };
  const code = err.code ?? err.cause?.code;
  return Boolean(code && ["ENETUNREACH", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT"].includes(code));
}

describe("GitHub API integration", () => {
  it("traverses a public repository", async () => {
    const parsed = parseTarget("https://github.com/octocat/Hello-World");
    expect(isTarget(parsed)).toBe(true);
    if (!isTarget(parsed)) {
      throw new Error(`Failed to parse target: ${(parsed as ErrorLike).message}`);
    }

    let ref: string;
    try {
      ref = await resolveRef(parsed);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn("Skipping integration test: network unavailable");
        return;
      }
      throw error;
    }

    const target: ParsedTarget = { ...parsed, ref };
    let nodes;
    try {
      nodes = await traverse(target, 0);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn("Skipping integration test: network unavailable");
        return;
      }
      throw error;
    }

    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.every((node) => node.depth === 0)).toBe(true);

    const readme = nodes.find((node) => node.name.toLowerCase().startsWith("readme"));
    expect(readme).toBeDefined();
    expect(readme?.urlRaw).toContain("raw.githubusercontent.com/octocat/Hello-World");
    expect(readme?.urlHtml).toContain("github.com/octocat/Hello-World/blob");
  });
});
