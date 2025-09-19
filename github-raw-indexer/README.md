# GitHub Raw Indexer

A Next.js + Tailwind + shadcn/ui app to generate a Markdown index of RAW file links for any GitHub repository, directory, or file path.

## Features

- Parse GitHub repo/tree/blob URLs (or `owner/repo` shorthand) and resolve the target ref automatically
- Traverse repositories using the Git Trees API with graceful fallback to the Contents API when needed
- Honor a configurable depth (0 = immediate children) and build a Markdown tree with RAW + HTML links
- Server route proxies GitHub API requests and keeps your `GITHUB_TOKEN` on the server side only
- Friendly error messages for invalid inputs, missing paths, and rate limits

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

The token is only read on the server route that calls the GitHub API. Public repositories work without a token, but rate limits are much lower (60/hr).

## Current Status
- Full GitHub API integration with Markdown output and copy button
- Server API route with rate-limit and error handling
- Depth-aware traversal with Trees API + Contents fallback

## Project Structure
- `src/app` - App Router pages and layout
- `src/components` - UI components
- `src/lib` - utilities
- `notes/` - requirements and design notes

## Testing

```bash
npm run lint
npm test
```

See `notes/` and `agents.md` for more details.