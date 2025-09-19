# git-dat-context

Monorepo for GitHub content indexing experiments and tools.

## Packages

- `github-raw-indexer`: Next.js app that builds a Markdown index of RAW file links for any GitHub repository, directory, or file path. See its README for features and details.

## Getting Started (Top-level)

Clone and install dependencies for the `github-raw-indexer` app:

```bash
cd github-raw-indexer
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

Within `github-raw-indexer`:

- `npm run dev`: Start Next.js dev server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm test`: Run Vitest

## GitHub Actions CI

This repo includes a CI workflow that runs on pull requests and pushes to main for the `github-raw-indexer` package:

- Install dependencies (with cache)
- Lint code (`next lint`)
- Run tests (`vitest`)
- Build the app (`next build`)

See `.github/workflows/ci.yml`.

## Deployment

The `github-raw-indexer` app is a standard Next.js (App Router) project and can be deployed to many platforms. Two common options:

1. Vercel (recommended)
   - Create a new Vercel project and select this repo
   - Set Framework Preset to Next.js
   - Root Directory: `github-raw-indexer`
   - Build Command: `npm run build`
   - Output: `.next`
   - Environment Variables: optionally set `GITHUB_TOKEN` for higher API limits

2. Self-hosted Node
   - Build locally or in CI: `cd github-raw-indexer && npm ci && npm run build`
   - Start: `npm start` (defaults to port 3000)
   - Set `GITHUB_TOKEN` as an environment variable on the server if desired

## Environment Variables

- `GITHUB_TOKEN` (optional): increases GitHub API rate limits; used only by the server route.

For more details, see `github-raw-indexer/README.md` and `github-raw-indexer/notes/`.
