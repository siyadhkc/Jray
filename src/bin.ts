#!/usr/bin/env bun
// bin.ts — entry point for the jray CLI command
// This file exists solely as the npm bin entry point.
// WHY: npm requires a bin file to exist. We keep cli.ts
// as the main logic file and this as a thin wrapper.
import { main } from "./cli";

main().catch(err => {
  console.error(`jray: unexpected error — ${err.message}`);
  process.exit(1);
});
