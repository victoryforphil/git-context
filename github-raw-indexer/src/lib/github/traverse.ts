import { fetchContent, fetchTree, listContents } from "./api";
import { AppError } from "./errors";
import type { FileNode, ParsedTarget, TreeEntry } from "./types";

const RAW_BASE = "https://raw.githubusercontent.com";
const HTML_BASE = "https://github.com";

function encodeRef(ref: string): string {
  return ref
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function encodePath(path: string): string {
  return path
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function relativePath(fullPath: string, basePath: string): string {
  if (!basePath) {
    return fullPath;
  }
  if (fullPath === basePath) {
    return "";
  }
  if (fullPath.startsWith(`${basePath}/`)) {
    return fullPath.slice(basePath.length + 1);
  }
  return "";
}

export function depthFromRelativePath(relative: string): number {
  if (!relative) {
    return 0;
  }
  return relative.split("/").length - 1;
}

function buildFileNode(params: {
  owner: string;
  repo: string;
  ref: string;
  path: string;
  name: string;
  depth: number;
  type: FileNode["type"];
  size?: number;
}): FileNode {
  const { owner, repo, ref, path, name, depth, type, size } = params;
  const encodedRef = encodeRef(ref);
  const encodedPath = encodePath(path);
  const urlHtmlBase = type === "file" ? "blob" : "tree";
  return {
    type,
    name,
    path,
    depth,
    size,
    urlRaw: type === "file" ? `${RAW_BASE}/${owner}/${repo}/${encodedRef}/${encodedPath}` : "",
    urlHtml: `${HTML_BASE}/${owner}/${repo}/${urlHtmlBase}/${encodedRef}/${encodedPath}`,
  };
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return nodes.slice().sort((a, b) => {
    if (a.path === b.path) {
      if (a.type === b.type) return 0;
      return a.type === "dir" ? -1 : 1;
    }
    const parentA = parentPath(a.path);
    const parentB = parentPath(b.path);
    if (parentA === parentB && a.type !== b.type) {
      return a.type === "dir" ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });
}

function parentPath(path: string): string {
  const segments = path.split("/");
  segments.pop();
  return segments.join("/");
}

function normalizeDepth(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function ensureResolvedRef(target: ParsedTarget): asserts target is ParsedTarget & { ref: string } {
  if (!target.ref) {
    throw new AppError("missing_ref", "Traversal requires a resolved Git ref.");
  }
}

function ensureTreeHasPrefix(entries: TreeEntry[], prefix: string): boolean {
  if (!prefix) {
    return true;
  }
  const prefixWithSlash = `${prefix}/`;
  return entries.some((entry) => entry.path === prefix || entry.path.startsWith(prefixWithSlash));
}

export async function traverse(target: ParsedTarget, maxDepthInput: number): Promise<FileNode[]> {
  ensureResolvedRef(target);
  const maxDepth = normalizeDepth(maxDepthInput);

  if (target.kind === "blob") {
    return traverseBlob(target, maxDepth);
  }

  const tree = await fetchTree(target.owner, target.repo, target.ref);

  if (!tree.truncated && target.path && !ensureTreeHasPrefix(tree.entries, target.path)) {
    throw new AppError("not_found", "The requested path does not exist in this ref.");
  }

  if (!tree.truncated) {
    const nodes = collectFromTree(tree.entries, target, maxDepth);
    return sortNodes(nodes);
  }

  // Tree truncated; fallback to scoped traversal via contents API
  return sortNodes(await traverseWithContents(target, maxDepth));
}

async function traverseBlob(target: ParsedTarget & { ref: string }, maxDepth: number): Promise<FileNode[]> {
  const content = await fetchContent(target.owner, target.repo, target.ref, target.path);
  if (content.type !== "file") {
    if (content.type === "dir") {
      throw new AppError("expected_file", "The provided blob URL points to a directory. Use a tree URL instead.");
    }
    throw new AppError("unsupported_blob", `Unsupported blob type: ${content.type}.`);
  }
  return [
    buildFileNode({
      owner: target.owner,
      repo: target.repo,
      ref: target.ref,
      path: content.path,
      name: content.name,
      depth: 0,
      size: content.size,
      type: "file",
    }),
  ];
}

function collectFromTree(entries: TreeEntry[], target: ParsedTarget & { ref: string }, maxDepth: number): FileNode[] {
  const prefix = target.path;
  const nodes: FileNode[] = [];
  const prefixWithSlash = prefix ? `${prefix}/` : "";

  for (const entry of entries) {
    if (!entry.path) {
      continue;
    }

    const nodeType = mapTreeType(entry);
    if (!nodeType) {
      continue;
    }

    if (prefix) {
      if (entry.path === prefix) {
        continue;
      }
      if (!entry.path.startsWith(prefixWithSlash)) {
        continue;
      }
    }

    const relative = prefix ? entry.path.slice(prefix.length + 1) : entry.path;
    if (!relative) {
      continue;
    }

    const depth = depthFromRelativePath(relative);
    if (depth > maxDepth) {
      continue;
    }

    nodes.push(
      buildFileNode({
        owner: target.owner,
        repo: target.repo,
        ref: target.ref,
        path: entry.path,
        name: entry.path.split("/").pop() ?? entry.path,
        depth,
        size: entry.size,
        type: nodeType,
      })
    );
  }

  if (nodes.length === 0 && prefix) {
    throw new AppError("not_found", "The requested path does not contain any files within the selected depth.");
  }

  return nodes;
}

function mapTreeType(entry: TreeEntry): FileNode["type"] | null {
  if (entry.type === "blob") {
    return "file";
  }
  if (entry.type === "tree" || entry.type === "commit") {
    return "dir";
  }
  return null;
}

async function traverseWithContents(target: ParsedTarget & { ref: string }, maxDepth: number): Promise<FileNode[]> {
  const nodes: FileNode[] = [];
  await walkDirectory(target, target.path, maxDepth, nodes);
  if (nodes.length === 0 && target.path) {
    throw new AppError("not_found", "The requested path does not contain any files within the selected depth.");
  }
  return nodes;
}

async function walkDirectory(
  target: ParsedTarget & { ref: string },
  currentPath: string,
  maxDepth: number,
  nodes: FileNode[]
): Promise<void> {
  const entries = await listContents(target.owner, target.repo, target.ref, currentPath);
  entries.sort((a, b) => {
    if (a.type !== b.type) {
      if (a.type === "dir") return -1;
      if (b.type === "dir") return 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const entry of entries) {
    if (!entry.path) {
      continue;
    }

    const relative = relativePath(entry.path, target.path);
    if (!relative) {
      continue;
    }

    const depth = depthFromRelativePath(relative);
    if (depth > maxDepth) {
      continue;
    }

    if (entry.type === "file" || entry.type === "symlink") {
      nodes.push(
        buildFileNode({
          owner: target.owner,
          repo: target.repo,
          ref: target.ref,
          path: entry.path,
          name: entry.name,
          depth,
          size: entry.size,
          type: "file",
        })
      );
    } else if (entry.type === "dir" || entry.type === "submodule") {
      nodes.push(
        buildFileNode({
          owner: target.owner,
          repo: target.repo,
          ref: target.ref,
          path: entry.path,
          name: entry.name,
          depth,
          type: "dir",
        })
      );
      if (depth < maxDepth) {
        await walkDirectory(target, entry.path, maxDepth, nodes);
      }
    }
  }
}

export { sortNodes };
