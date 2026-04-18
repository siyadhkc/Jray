/**
 * filter.ts
 *
 * PURPOSE: Filter flattened jray lines by a path pattern.
 */

import { unflatten } from "./unflatten";

/**
 * FilterResult holds both the matched lines AND metadata about the match.
 *
 * WHY RETURN AN OBJECT not just string[]:
 * As Jray grows, callers might want to know HOW something matched
 * (exact vs partial), or get the count. Returning an object now means
 * we can add fields later without breaking callers. This is called
 * "designing for extension" — a senior dev habit.
 */
export interface FilterResult {
  lines: string[];       // The matched lines
  count: number;         // How many lines matched
  pattern: string;       // The pattern that was used
}

// ─── Core Filter Function ─────────────────────────────────────────────────────

/**
 * filterLines(lines, pattern) → FilterResult
 *
 * @param lines   - Array of flat jray lines (output of flatten())
 * @param pattern - Path pattern to match against, e.g. "user.name" or "user"
 *
 * MATCHING RULES:
 * Given pattern "user":
 *   ✅ json.user = {}                  (exact: the key IS "user")
 *   ✅ json.user.name = "Alice"        (prefix: path STARTS with "json.user.")
 *   ✅ json.user[0] = "x"             (prefix with array)
 *   ❌ json.username = "alice"         (no — "user" must be a full segment)
 *   ❌ json.bio = "user is great"      (no — value match, not path match)
 *
 * WHY THIS RULE: We want to match on PATH SEGMENTS, not substrings.
 * "user" should not match "username". This is how jq works too.
 */
export function filterLines(lines: string[], pattern: string): FilterResult {
  // Normalize the pattern: strip leading "json." if user typed it,
  // because our internal paths always start with "json."
  // WHY: Forgiving input is good UX. Let users type either:
  //   --filter "user.name"       (short, natural)
  //   --filter "json.user.name"  (explicit, also works)
  const normalizedPattern = pattern.startsWith("json.")
    ? pattern
    : `json.${pattern}`;

  const matched = lines.filter((line) => {
    // Extract just the path part (left of " = ")
    const delimIdx = line.indexOf(" = ");
    if (delimIdx === -1) return false; // malformed line, skip

    const path = line.slice(0, delimIdx);

    // Match if:
    // 1. The path IS exactly the pattern:       json.user.name = "Alice"
    // 2. The path STARTS WITH pattern + ".":    json.user.name (prefix)
    // 3. The path STARTS WITH pattern + "[":    json.tags[0]   (array prefix)
    //
    // WHY CHECK FOR "." AND "[" AFTER PATTERN:
    // Without this, pattern "user" would match "json.username" because
    // "json.username".startsWith("json.user") is true. Adding the boundary
    // check prevents that false match.
    return (
      path === normalizedPattern ||
      path.startsWith(normalizedPattern + ".") ||
      path.startsWith(normalizedPattern + "[")
    );
  });

  return {
    lines: matched,
    count: matched.length,
    pattern,
  };
}

// ─── Select: Extract a subtree as JSON ────────────────────────────────────────

/**
 * selectPath(lines, pattern) → string (JSON)
 *
 * Like --filter but returns JSON output instead of flat lines.
 * This is the jq-style "extract a subtree" operation.
 *
 * Example:
 *   Input lines from: { user: { name: "Alice", age: 30 }, tags: ["ts"] }
 *   Pattern: "user"
 *   Output: { "name": "Alice", "age": 30 }
 *
 * WHY A SEPARATE FUNCTION:
 * --filter and --select are different UX modes:
 *   --filter → stays in flat-line format (good for piping further)
 *   --select → outputs JSON (good for extracting a subtree)
 *
 * A user who wants to extract user data and save it as JSON wants --select.
 * A user who wants to grep/pipe further wants --filter.
 */
export function selectPath(lines: string[], pattern: string): unknown {
  const { lines: matched } = filterLines(lines, pattern);

  if (matched.length === 0) return null;

  const normalizedPattern = pattern.startsWith("json.")
    ? pattern
    : `json.${pattern}`;

  // Rewrite the matched lines so they're rooted at "json" again,
  // replacing the matched prefix with "json".
  //
  // WHY: If we matched "json.user.name = Alice", and our pattern is "user",
  // we need to rewrite it as "json.name = Alice" before unflattening,
  // so the result is { name: "Alice" } not { user: { name: "Alice" } }.
  const rewritten = matched.map((line) => {
    const delimIdx = line.indexOf(" = ");
    const path = line.slice(0, delimIdx);
    const value = line.slice(delimIdx); // includes " = "

    // Replace the pattern prefix with "json"
    const newPath = "json" + path.slice(normalizedPattern.length);
    return newPath + value;
  });

  // Reconstruct JSON from the rewritten lines
  return unflatten(rewritten);
}
