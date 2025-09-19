# Design

## URL Parsing
Input can be repo root, tree (directory), or blob (file):
- Repo: `https://github.com/{owner}/{repo}`
- Tree: `https://github.com/{owner}/{repo}/tree/{ref}/{path...}`
- Blob: `https://github.com/{owner}/{repo}/blob/{ref}/{path...}`

Parsing steps:
- Normalize URL
- Extract `{owner, repo}`
- Determine kind: repo/tree/blob
- Derive `ref` (branch/tag/sha). If omitted, use default branch via API.
- Derive `path` (empty for repo root)

## RAW URL Generation
- blob: `https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}`
- tree/repo: requires directory traversal

## Traversal Strategy
- Prefer GitHub REST API (Trees API) with `?recursive=1` when depth allows
  - `GET /repos/{owner}/{repo}/git/trees/{ref}?recursive=1`
  - Filter entries by `path` prefix when a sub-tree is provided
  - Respect `maxDepth` by counting separators in `path`
- Fallback: HTML scraping is fragile; avoid if possible

## Depth Handling
- Depth counts directories below the starting path
- Depth=0 means only files at the starting path level
- Depth=1 includes one level deeper, etc.

## Rate Limiting & Auth
- Unauthenticated: 60 req/hr
- With token: 5k req/hr
- Use server route to proxy API with `GITHUB_TOKEN` from env
- Exponential backoff and ETag caching (future enhancement)

## Data Model
- ParsedTarget
  - owner, repo, ref, path, kind
- FileNode
  - type: 'file'|'dir'
  - name, path, depth, size?
  - urlRaw, urlHtml

## Formatting Markdown
- Tree with backticks for filenames
- Indentation indicates depth
- Include copyable RAW URL per file
- Optional: language and size annotations

## Security Notes
- Do not expose tokens to client
- Validate URLs to only allow `github.com`

## UX Notes
- Debounced input validation
- Show summary stats: files, total size (if available)
- Copy to clipboard buttons and download as `.md`