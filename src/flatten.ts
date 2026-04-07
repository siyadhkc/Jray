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
 * flatten(value, prefix) → string[]
 *
 * @param value  - Any JSON-compatible value (object, array, string, number, etc.)
 * @param prefix - The path prefix accumulated so far. Defaults to "json"
 *                 (matching gron's convention — makes output feel familiar)
 *
 * WHY RECURSIVE: JSON is a tree. The cleanest way to walk a tree is
 * recursion — each call handles one node, and delegates its children
 * back to itself. A senior dev reaches for recursion here instinctively.
 *
 * WHY `unknown` not `any`: See unflatten.ts — `unknown` keeps TypeScript
 * honest. We narrow the type with `typeof` checks before using the value.
 */
export function flatten(value: unknown, prefix = "json"): string[] {
  const lines: string[] = [];

  if (Array.isArray(value)) {
    // ── Array case ──────────────────────────────────────────────────────────
    // For arrays, we use bracket notation: prefix[0], prefix[1], etc.
    // WHY: This is the universal convention for array access paths, and it's
    // what parsePath() in unflatten.ts expects.

    if (value.length === 0) {
      // Represent empty arrays as a declaration line.
      // WHY: Without this, empty arrays would produce zero output lines,
      // and unflatten wouldn't know the key existed.
      lines.push(`${prefix} = []`);
    } else {
      for (let i = 0; i < value.length; i++) {
        // Recurse into each element with updated path: prefix[0], prefix[1]...
        lines.push(...flatten(value[i], `${prefix}[${i}]`));
      }
    }
  } else if (value !== null && typeof value === "object") {
    // ── Object case ─────────────────────────────────────────────────────────
    // For objects, use dot notation: prefix.key
    // WHY `value !== null`: In JavaScript, `typeof null === "object"` — this
    // is a famous JS quirk. We MUST check for null separately first.

    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      // Represent empty objects similarly to empty arrays.
      lines.push(`${prefix} = {}`);
    } else {
      for (const key of keys) {
        // Build path with dot notation.
        // But if the key has special characters (spaces, hyphens), we'd need
        // quotes — for the MVP we skip that edge case and add it later.
        lines.push(...flatten(obj[key], `${prefix}.${key}`));
      }
    }
  } else {
    // ── Primitive case ──────────────────────────────────────────────────────
    // null, boolean, number, string — these are leaf nodes. We emit a line.
    //
    // WHY JSON.stringify for the value:
    // - Strings need to be quoted:  name = "Alice"  not  name = Alice
    // - null should print as:       key = null      not  key = undefined
    // - Booleans:                   active = true   not  active = True
    // JSON.stringify handles ALL of these correctly in one call. ✅
    lines.push(`${prefix} = ${JSON.stringify(value)}`);
  }

  return lines;
}