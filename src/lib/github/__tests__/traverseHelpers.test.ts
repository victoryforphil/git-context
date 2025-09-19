import { describe, expect, it } from "vitest";

import { depthFromRelativePath } from "@/lib/github/traverse";

describe("depthFromRelativePath", () => {
  const cases: Array<[string, number]> = [
    ["", 0],
    ["file.ts", 0],
    ["dir/file.ts", 1],
    ["a/b/c.ts", 2],
    ["folder/sub/inner", 2],
  ];

  for (const [input, expected] of cases) {
    it(`computes depth for "${input}"`, () => {
      expect(depthFromRelativePath(input)).toBe(expected);
    });
  }
});
