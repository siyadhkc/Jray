#!/usr/bin/env bun

import { flatten } from "./flatten";

async function main() {
  const input = await Bun.stdin.text();
  const json = JSON.parse(input);

  const output = flatten(json);

  output.forEach(line => console.log(line));
}

main();