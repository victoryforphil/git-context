# GitHub Raw Indexer

A Next.js + Tailwind + shadcn/ui app to generate a Markdown index of RAW file links for any GitHub repository, directory, or file path.

## Getting Started

Prerequisites:
- Node.js 18+
- npm

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Build for production:

```bash
npm run build && npm start
```

## Tech Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS
- shadcn/ui (locally scaffolded components)

## Environment
Optional for higher GitHub API limits:

```bash
# .env.local
GITHUB_TOKEN=ghp_your_token_here
```

Tokens are used only on the server when we add API traversal. Public repos work without a token.

## Current Status
- Mock UI: URL input, depth selector, Generate button, and Markdown preview
- Traversal and RAW link generation to be implemented next

## Project Structure
- `src/app` - App Router pages and layout
- `src/components` - UI components
- `src/lib` - utilities
- `notes/` - requirements and design notes

## Roadmap
- URL parser for repo/tree/blob variants
- GitHub API traversal + depth and ignore options
- Markdown formatting + copy/export helpers
- Optional GitHub token support with rate-limit handling

See `notes/` and `agents.md` for more details.