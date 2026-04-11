#!/usr/bin/env bun
/**
 * cli.ts — Jray CLI v0.2.0
 *
 * NEW IN v0.2.0:
 *   - Color output (auto-detected, respects NO_COLOR standard)
 *   - URL fetching: jray https://api.github.com/users/1
 *   - --no-color / -m flag to force monochrome
 *   - --values flag to print just raw values
 */

import { flatten }                         from "./flatten";
import { unflatten }                       from "./unflatten";
import { filterLines, selectPath }         from "./filter";
import { colorizeLines, isColorSupported } from "./color";
import { isURL, fetchJSON }                from "./fetch";

const args = process.argv.slice(2);

const isUngron    = args.includes("--ungron")   || args.includes("-u");
const showHelp    = args.includes("--help")     || args.includes("-h");
const showVersion = args.includes("--version")  || args.includes("-v");
const noColor     = args.includes("--no-color") || args.includes("-m");
const valuesOnly  = args.includes("--values");

function getFlagValue(flag: string, short?: string): string | null {
  for (const f of [flag, short].filter(Boolean) as string[]) {
    const idx = args.indexOf(f);
    if (idx === -1) continue;
    const val = args[idx + 1];
    if (!val || val.startsWith("-")) continue;
    return val;
  }
  return null;
}

const filterPattern = getFlagValue("--filter", "-f");
const selectPattern = getFlagValue("--select", "-s");

const filePaths = args.filter((a, i) => {
  if (a.startsWith("-")) return false;
  const prev = args[i - 1];
  if (prev && ["--filter", "-f", "--select", "-s"].includes(prev)) return false;
  return true;
});

if (showVersion) {
  try {
    const pkg = await Bun.file(new URL("../package.json", import.meta.url)).json();
    console.log(`jray v${pkg.version}`);
  } catch { console.log("jray v0.2.0"); }
  process.exit(0);
}

if (showHelp) {
  console.log(`
jray — a modern JSON flattener and query tool

USAGE:
  jray [options] [file|url]

OPTIONS:
  -u, --ungron          Reconstruct JSON from flat jray lines
  -f, --filter <path>   Show only lines matching a path
  -s, --select <path>   Extract a path as JSON
      --values          Print just the values (no paths)
  -m, --no-color        Disable color output
  -v, --version         Show version
  -h, --help            Show help

EXAMPLES:
  jray data.json                       Flatten a local file
  jray https://api.github.com/users/1  Flatten a URL directly
  jray data.json --filter "user"       Filter by path
  jray data.json --select "billing"    Extract subtree as JSON
  jray data.json --values              Print only values
  jray --ungron data.gron              Reconstruct JSON
  cat data.json | jray --filter "tags" Pipe from stdin
`);
  process.exit(0);
}

async function readInput(): Promise<string> {
  if (filePaths.length > 0) {
    const input = filePaths[0];
    if (input && isURL(input)) {
      try { return await fetchJSON(input); }
      catch (err) {
        console.error(`jray: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
    }
    if (!input) {
      console.error(`jray: cannot read file`);
      process.exit(1);
    }
    try { return await Bun.file(input).text(); }
    catch {
      console.error(`jray: cannot read file '${input}'`);
      process.exit(1);
    }
  }
  if (process.stdin.isTTY) {
    console.error("jray: no input. Provide a file, URL, or pipe JSON to stdin.");
    console.error("Run 'jray --help' for usage.");
    process.exit(1);
  }
  return await Bun.stdin.text();
}

function printLines(lines: string[]): void {
  const useColor = !noColor && isColorSupported();
  const output = useColor ? colorizeLines(lines) : lines;
  for (const line of output) console.log(line);
}

function extractValues(lines: string[]): string[] {
  return lines.map(line => {
    const delimIdx = line.indexOf(" = ");
    if (delimIdx === -1) return line;
    const raw = line.slice(delimIdx + 3).trim();
    if (raw.startsWith('"') && raw.endsWith('"')) {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return raw;
  });
}

async function main() {
  const input = await readInput();

  if (isUngron) {
    const result = unflatten(input.split("\n"));
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  let parsed: unknown;
  try { parsed = JSON.parse(input); }
  catch (err) {
    console.error(`jray: invalid JSON input`);
    if (err instanceof Error) console.error(`  ${err.message}`);
    process.exit(1);
  }

  const lines = flatten(parsed);

  if (selectPattern) {
    const result = selectPath(lines, selectPattern);
    if (result === null) {
      console.error(`jray: no match for path "${selectPattern}"`);
      process.exit(1);
    }
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (filterPattern) {
    const { lines: matched, count } = filterLines(lines, filterPattern);
    if (count === 0) {
      console.error(`jray: no match for path "${filterPattern}"`);
      process.exit(1);
    }
    if (valuesOnly) {
      for (const v of extractValues(matched)) console.log(v);
    } else {
      printLines(matched);
    }
    return;
  }

  if (valuesOnly) {
    for (const v of extractValues(lines)) console.log(v);
    return;
  }

  printLines(lines);
}

main().catch(err => {
  console.error(`jray: unexpected error — ${err.message}`);
  process.exit(1);
});