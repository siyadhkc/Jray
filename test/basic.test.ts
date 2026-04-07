/**
 * basic.test.ts
 *
 * WHY WRITE TESTS: As an open source tool, tests are your safety net.
 * When someone sends a pull request, tests prove their change didn't
 * break anything. They also document what your code is SUPPOSED to do.
 *
 * Bun has a built-in test runner (no jest needed!). Run with: bun test
 */

import { describe, it, expect } from "bun:test";
import { flatten } from "../src/flatten";
import { unflatten } from "../src/unflatten";

// ─── flatten tests ────────────────────────────────────────────────────────────

describe("flatten", () => {
  it("handles a simple flat object", () => {
    const input = { name: "Alice", age: 30 };
    const result = flatten(input);
    expect(result).toContain('json.name = "Alice"');
    expect(result).toContain("json.age = 30");
  });

  it("handles nested objects", () => {
    const input = { user: { name: "Alice" } };
    const result = flatten(input);
    expect(result).toContain('json.user.name = "Alice"');
  });

  it("handles arrays", () => {
    const input = { tags: ["ts", "bun"] };
    const result = flatten(input);
    expect(result).toContain('json.tags[0] = "ts"');
    expect(result).toContain('json.tags[1] = "bun"');
  });

  it("handles null values", () => {
    const input = { value: null };
    const result = flatten(input);
    expect(result).toContain("json.value = null");
  });

  it("handles booleans", () => {
    const input = { active: true, deleted: false };
    const result = flatten(input);
    expect(result).toContain("json.active = true");
    expect(result).toContain("json.deleted = false");
  });

  it("handles empty objects", () => {
    const input = { meta: {} };
    const result = flatten(input);
    expect(result).toContain("json.meta = {}");
  });

  it("handles empty arrays", () => {
    const input = { items: [] };
    const result = flatten(input);
    expect(result).toContain("json.items = []");
  });
});

// ─── unflatten tests ──────────────────────────────────────────────────────────

describe("unflatten", () => {
  it("reconstructs a simple object", () => {
    const lines = ['json.name = "Alice"', "json.age = 30"];
    const result = unflatten(lines);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("reconstructs nested objects", () => {
    const lines = ['json.user.name = "Alice"'];
    const result = unflatten(lines);
    expect(result).toEqual({ user: { name: "Alice" } });
  });

  it("reconstructs arrays", () => {
    const lines = ['json.tags[0] = "ts"', 'json.tags[1] = "bun"'];
    const result = unflatten(lines);
    expect(result).toEqual({ tags: ["ts", "bun"] });
  });

  it("skips empty lines", () => {
    const lines = ['json.name = "Alice"', "", "   "];
    expect(() => unflatten(lines)).not.toThrow();
  });
});

// ─── Round-trip tests ─────────────────────────────────────────────────────────

describe("round-trip (flatten → unflatten)", () => {
  it("reconstructs the original object", () => {
    const original = {
      user: { name: "Alice", age: 30 },
      tags: ["typescript", "bun"],
      active: true,
    };
    const lines = flatten(original);
    const result = unflatten(lines);
    // Deep equality check — the reconstructed object should match the original.
    expect(result).toEqual(original);
  });
});