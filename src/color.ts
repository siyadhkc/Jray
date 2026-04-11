/**
 * color.ts
 *
 * PURPOSE: Colorize jray flat-line output using ANSI escape codes.
 * Zero dependencies — we don't need a library for this.
 *
 * WHY ANSI CODES NOT A LIBRARY:
 * Libraries like chalk or kleur add dependencies. ANSI codes are just
 * special characters that terminals understand natively. Every modern
 * terminal on Mac, Linux, and Windows 10+ supports them.
 *
 * COLOR SCHEME (matches gron's conventions, which users already know):
 *   paths/keys  → cyan       json.user.name
 *   strings     → yellow     "Alice"
 *   numbers     → blue       42
 *   booleans    → red        true / false
 *   null        → gray       null
 *   equals sign → white dim  =
 */

// ─── ANSI codes ───────────────────────────────────────────────────────────────

const RESET  = "\x1b[0m";
const CYAN   = "\x1b[36m";
const YELLOW = "\x1b[33m";
const BLUE   = "\x1b[34m";
const RED    = "\x1b[31m";
const GRAY   = "\x1b[90m";
const DIM    = "\x1b[2m";

// ─── Color helpers ────────────────────────────────────────────────────────────

const cyan   = (s: string) => `${CYAN}${s}${RESET}`;
const yellow = (s: string) => `${YELLOW}${s}${RESET}`;
const blue   = (s: string) => `${BLUE}${s}${RESET}`;
const red    = (s: string) => `${RED}${s}${RESET}`;
const gray   = (s: string) => `${GRAY}${s}${RESET}`;
const dim    = (s: string) => `${DIM}${s}${RESET}`;

// ─── Terminal detection ───────────────────────────────────────────────────────

/**
 * isColorSupported() → boolean
 *
 * WHY CHECK THIS: If the user pipes output to a file or another program,
 * we should NOT add color codes — they'd appear as garbage characters.
 *
 * process.stdout.isTTY is true when output goes to a real terminal.
 * If it's undefined or false, we're being piped — stay monochrome.
 *
 * Users can force color with: NO_COLOR="" jray data.json
 * Or disable with: NO_COLOR=1 jray data.json
 */
export function isColorSupported(): boolean {
  // Respect the NO_COLOR standard (https://no-color.org/)
  if (process.env.NO_COLOR !== undefined) return false;
  // Force color with FORCE_COLOR env var
  if (process.env.FORCE_COLOR !== undefined) return true;
  // Only colorize if outputting to a real terminal
  return process.stdout.isTTY === true;
}

// ─── Main colorizer ───────────────────────────────────────────────────────────

/**
 * colorizeLine(line) → string
 *
 * Takes a flat jray line like:
 *   json.users[0].name = "Alice"
 *
 * Returns the same line with ANSI color codes applied:
 *   [cyan]json.users[0].name[reset] [dim]=[reset] [yellow]"Alice"[reset]
 *
 * WHY SPLIT ON " = " NOT REGEX:
 * The value could contain " = " itself (e.g. a string "a = b").
 * We only want the FIRST occurrence — indexOf is safer than regex here.
 */
export function colorizeLine(line: string): string {
  const delimIdx = line.indexOf(" = ");

  // Not a valid jray line — return as-is
  if (delimIdx === -1) return line;

  const path  = line.slice(0, delimIdx);
  const value = line.slice(delimIdx + 3); // skip " = "

  // Colorize the path
  const coloredPath = colorPath(path);

  // Colorize the value based on its type
  const coloredValue = colorValue(value);

  return `${coloredPath} ${dim("=")} ${coloredValue}`;
}

/**
 * colorPath(path) → string
 *
 * Colorizes the path portion: json.users[0].name
 * - "json" prefix → cyan
 * - dots → dim
 * - keys → cyan
 * - brackets and indices → dim
 *
 * WHY SEGMENT BY SEGMENT: We want keys to be cyan but brackets dim,
 * so we split on the boundary characters and color each piece.
 */
function colorPath(path: string): string {
  // Split on dots and brackets while keeping the delimiters
  // "json.users[0].name" → ["json", ".", "users", "[", "0", "]", ".", "name"]
  const parts = path.split(/(\.|(\[)|(\]))/);

  return parts.map(part => {
    if (part === "." || part === "[" || part === "]") return dim(part);
    if (part === undefined || part === "") return "";
    // Numeric parts inside brackets stay dim
    if (/^\d+$/.test(part)) return dim(part);
    return cyan(part);
  }).join("");
}

/**
 * colorValue(value) → string
 *
 * Colorizes the value portion based on JSON type:
 *   "Alice"  → yellow  (string — starts and ends with ")
 *   42       → blue    (number)
 *   true     → red     (boolean)
 *   false    → red     (boolean)
 *   null     → gray    (null)
 *   {}       → dim     (empty object)
 *   []       → dim     (empty array)
 */
function colorValue(value: string): string {
  const v = value.trim();

  if (v.startsWith('"')) return yellow(v);
  if (v === "true" || v === "false") return red(v);
  if (v === "null") return gray(v);
  if (v === "{}" || v === "[]") return dim(v);
  // Numbers — anything else that isn't one of the above
  if (/^-?\d/.test(v)) return blue(v);

  // Fallback — return as-is
  return v;
}

/**
 * colorizeLines(lines) → string[]
 *
 * Convenience function — colorizes an array of lines.
 * Checks terminal support once and applies to all lines.
 */
export function colorizeLines(lines: string[]): string[] {
  if (!isColorSupported()) return lines;
  return lines.map(colorizeLine);
}