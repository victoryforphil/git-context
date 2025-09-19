# Requirements

## Overview
The app accepts a GitHub URL or path and generates a Markdown index of files with RAW links, recursively to a configurable depth. Supports repo root, tree (directory), and blob (file) URLs.

## Inputs
- GitHub URL or path: examples:
  - https://github.com/user/repo
  - https://github.com/user/repo/tree/branch/path
  - https://github.com/user/repo/blob/branch/path/file.ext
- Max depth (integer >= 0)
- Optional: include/exclude globs (future)
- Optional: file size limit (future)

## Outputs
- Markdown block containing a tree of files and per-file RAW URLs
- Optional: per-file size and language
- Optional: copy buttons

## Functional Requirements
- Parse input URL; infer owner, repo, ref (branch/tag/commit), path type (repo, tree, blob)
- Traverse directories to configured depth
- For each file, produce a RAW URL
- Handle GitHub API rate limits gracefully
- Support public repos without auth; support PAT via env for higher limits
- Debounce input; validate URL
- Provide mock results without network for demo

## Non-Functional
- Built with Next.js App Router, TypeScript, Tailwind, shadcn/ui
- No server-side secrets in client bundles
- Accessible UI components
- Reasonable performance for small-to-mid repos (<5k files)

## Data Model
- ParsedTarget { owner, repo, ref, path, kind: 'repo'|'tree'|'blob' }
- FileNode { type: 'file'|'dir', name, path, depth, size?, urlRaw, urlHtml }

## Open Questions
- Should we support monorepos and multiple roots? (future)
- Include README contents inline? (toggle)
- Allow fetching by commit SHA vs default branch?

## Milestones
1. Mock UI + notes + README
2. URL parser + mock traversal
3. GitHub API traversal; rate-limit handling
4. Formatting and export capabilities