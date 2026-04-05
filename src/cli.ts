#!/usr/bin/env bun

import { flatten } from "./flatten";
import { readFileSync } from "fs";

async function main() {
  try {
    const args = process.argv.slice(2);

    let input = "";

    if (args.length > 0) {
      // read from file
      const filePath = args[0]!;
      input = readFileSync(filePath, "utf-8");
    } else {
      // read from stdin
      input = await Bun.stdin.text();
    }

    if (!input.trim()) {
      console.error("No input provided");
      process.exit(1);
    }

    let json;
    try {
      json = JSON.parse(input);
    } catch {
      console.error("Invalid JSON");
      process.exit(1);
    }

    const output = flatten(json);
    output.forEach(line => console.log(line));

  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();