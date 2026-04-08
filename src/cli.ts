#!/usr/bin/env bun
/**
 * cli.ts — Jray CLI Entry Point (v2 — adds --filter and --select)
 *
 * USAGE:
 *   jray data.json                         # flatten to lines
 *   jray data.json --filter "user"         # show only lines under "user"
 *   jray data.json --select "user"         # extract "user" subtree as JSON
 *   jray --ungron data.gron               # reconstruct JSON from flat lines
 *   cat data.json | jray --filter "tags"  # works with pipes too
 */

import { flatten } from "./flatten";
import { unflatten } from "./unflatten";
import { filterLines, selectPath } from "./filter";

// ─── Argument Parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

const isUngron    = args.includes("--ungron")  || args.includes("-u");
const showHelp    = args.includes("--help")    || args.includes("-h");
const showVersion = args.includes("--version") || args.includes("-v");

// Value flags — grab the argument that comes AFTER the flag
// e.g. ["--filter", "user.name"] → "user.name"
function getFlagValue(flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  const val = args[idx + 1];
  if (!val || val.startsWith("-")) return null;
  return val;
}

const filterPattern = getFlagValue("--filter") ?? getFlagValue("-f");
const selectPattern = getFlagValue("--select") ?? getFlagValue("-s");

// Non-flag arguments = file paths (skip values that belong to flags)
const filePaths = args.filter((a, i) => {
  if (a.startsWith("-")) return false;
  const prev = args[i - 1];
  if (prev === "--filter" || prev === "-f") return false;
  if (prev === "--select" || prev === "-s") return false;
  return true;
});

// ─── Help & Version ───────────────────────────────────────────────────────────

if (showVersion) {
  try {
    const pkg = await Bun.file(new URL("../package.json", import.meta.url)).json();
    console.log(`jray v${pkg.version}`);
  } catch {
    console.log("jray v0.1.0");
  }
  process.exit(0);
}

if (showHelp) {
  console.log(`
jray — a modern JSON flattener and query tool

USAGE:
  jray [options] [file]

OPTIONS:
  -u, --ungron          Unflatten jray lines back into JSON
  -f, --filter <path>   Show only lines matching the given path
  -s, --select <path>   Extract a path as JSON (like jq)
  -v, --version         Show version
  -h, --help            Show this help

EXAMPLES:
  jray data.json                       Flatten JSON to greppable lines
  jray data.json --filter "user"       Show all lines under "user"
  jray data.json --filter "user.name"  Show only the name field
  jray data.json --select "user"       Extract user object as JSON
  jray data.json --select "tags"       Extract tags array as JSON
  jray --ungron data.gron              Reconstruct JSON from flat lines
  cat data.json | jray                 Works with stdin pipes too
`);
  process.exit(0);
}

// ─── Input Reading ────────────────────────────────────────────────────────────

async function readInput(): Promise<string> {
  if (filePaths.length > 0) {
    const filePath = filePaths[0]!;
    try {
      return await Bun.file(filePath).text();
    } catch {
      console.error(`jray: cannot read file '${filePath}'`);
      process.exit(1);
    }
  }

  if (process.stdin.isTTY) {
    console.error("jray: no input. Provide a file or pipe JSON to stdin.");
    console.error("Run 'jray --help' for usage.");
    process.exit(1);
  }

  return await Bun.stdin.text();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const input = await readInput();

  // Mode: --ungron
  if (isUngron) {
    const lines = input.split("\n");
    const result = unflatten(lines);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // All other modes: parse JSON first
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    console.error(`jray: invalid JSON input`);
    if (err instanceof Error) console.error(`  ${err.message}`);
    process.exit(1);
  }

  // Flatten to lines — always step 1
  const lines = flatten(parsed);

  // Mode: --select (extract subtree as JSON)
  if (selectPattern) {
    const result = selectPath(lines, selectPattern);
    if (result === null) {
      console.error(`jray: no match for path "${selectPattern}"`);
      process.exit(1);
    }
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Mode: --filter (show matching flat lines)
  if (filterPattern) {
    const { lines: matched, count } = filterLines(lines, filterPattern);
    if (count === 0) {
      console.error(`jray: no match for path "${filterPattern}"`);
      process.exit(1);
    }
    for (const line of matched) {
      console.log(line);
    }
    return;
  }

  // Default: plain flatten
  for (const line of lines) {
    console.log(line);
  }
}

main().catch((err) => {
  console.error(`jray: unexpected error — ${err.message}`);
  process.exit(1);
});