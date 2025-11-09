import {Stats} from "node:fs";

export interface WalkEntry {
  path: string;
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  depth: number;
  stats?: Stats;
}

export interface WalkOptions {
  recursive?: boolean;
  maxDepth?: number;
  followSymlinks?: boolean;
  filter?: (entry: WalkEntry) => boolean;
  onError?: (error: Error, entry: WalkEntry) => void;
  order?: "pre" | "post";
}
