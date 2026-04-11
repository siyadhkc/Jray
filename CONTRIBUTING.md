# Contributing to jray

First off — thank you for taking the time to contribute! 🎉

jray is a small focused tool and we want to keep it that way.
Before opening a pull request for a big feature, please open an issue first
so we can discuss whether it fits the project's direction.

---

## Setup

```bash
git clone https://github.com/siyadhkc/Jray
cd Jray
bun install
```

## Running the tool locally

```bash
bun run src/cli.ts test/data.json
bun run src/cli.ts test/data.json --filter "users"
bun run src/cli.ts https://jsonplaceholder.typicode.com/users/1
```

## Running tests

```bash
bun test
```

All tests must pass before submitting a pull request.

## Project structure

```
src/
  cli.ts        # CLI entry point — argument parsing and I/O only
  bin.ts        # npm bin wrapper — do not put logic here
  flatten.ts    # JSON → flat lines
  unflatten.ts  # flat lines → JSON
  filter.ts     # path-based filtering and subtree selection
  color.ts      # ANSI color output
  fetch.ts      # URL fetching
test/
  basic.test.ts # core tests
  data.json     # realistic test dataset
  edge.json     # edge cases
```

## Submitting a pull request

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Write your code with comments explaining WHY, not just WHAT
4. Add tests for any new functionality
5. Run `bun test` — all tests must pass
6. Open a pull request with a clear description

## Code style

- TypeScript strict mode — no `any`, use `unknown` for dynamic data
- Every exported function needs a JSDoc comment
- Keep files focused — one concern per file
- Prefer `const` over `let`, avoid mutation where possible

## Reporting bugs

Open an issue at [github.com/siyadhkc/Jray/issues](https://github.com/siyadhkc/Jray/issues).
Include your OS, Bun version (`bun --version`), and the command that failed.

## Feature requests

Open an issue describing the problem you're trying to solve — not just the solution.
Good feature requests explain the use case first.

---

Built with ❤️ using [Bun](https://bun.sh) + TypeScript.