import { AppError } from "./errors";
import type { ContentFile, ParsedTarget, TreeEntry } from "./types";

const API_BASE = "https://api.github.com";
const USER_AGENT = "github-raw-indexer";

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("User-Agent", USER_AGENT);

  const token = process.env.GITHUB_TOKEN;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function githubFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: buildHeaders(init?.headers),
      cache: "no-store",
    });
  } catch (error) {
    throw new AppError("network_error", "Unable to reach GitHub. Check your connection and try again.", {
      status: 503,
      cause: error,
    });
  }

  if (!response.ok) {
    await handleGitHubError(response);
  }

  return response;
}

async function parseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    throw new AppError("invalid_response", "Unexpected response from GitHub API.", {
      status: response.status,
      cause: error,
    });
  }
}

function parseRetryAfter(response: Response): number | undefined {
  const retryAfterHeader = response.headers.get("retry-after");
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds) && seconds >= 0) {
      return seconds;
    }
  }

  const resetHeader = response.headers.get("x-ratelimit-reset");
  if (resetHeader) {
    const resetEpoch = Number(resetHeader) * 1000;
    if (!Number.isNaN(resetEpoch)) {
      const diff = Math.ceil((resetEpoch - Date.now()) / 1000);
      if (diff > 0) {
        return diff;
      }
    }
  }

  return undefined;
}

async function handleGitHubError(response: Response): Promise<never> {
  const status = response.status;
  let message = `GitHub API request failed with status ${status}.`;
  let code = "github_error";
  let details: Record<string, unknown> | undefined;

  let body: any = undefined;
  try {
    body = await response.json();
  } catch {
    // ignore
  }

  if (body && typeof body.message === "string") {
    message = body.message;
  } else if (status === 404) {
    message = "The requested repository or path could not be found.";
  }

  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  const retryAfterSeconds = parseRetryAfter(response);

  if (status === 401) {
    code = "unauthorized";
    message = "GitHub rejected the request. Check if the repository is private or if the token is invalid.";
  } else if (status === 403 && remaining === "0") {
    code = "rate_limit";
    const retryText = retryAfterSeconds ? ` Try again in about ${retryAfterSeconds} seconds.` : "";
    message = `GitHub rate limit exceeded.${retryText}`;
  } else if (status === 403) {
    code = "forbidden";
    if (retryAfterSeconds) {
      message = `GitHub is temporarily throttling requests. Retry in ${retryAfterSeconds} seconds.`;
    }
  } else if (status === 404) {
    code = "not_found";
  }

  if (remaining || reset || retryAfterSeconds) {
    details = {
      ...details,
      rateLimitRemaining: remaining !== null ? Number(remaining) : undefined,
      rateLimitReset: reset !== null ? Number(reset) : undefined,
      retryAfterSeconds,
    };
  }

  if (body && typeof body.documentation_url === "string") {
    details = { ...details, documentationUrl: body.documentation_url };
  }

  throw new AppError(code, message, { status, details });
}

function encodePath(path: string): string {
  return path
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export async function resolveRef(target: ParsedTarget): Promise<string> {
  if (target.ref) {
    return target.ref;
  }

  const response = await githubFetch(`/repos/${target.owner}/${target.repo}`);
  const data = await parseJson(response);
  if (typeof data?.default_branch !== "string") {
    throw new AppError("missing_default_branch", "Unable to determine the default branch for the repository.");
  }

  return data.default_branch;
}

export async function fetchTree(owner: string, repo: string, ref: string): Promise<{ entries: TreeEntry[]; truncated: boolean }>
{
  const response = await githubFetch(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`);
  const data = await parseJson(response);

  if (!Array.isArray(data?.tree)) {
    throw new AppError("invalid_response", "GitHub returned an unexpected tree payload.");
  }

  const entries: TreeEntry[] = data.tree.map((entry: any) => ({
    path: typeof entry.path === "string" ? entry.path : "",
    type: entry.type,
    size: typeof entry.size === "number" ? entry.size : undefined,
  }));

  return { entries, truncated: Boolean(data.truncated) };
}

export async function listContents(owner: string, repo: string, ref: string, path: string): Promise<ContentFile[]> {
  const encodedPath = encodePath(path);
  const suffix = encodedPath ? `/${encodedPath}` : "";
  const response = await githubFetch(`/repos/${owner}/${repo}/contents${suffix}?ref=${encodeURIComponent(ref)}`);
  const data = await parseJson(response);

  if (!Array.isArray(data)) {
    throw new AppError("not_a_directory", "Expected a directory listing but received a file.");
  }

  return data.map(mapContentFile);
}

export async function fetchContent(owner: string, repo: string, ref: string, path: string): Promise<ContentFile> {
  const encodedPath = encodePath(path);
  const suffix = encodedPath ? `/${encodedPath}` : "";
  const response = await githubFetch(`/repos/${owner}/${repo}/contents${suffix}?ref=${encodeURIComponent(ref)}`);
  const data = await parseJson(response);

  if (!data || typeof data !== "object" || typeof data.type !== "string") {
    throw new AppError("invalid_response", "GitHub returned an unexpected content payload.");
  }

  return mapContentFile(data);
}

function mapContentFile(raw: any): ContentFile {
  return {
    type: raw.type,
    name: typeof raw.name === "string" ? raw.name : "",
    path: typeof raw.path === "string" ? raw.path : "",
    size: typeof raw.size === "number" ? raw.size : undefined,
    download_url: typeof raw.download_url === "string" ? raw.download_url : undefined,
  };
}

export { githubFetch };
