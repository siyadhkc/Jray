#!/usr/bin/env bun
/**
 * cli.ts — Jray CLI Entry Point
 *
 * This is the "front door" of your tool. It handles:
 *   1. Reading input (from a file argument OR stdin pipe)
 *   2. Parsing command-line flags
 *   3. Calling the right engine function (flatten or unflatten)
 *   4. Printing output to stdout
 *
 * WHY SEPARATE CLI FROM LOGIC:
 * A core principle in good CLI design: your business logic (flatten, unflatten)
 * should be pure functions that know NOTHING about files or terminals. This
 * makes them testable in isolation. cli.ts is the only place that touches
 * process.stdin, process.argv, and console.log.
 *
 * USAGE EXAMPLES:
 *   jray data.json                   # flatten a file
 *   jray --ungron data.gron          # unflatten a file
 *   cat data.json | jray             # flatten from stdin
 *   cat data.gron | jray --ungron    # unflatten from stdin
 *   jray data.json | grep "user"     # pipe to grep (the killer use case)
 */

import { flatten } from "./flatten";
import { unflatten } from "./unflatten";

// ─── Argument Parsing ─────────────────────────────────────────────────────────

/**
 * WHY MANUAL ARG PARSING (not a library like commander/yargs):
 * For an MVP, manual parsing keeps zero dependencies. Once you add more flags,
 * switch to a library. For now, this is cleaner.
 *
 * process.argv looks like: ["bun", "/path/to/cli.ts", "--ungron", "file.json"]
 * We slice off the first two entries (bun + script path) to get user args.
 */
const args = process.argv.slice(2);

// Flags
const isUngron = args.includes("--ungron") || args.includes("-u");
const showHelp = args.includes("--help") || args.includes("-h");
const showVersion = args.includes("--version") || args.includes("-v");

// Non-flag arguments are treated as file paths
const filePaths = args.filter((a) => !a.startsWith("-"));

// ─── Help & Version ───────────────────────────────────────────────────────────

if (showVersion) {
  // Read version from package.json at runtime.
  // WHY: Single source of truth — version lives in package.json, not hardcoded here.
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
  -u, --ungron    Unflatten jray output back into JSON
  -v, --version   Show version
  -h, --help      Show this help

EXAMPLES:
  jray data.json                   Flatten JSON to greppable lines
  jray --ungron data.gron          Reconstruct JSON from flat lines
  cat data.json | jray             Flatten from stdin
  jray data.json | grep "user"     Grep through flattened output
  jray data.json | jray --ungron   Round-trip (should equal input)
`);
  process.exit(0);
}

// ─── Input Reading ────────────────────────────────────────────────────────────

/**
 * readInput(): Promise<string>
 *
 * Reads raw text either from:
 *   a) A file path provided as argument: `jray data.json`
 *   b) stdin pipe:                       `cat data.json | jray`
 *
 * WHY THIS ORDER: File arg takes priority. If no file, we fall back to stdin.
 * This matches the convention of tools like `cat`, `jq`, `gron`.
 *
 * WHY async/await: File I/O is async. Bun's file API is promise-based.
 * Using async/await (not callbacks) is the modern, readable approach.
 */
async function readInput(): Promise<string> {
  if (filePaths.length > 0) {
    // Read from file
    const filePath = filePaths[0];
    if (!filePath) {
      console.error(`jray: invalid file path`);
      process.exit(1);
    }
    try {
      // Bun.file() is Bun's native fast file reader.
      // WHY Bun.file over fs.readFileSync: It's faster and native to our runtime.
      return await Bun.file(filePath).text();
    } catch (err) {
      // User-friendly error. Always tell the user WHAT went wrong AND WHICH file.
      console.error(`jray: cannot read file '${filePath}'`);
      process.exit(1);
    }
  }

  // No file arg — read from stdin.
  // WHY check isTTY: If stdin is a terminal (user ran `jray` with no args and
  // no pipe), show help instead of hanging waiting for input.
  if (process.stdin.isTTY) {
    console.error("jray: no input. Provide a file or pipe JSON to stdin.");
    console.error("Run 'jray --help' for usage.");
    process.exit(1);
  }

  // Read all of stdin.
  // WHY Bun.stdin.text(): Clean, async, reads until EOF.
  return await Bun.stdin.text();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * main() — orchestrates the whole tool
 *
 * WHY WRAP IN A FUNCTION: Top-level await works in Bun, but wrapping in
 * an explicit `main()` makes the flow readable and errors easier to catch.
 */
async function main() {
  const input = await readInput();

  if (isUngron) {
    // ── Unflatten mode ──────────────────────────────────────────────────────
    // Input: flat lines like "json.user.name = \"Alice\""
    // Output: pretty-printed JSON

    const lines = input.split("\n");
    const result = unflatten(lines);

    // WHY JSON.stringify with 2-space indent:
    // Pretty-printing is friendlier for humans. The `2` is the indent level.
    // `null` is the replacer (we want all keys, no filtering).
    console.log(JSON.stringify(result, null, 2));
  } else {
    // ── Flatten mode (default) ──────────────────────────────────────────────
    // Input: JSON text
    // Output: flat lines, one per primitive

    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      // Give a helpful error if the input isn't valid JSON.
      // WHY include the raw error: Helps the user debug their JSON.
      console.error(`jray: invalid JSON input`);
      if (err instanceof Error) {
        console.error(`  ${err.message}`);
      }
      process.exit(1);
    }

    const lines = flatten(parsed);

    // Print each line.
    // WHY NOT console.log(lines.join("\n")): join + log works, but this
    // streams output line-by-line, which is more memory-efficient for
    // large JSON files. Good habit even if it doesn't matter at MVP scale.
    for (const line of lines) {
      console.log(line);
    }
  }
}

// Run it. Catch any unexpected errors at the top level.
// WHY .catch here: If main() throws something we didn't handle, this ensures
// a clean error message instead of a scary stack trace.
main().catch((err) => {
  console.error(`jray: unexpected error — ${err.message}`);
  process.exit(1);
});