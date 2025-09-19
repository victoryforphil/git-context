import type { FileNode } from "../github/types";

function indent(depth: number): string {
  return "  ".repeat(Math.max(0, depth));
}

function formatFile(node: FileNode): string {
  const base = `${indent(node.depth)}- \`${node.name}\``;
  const links = [`[RAW](${node.urlRaw})`, `[HTML](${node.urlHtml})`];
  const size = typeof node.size === "number" && Number.isFinite(node.size) ? ` (${formatBytes(node.size)})` : "";
  return `${base} — ${links.join(" · ")}${size}`;
}

function formatDirectory(node: FileNode): string {
  const label = `${indent(node.depth)}- ${node.name}/`;
  const link = node.urlHtml ? ` — [HTML](${node.urlHtml})` : "";
  return `${label}${link}`;
}

function formatBytes(bytes: number): string {
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

export function formatTree(nodes: FileNode[]): string {
  const sorted = nodes
    .slice()
    .sort((a, b) => {
      if (a.path === b.path) {
        if (a.type === b.type) return 0;
        return a.type === "dir" ? -1 : 1;
      }
      const parentA = a.path.split("/").slice(0, -1).join("/");
      const parentB = b.path.split("/").slice(0, -1).join("/");
      if (parentA === parentB && a.type !== b.type) {
        return a.type === "dir" ? -1 : 1;
      }
      return a.path.localeCompare(b.path);
    });

  return sorted
    .map((node) => (node.type === "dir" ? formatDirectory(node) : formatFile(node)))
    .join("\n");
}
