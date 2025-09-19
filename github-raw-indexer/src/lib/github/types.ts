export type TargetKind = "repo" | "tree" | "blob";

export interface ParsedTarget {
  owner: string;
  repo: string;
  ref?: string;
  path: string;
  kind: TargetKind;
}

export type FileNodeType = "file" | "dir";

export interface FileNode {
  type: FileNodeType;
  name: string;
  path: string;
  depth: number;
  size?: number;
  urlRaw: string;
  urlHtml: string;
}

export interface TreeEntry {
  path: string;
  type: "tree" | "blob" | "commit";
  size?: number;
}

export interface ContentFile {
  type: "file" | "dir" | "symlink" | "submodule";
  name: string;
  path: string;
  size?: number;
  download_url?: string;
}
