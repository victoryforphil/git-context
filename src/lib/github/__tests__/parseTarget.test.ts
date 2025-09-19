import { describe, expect, it } from "vitest";

import { parseTarget } from "@/lib/github/parseTarget";
import type { ParsedTarget } from "@/lib/github/types";

function isTarget(value: unknown): value is ParsedTarget {
  return Boolean(value && typeof value === "object" && "owner" in value && "repo" in value && "kind" in value);
}

describe("parseTarget", () => {
  it("parses repository URLs", () => {
    const result = parseTarget("https://github.com/octocat/Hello-World");
    expect(isTarget(result)).toBe(true);
    if (isTarget(result)) {
      expect(result).toMatchObject({ owner: "octocat", repo: "Hello-World", kind: "repo", path: "" });
      expect(result.ref).toBeUndefined();
    }
  });

  it("accepts owner/repo shorthand", () => {
    const result = parseTarget("octocat/Hello-World");
    expect(isTarget(result)).toBe(true);
    if (isTarget(result)) {
      expect(result.owner).toBe("octocat");
      expect(result.repo).toBe("Hello-World");
    }
  });

  it("parses tree URLs with path", () => {
    const result = parseTarget("https://github.com/octocat/Hello-World/tree/main/src/lib");
    expect(isTarget(result)).toBe(true);
    if (isTarget(result)) {
      expect(result).toMatchObject({
        owner: "octocat",
        repo: "Hello-World",
        kind: "tree",
        ref: "main",
        path: "src/lib",
      });
    }
  });

  it("parses blob URLs", () => {
    const result = parseTarget("https://github.com/octocat/Hello-World/blob/master/README.md");
    expect(isTarget(result)).toBe(true);
    if (isTarget(result)) {
      expect(result.kind).toBe("blob");
      expect(result.path).toBe("README.md");
    }
  });

  it("rejects non GitHub hosts", () => {
    const result = parseTarget("https://gitlab.com/example/repo");
    expect(result).toHaveProperty("code", "invalid_host");
  });

  it("flags missing ref for tree URLs", () => {
    const result = parseTarget("https://github.com/octocat/Hello-World/tree");
    expect(result).toHaveProperty("code", "invalid_ref");
  });

  it("requires file path for blob URLs", () => {
    const result = parseTarget("https://github.com/octocat/Hello-World/blob/main");
    expect(result).toHaveProperty("code", "invalid_path");
  });
});
