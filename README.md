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

## Deploying to Vercel

Deploying this Next.js app to Vercel is straightforward and leverages Vercel's native Next.js support.

1. Push your code to Git (GitHub/GitLab/Bitbucket).
2. Create a Vercel account and click "New Project".
3. Import your repository.
4. In the configuration step:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `github-raw-indexer` (this repo is a monorepo; select this subfolder)
   - Install Command: `npm ci` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Node.js Version: 20 (optional but recommended to match CI)
   - Environment Variables (optional): add `GITHUB_TOKEN` for higher GitHub API limits. Apply to Production and Preview.
5. Click "Deploy".
6. After the first deployment, you'll get a live Preview URL. Add a custom domain in Project Settings → Domains if desired.

Notes:
- Vercel will automatically create Preview Deployments for pull requests and a Production Deployment on merges to your default branch.
- `GITHUB_TOKEN` is only read by the server route calling the GitHub API; public repos work without it but with much lower rate limits.

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