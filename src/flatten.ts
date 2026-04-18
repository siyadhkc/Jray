/**
 * flatten.ts
 *
 * PURPOSE: Takes any JSON value and converts it into an array of flat lines,
 * one per primitive value, with the full path shown.
 *
 * Example input:  { user: { name: "Alice", age: 30 }, tags: ["ts", "bun"] }
 * Example output:
 *   json.user.name = "Alice"
 *   json.user.age = 30
 *   json.tags[0] = "ts"
 *   json.tags[1] = "bun"
 *
 * WHY THIS FORMAT:
 * - Human-readable AND grep-able: `jray data.json | grep "user"`
 * - Reversible: unflatten.ts can reconstruct the original JSON from these lines
 * - Inspired by `gron` but with cleaner TypeScript internals
 */

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * flatten(value, prefix, sort) → string[]
 *
 * @param value  - Any JSON-compatible value (object, array, string, number, etc.)
 * @param prefix - The path prefix accumulated so far. Defaults to "json"
 * @param sort   - Whether to sort object keys alphabetically.
 */
export function flatten(value: unknown, prefix = "json", sort = false): string[] {
  const lines: string[] = [];

  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${prefix} = []`);
    } else {
      for (let i = 0; i < value.length; i++) {
        lines.push(...flatten(value[i], `${prefix}[${i}]`, sort));
      }
    }
  } else if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    let keys = Object.keys(obj);
    if (sort) keys.sort();

    if (keys.length === 0) {
      lines.push(`${prefix} = {}`);
    } else {
      for (const key of keys) {
        // If key has special chars (dots, brackets, spaces, quotes), use bracket notation
        const escapedPath = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
          ? `${prefix}.${key}`
          : `${prefix}[${JSON.stringify(key)}]`;
        
        lines.push(...flatten(obj[key], escapedPath, sort));
      }
    }
  } else {
    lines.push(`${prefix} = ${JSON.stringify(value)}`);
  }

  return lines;
}