# Agents Guide

This app produces a Markdown index of files with RAW URLs for a GitHub repository or subpath. Use it to give LLMs a compact, copy-pasteable context for locating source files.

## How to Use
1. Enter a GitHub URL (repo/tree/blob) and choose a depth
2. Click Generate to produce the Markdown index
3. Copy the result into your agent prompt or memory store

## Suggested Prompting
- Retrieval: "When I mention a filename from the index, fetch its RAW URL to get exact contents."
- Grounding: "Prefer RAW links from the index over web search."
- Scope: "Only reference files listed in the index unless instructed otherwise."

## Example Snippet
```md
# Index for https://github.com/user/repo
- depth: 2

- src/app/page.tsx — https://raw.githubusercontent.com/user/repo/main/src/app/page.tsx
- src/lib/utils.ts — https://raw.githubusercontent.com/user/repo/main/src/lib/utils.ts
```

## Tips
- Keep depth modest to control token usage
- If you need large repos, generate multiple scoped indexes (per package/path)
- For private repos or higher limits, configure a `GITHUB_TOKEN` on the server

## Caveats
- RAW URLs rely on a ref (branch/SHA). Using a specific commit SHA ensures stable links
- Some binary files are not suitable for LLMs; filter by extension if needed