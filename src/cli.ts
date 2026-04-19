#!/usr/bin/env bun
/**
 * cli.ts — Jray CLI v0.2.2
 */

import { flatten }                         from "./flatten";
import { unflatten }                       from "./unflatten";
import { filterLines, selectPath }         from "./filter";
import { colorizeLines, isColorSupported } from "./color";
import { isURL, fetchJSON }                from "./fetch";
import { getPackageVersion }               from "./version";

export function getFlagValue(args: string[], flag: string, short?: string): string | null {
  for (const f of [flag, short].filter(Boolean) as string[]) {
    const idx = args.indexOf(f);
    if (idx === -1) continue;
    const val = args[idx + 1];
    if (!val || val.startsWith("-")) continue;
    return val;
  }
  return null;
}

export function getFilePaths(args: string[]): string[] {
  return args.filter((a, i) => {
    if (a.startsWith("-")) return false;
    const prev = args[i - 1];
    if (prev && ["--filter", "-f", "--select", "-s"].includes(prev)) return false;
    return true;
  });
}

function printHelp(): void {
  console.log(`
jray — a modern JSON flattener and query tool

USAGE:
  jray [options] [file|url]

OPTIONS:
  -u, --ungron          Reconstruct JSON from flat jray lines
  -f, --filter <path>   Show only lines matching a path
  -s, --select <path>   Extract a path as JSON
      --values          Print just the values (no paths)
      --sort            Sort keys alphabetically
      --count           Print only the number of matches
  -c, --compact         Compact JSON output (no whitespace)
  -r, --raw             Print raw strings (no quotes)
  -m, --no-color        Disable color output
  -v, --version         Show version
  -h, --help            Show help

EXAMPLES:
  jray data.json                      Flatten a local file
  jray data.json --sort               Flatten and sort keys
  jray data.json --filter "user"      Filter by path
  jray data.json --filter "user" --count
  jray data.json --select "billing"   Extract subtree as JSON
  jray data.json --values --raw       Print only values without quotes
  jray --ungron data.gron             Reconstruct JSON
  cat data.json | jray --select "user" --compact
`);
}

async function readInput(filePaths: string[]): Promise<string> {
  if (filePaths.length > 0) {
    if (filePaths.length > 1) {
      console.warn(`jray: multiple files provided, using only '${filePaths[0]}'`);
    }
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

export async function main(args = process.argv.slice(2)) {
  const isUngron     = args.includes("--ungron")   || args.includes("-u");
  const showHelp     = args.includes("--help")     || args.includes("-h");
  const showVersion  = args.includes("--version")  || args.includes("-v");
  const noColor      = args.includes("--no-color") || args.includes("-m");
  const valuesOnly   = args.includes("--values");
  const shouldSort   = args.includes("--sort");
  const showCount    = args.includes("--count");
  const isCompact    = args.includes("--compact")  || args.includes("-c");
  const rawOutput    = args.includes("--raw")      || args.includes("-r");
  const filterPattern = getFlagValue(args, "--filter", "-f");
  const selectPattern = getFlagValue(args, "--select", "-s");
  const filePaths = getFilePaths(args);

  if (showVersion) {
    console.log(`jray v${await getPackageVersion()}`);
    return;
  }

  if (showHelp) {
    printHelp();
    return;
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
      const rawValue = line.slice(delimIdx + 3).trim();
      if (rawOutput && rawValue.startsWith('"') && rawValue.endsWith('"')) {
        try { return JSON.parse(rawValue).toString(); } catch { return rawValue; }
      }
      return rawValue;
    });
  }

  function formatJSON(val: unknown): string {
    if (rawOutput && typeof val === "string") return val;
    return JSON.stringify(val, null, isCompact ? 0 : 2);
  }

  const input = await readInput(filePaths);

  if (isUngron) {
    const result = unflatten(input.split("\n"));
    console.log(formatJSON(result));
    return;
  }

  let parsed: unknown;
  try { parsed = JSON.parse(input); }
  catch (err) {
    console.error(`jray: invalid JSON input`);
    if (err instanceof Error) console.error(`  ${err.message}`);
    process.exit(1);
  }

  const lines = flatten(parsed, "json", shouldSort);

  if (selectPattern) {
    const result = selectPath(lines, selectPattern);
    if (result === null) {
      console.error(`jray: no match for path "${selectPattern}"`);
      process.exit(1);
    }
    console.log(formatJSON(result));
    return;
  }

  if (filterPattern) {
    const { lines: matched, count } = filterLines(lines, filterPattern);
    if (showCount) {
      console.log(count);
      return;
    }
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

if (import.meta.main) {
  main().catch(err => {
    console.error(`jray: unexpected error — ${err.message}`);
    process.exit(1);
  });
}
