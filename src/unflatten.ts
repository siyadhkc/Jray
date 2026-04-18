/**
 * unflatten.ts
 *
 * PURPOSE: Takes an array of "flat" lines (like gron output) and rebuilds
 * the original nested JSON object from them.
 *
 * Example input lines:
 *   json.user.name = "Alice"
 *   json.user.age = 30
 *   json.tags[0] = "typescript"
 *   json.tags[1] = "bun"
 *
 * Example output:
 *   { user: { name: "Alice", age: 30 }, tags: ["typescript", "bun"] }
 *
 * WHY THIS DESIGN:
 * We walk each line, parse the "path" left of " = ", parse the "value"
 * right of " = ", then drill into our result object creating nested
 * objects/arrays as needed. This mirrors how gron --ungron works.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A "path segment" is one piece of the dotted/bracketed path.
 * e.g. "json.user.tags[0]" → ["json", "user", "tags", 0]
 *
 * WHY: Arrays need numeric indices (not string keys), so we distinguish them.
 */
type PathSegment = string | number;

// ─── Path Parser ──────────────────────────────────────────────────────────────

/**
 * parsePath("json.user.tags[0]") → ["json", "user", "tags", 0]
 * parsePath("json[\"key.with.dot\"]") → ["json", "key.with.dot"]
 *
 * WHY NOT SIMPLE SPLIT: The path can now contain dots or brackets inside 
 * quoted keys. A simple split on delimiters would break those keys.
 */
function parsePath(path: string): PathSegment[] {
  const segments: PathSegment[] = [];
  
  // This regex matches:
  // 1. .key or key (at start)
  // 2. [index]
  // 3. ["string key"] - handles escaped quotes too
  const regex = /(?:^|\.)([a-zA-Z_$][a-zA-Z0-9_$]*)|\[(\d+)\]|\["((?:[^"\\]|\\.)*)"\]/g;
  
  let match;
  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      segments.push(match[1]);
    } else if (match[2] !== undefined) {
      segments.push(parseInt(match[2], 10));
    } else if (match[3] !== undefined) {
      // It's a quoted string from bracket notation. 
      // We need to unescape it (it was created with JSON.stringify).
      try {
        segments.push(JSON.parse(`"${match[3]}"`));
      } catch {
        segments.push(match[3]);
      }
    }
  }

  return segments;
}

// ─── Value Parser ─────────────────────────────────────────────────────────────

/**
 * parseValue("\"Alice\"") → "Alice"
 * parseValue("30")        → 30
 * parseValue("true")      → true
 * parseValue("null")      → null
 *
 * WHY JSON.parse: It already handles all JSON primitive types correctly.
 * We fall back to the raw string if it's not valid JSON (shouldn't happen
 * in normal flow, but defensive coding is a good habit).
 */
function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Fallback: return as plain string. This handles edge cases gracefully
    // instead of crashing.
    return raw;
  }
}

// ─── Core: Set a deeply nested value ─────────────────────────────────────────

/**
 * setNestedValue(result, ["user", "name"], "Alice")
 * → result.user.name = "Alice"  (creating result.user = {} if needed)
 *
 * WHY A SEPARATE FUNCTION: This is the trickiest part. We need to walk
 * the path and at each step decide:
 *   - Does the next key need an object {}? Or an array []?
 *   - We decide by looking at the NEXT segment: if it's a number → array.
 *
 * WHY `unknown` not `any`: TypeScript's `any` disables type checking.
 * `unknown` is safer — it forces us to check types before using values.
 * A senior dev avoids `any` except when truly unavoidable.
 */
function setNestedValue(
  obj: Record<string, unknown>,
  keys: PathSegment[],
  value: unknown
): void {
  // We use a pointer `current` that walks down the object tree.
  // Using `unknown` here and casting carefully is intentional — we're
  // building a dynamic structure, but we stay disciplined about it.
  let current: Record<string, unknown> | unknown[] = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    // Determine what container the NEXT level needs.
    // If the next key is a number → we need an array [].
    // Otherwise → we need an object {}.
    const shouldBeArray = typeof nextKey === "number";

    if (Array.isArray(current)) {
      // We're currently inside an array. `key` must be a number here.
      const idx = key as number;
      if (current[idx] === undefined || current[idx] === null) {
        current[idx] = shouldBeArray ? [] : {};
      }
      current = current[idx] as Record<string, unknown> | unknown[];
    } else {
      // We're inside an object. `key` is a string here.
      const k = key as string;
      if (current[k] === undefined || current[k] === null) {
        current[k] = shouldBeArray ? [] : {};
      }
      current = current[k] as Record<string, unknown> | unknown[];
    }
  }

  // Set the final value at the last key.
  const lastKey = keys[keys.length - 1];
  if (Array.isArray(current)) {
    current[lastKey as number] = value;
  } else {
    (current as Record<string, unknown>)[lastKey as string] = value;
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * unflatten(lines) → any (the reconstructed JSON object)
 *
 * WHY `string[]` input: We accept lines so the caller (cli.ts) can split
 * stdin by newline and pass the array. Keeping concerns separated — the
 * CLI handles I/O, this function handles logic.
 *
 * WHY return `unknown`: We don't know the shape of the JSON — it's dynamic.
 * Callers should use type guards or just JSON.stringify the result.
 */
export function unflatten(lines: string[]): unknown {
  // The root result. We start with an object, but if the very first key
  // is numeric we'd normally start with an array. For simplicity (and
  // matching gron behavior), jray always starts with "json" as the root key,
  // so this will always be an object at the top level.
  const result: Record<string, unknown> = {};

  for (const line of lines) {
    // Skip empty lines and comments (lines starting with //)
    // WHY: Robustness. Real-world input has blank lines.
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;

    // Find the " = " delimiter that separates path from value.
    // WHY indexOf not split: A value could contain " = " itself (e.g. a string
    // value like "a = b"). We only want the FIRST occurrence.
    const delimiterIndex = trimmed.indexOf(" = ");
    if (delimiterIndex === -1) continue; // malformed line, skip gracefully

    const path = trimmed.slice(0, delimiterIndex);
    const rawValue = trimmed.slice(delimiterIndex + 3); // 3 = length of " = "

    const value = parseValue(rawValue);
    const keys = parsePath(path);

    // Need at least one key to do anything meaningful.
    if (keys.length === 0) continue;

    setNestedValue(result, keys, value);
  }

  // If there's a "json" root key (gron-style output), unwrap it.
  // WHY: Our flatten.ts likely prefixes everything with "json.",
  // so the reconstructed object has { json: { ... } }.
  // We return the inner object so callers get clean JSON back.
  if ("json" in result && Object.keys(result).length === 1) {
    return result["json"];
  }

  return result;
}