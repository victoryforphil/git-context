import { AppError, type ErrorLike } from "./errors";
import type { ParsedTarget, TargetKind } from "./types";

const GITHUB_HOST = "github.com";

function normalizeInput(input: string): string {
  return input.trim();
}

function ensureUrl(value: string): URL {
  try {
    return new URL(value);
  } catch (error) {
    // Attempt to coerce owner/repo or github.com/owner/repo without scheme
    try {
      if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
        const prefixed = value.startsWith(`${GITHUB_HOST}/`) ? `https://${value}` : `https://${GITHUB_HOST}/${value}`;
        return new URL(prefixed);
      }
    } catch (innerError) {
      throw innerError;
    }
    throw error;
  }
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function detectKind(segment: string | undefined): TargetKind {
  if (segment === "tree") return "tree";
  if (segment === "blob") return "blob";
  return "repo";
}

function stripGitSuffix(repo: string): string {
  return repo.endsWith(".git") ? repo.slice(0, -4) : repo;
}

export type ParseTargetResult = ParsedTarget | ErrorLike;

function parseError(code: string, message: string): AppError {
  return new AppError(code, message, { status: 400 });
}

export function parseTarget(input: string): ParseTargetResult {
  const normalized = normalizeInput(input);
  if (!normalized) {
    return parseError("invalid_input", "Provide a GitHub repository URL or path.");
  }

  let url: URL;
  try {
    url = ensureUrl(normalized);
  } catch {
    return parseError("invalid_url", "Unable to parse the GitHub URL. Check the format and try again.");
  }

  if (url.hostname.toLowerCase() !== GITHUB_HOST) {
    return parseError("invalid_host", "Only github.com URLs are supported.");
  }

  const segments = url.pathname.split("/").filter(Boolean).map(decodeSegment);
  if (segments.length < 2) {
    return parseError("invalid_path", "Expected a path like github.com/owner/repo.");
  }

  const [owner, repoRaw, maybeKind, ...rest] = segments;
  const repo = stripGitSuffix(repoRaw);
  if (!owner || !repo) {
    return parseError("invalid_path", "Missing repository owner or name in URL.");
  }

  const kind = detectKind(maybeKind);
  if (kind === "repo" && segments.length > 2) {
    return parseError("unsupported_path", "Only repo, tree, or blob URLs are supported.");
  }

  if (kind !== "repo" && rest.length === 0) {
    return parseError("invalid_ref", "The URL is missing a branch, tag, or commit ref.");
  }

  const result: ParsedTarget = {
    owner,
    repo,
    ref: undefined,
    path: "",
    kind,
  };

  if (kind === "repo") {
    return result;
  }

  const [ref, ...pathSegments] = rest;
  if (!ref) {
    return parseError("invalid_ref", "The URL is missing a branch, tag, or commit ref.");
  }

  result.ref = ref;
  result.path = pathSegments.join("/");

  if (kind === "blob" && result.path.length === 0) {
    return parseError("invalid_path", "Blob URLs must include a file path.");
  }

  return result;
}
