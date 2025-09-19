"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, FileText, Folder } from "lucide-react";

import type { FileNode } from "@/lib/github/types";

interface DirectoryNode {
  type: "dir";
  name: string;
  path: string;
  urlHtml?: string;
  children: TreeItem[];
}

interface FileLeaf {
  type: "file";
  name: string;
  path: string;
  urlHtml: string;
  urlRaw: string;
  size?: number;
}

type TreeItem = DirectoryNode | FileLeaf;

interface FileTreeProps {
  nodes: FileNode[];
  basePath?: string;
  rootLabel?: string;
  rootHref?: string;
}

export function FileTree({ nodes, basePath = "", rootLabel = "File tree", rootHref }: FileTreeProps) {
  const tree = useMemo(() => buildFileTree(nodes, basePath), [nodes, basePath]);
  const hasEntries = tree.children.length > 0;

  return (
    <div className="h-full flex flex-col bg-card text-card-foreground">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40">
        <div>
          <p className="text-sm font-semibold leading-none">{rootLabel}</p>
          <p className="text-xs text-muted-foreground">
            {hasEntries ? "Browse the discovered structure." : "Generate an index to preview the tree."}
          </p>
        </div>
        {rootHref ? (
          <a
            href={rootHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span>View on GitHub</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <div className="flex-1 overflow-auto px-4 py-3 text-sm">
        {hasEntries ? (
          <ul className="space-y-1">
            {tree.children.map((item) =>
              item.type === "dir" ? (
                <DirectoryTreeItem key={item.path} item={item} depth={0} />
              ) : (
                <FileTreeLeaf key={item.path} item={item} />
              )
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No files yet.</p>
        )}
      </div>
    </div>
  );
}

function DirectoryTreeItem({ item, depth }: { item: DirectoryNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = item.children.length > 0;

  return (
    <li>
      <div className="rounded-md">
        <div className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex flex-1 items-center gap-2 text-left font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={open ? "true" : "false"}
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
              aria-hidden="true"
            />
            <Folder className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            <span className="truncate">{item.name}</span>
          </button>
          {item.urlHtml ? (
            <a
              href={item.urlHtml}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              aria-label={`Open ${item.name} on GitHub`}
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">Open</span>
              <span className="sr-only">Open {item.name} in a new tab</span>
            </a>
          ) : null}
        </div>
        {hasChildren && open ? (
          <ul className="ml-5 mt-2 border-l border-border/60 pl-3">
            {item.children.map((child) =>
              child.type === "dir" ? (
                <DirectoryTreeItem key={child.path} item={child} depth={depth + 1} />
              ) : (
                <FileTreeLeaf key={child.path} item={child} />
              )
            )}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

function FileTreeLeaf({ item }: { item: FileLeaf }) {
  const sizeLabel = typeof item.size === "number" ? formatBytes(item.size) : null;

  return (
    <li>
      <div className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <a
          href={item.urlHtml}
          target="_blank"
          rel="noreferrer"
          className="flex-1 truncate font-medium hover:underline"
        >
          {item.name}
        </a>
        <div className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
          {sizeLabel ? <span>{sizeLabel}</span> : null}
          <a
            href={item.urlRaw}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
            aria-label={`Open ${item.name} as a RAW file`}
          >
            RAW
          </a>
        </div>
      </div>
    </li>
  );
}

function buildFileTree(nodes: FileNode[], basePath: string): DirectoryNode {
  const root: DirectoryNode = {
    type: "dir",
    name: basePath || "/",
    path: basePath,
    urlHtml: undefined,
    children: [],
  };

  const dirMap = new Map<string, DirectoryNode>();
  dirMap.set("", root);

  for (const node of nodes) {
    const relative = toRelativePath(node.path, basePath);
    if (!relative) {
      if (node.type === "dir") {
        root.urlHtml = root.urlHtml ?? node.urlHtml;
      }
      continue;
    }

    const segments = relative.split("/");
    let parentKey = "";
    let parentDir = root;

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      parentKey = parentKey ? `${parentKey}/${segment}` : segment;
      let dir = dirMap.get(parentKey);
      if (!dir) {
        const fullPath = basePath ? `${basePath}/${parentKey}` : parentKey;
        dir = {
          type: "dir",
          name: segment,
          path: fullPath,
          urlHtml: undefined,
          children: [],
        };
        dirMap.set(parentKey, dir);
        parentDir.children.push(dir);
      }
      parentDir = dir;
    }

    const name = segments[segments.length - 1] || node.name;
    if (node.type === "dir") {
      const key = segments.join("/");
      let dir = dirMap.get(key);
      if (!dir) {
        dir = {
          type: "dir",
          name,
          path: node.path,
          urlHtml: node.urlHtml,
          children: [],
        };
        dirMap.set(key, dir);
        parentDir.children.push(dir);
      } else {
        dir.name = name;
        dir.path = node.path;
        dir.urlHtml = node.urlHtml;
      }
    } else {
      parentDir.children.push({
        type: "file",
        name,
        path: node.path,
        urlHtml: node.urlHtml,
        urlRaw: node.urlRaw,
        size: node.size,
      });
    }
  }

  sortDirectoryChildren(root);
  return root;
}

function sortDirectoryChildren(dir: DirectoryNode) {
  dir.children.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === "dir" ? -1 : 1;
  });

  for (const child of dir.children) {
    if (child.type === "dir") {
      sortDirectoryChildren(child);
    }
  }
}

function toRelativePath(path: string, basePath: string): string {
  if (!basePath) {
    return path;
  }
  if (path === basePath) {
    return "";
  }
  if (path.startsWith(`${basePath}/`)) {
    return path.slice(basePath.length + 1);
  }
  return path;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
