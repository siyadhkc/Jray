# jray

> Flatten, query, and reconstruct JSON — fast.

[![npm version](https://img.shields.io/npm/v/jray.svg)](https://npmjs.com/package/jray)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![built with bun](https://img.shields.io/badge/built%20with-bun-f9f1e1.svg)](https://bun.sh)

`jray` turns deeply nested JSON into flat, grep-able lines. Query any field by path. Reconstruct JSON from flat lines. Pipe it into anything.

Think of it as [`gron`](https://github.com/tomnomnom/gron) meets [`jq`](https://jqlang.org) — but faster, simpler, and written in TypeScript.

---

## Why jray?

Most JSON tools make you learn a query language. `jray` doesn't. It just makes JSON behave like plain text — so you can use the tools you already know: `grep`, `awk`, `sed`, `cut`.

```bash
# Find every field that contains "alice" anywhere in your JSON
jray data.json | grep -i "alice"

# Get all active users
jray data.json --filter "users" | grep '"active": true'

# Extract a subtree as clean JSON
jray data.json --select "billing"
```

---

## Install

```bash
# with npm
npm install -g jray

# with bun
bun add -g jray
```

Or download a prebuilt binary from [Releases](https://github.com/siyadhkc/jray/releases) — no runtime required.

---

## Usage

```
jray [options] [file]

Options:
  -u, --ungron          Reconstruct JSON from flat jray lines
  -f, --filter <path>   Show only lines matching a path
  -s, --select <path>   Extract a path as JSON
  -v, --version         Show version
  -h, --help            Show help
```

---

## Examples

### Flatten JSON to grep-able lines

```bash
$ jray data.json

json.organization.name = "Acme Corporation"
json.organization.founded = 2019
json.organization.headquarters.city = "London"
json.users[0].name = "Alice Pemberton"
json.users[0].role = "admin"
json.users[1].name = "Bob Nakamura"
json.users[1].role = "developer"
json.billing.plan = "enterprise"
json.billing.seats = 25
json.featureFlags.darkMode = true
json.featureFlags.betaEditor = false
...
```

### Filter by path

Show only lines under a specific key. Unlike `grep`, `--filter` only matches against the **path** — never the value.

```bash
$ jray data.json --filter "organization.headquarters"

json.organization.headquarters.street = "221B Baker Street"
json.organization.headquarters.city = "London"
json.organization.headquarters.country = "GB"
json.organization.headquarters.zip = "NW1 6XE"
json.organization.headquarters.coordinates.lat = 51.5237
json.organization.headquarters.coordinates.lng = -0.1585
```

### Select a subtree as JSON

Extract any nested object or array as clean, pretty-printed JSON.

```bash
$ jray data.json --select "billing"

{
  "plan": "enterprise",
  "seats": 25,
  "pricePerSeat": 49,
  "currency": "USD",
  "renewsAt": "2026-01-01",
  "paymentMethod": {
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "expiresAt": "2027-09"
  }
}
```

### Reconstruct JSON from flat lines

`--ungron` is the inverse of flatten. Pipe jray output back in to get the original JSON.

```bash
$ jray data.json | jray --ungron

{
  "organization": { ... },
  "users": [ ... ],
  ...
}
```

### Works with stdin

`jray` reads from stdin when no file is given — making it a first-class pipe citizen.

```bash
curl -s https://api.example.com/users | jray
curl -s https://api.example.com/users | jray --filter "address"
cat data.json | jray --select "featureFlags"
```

### Combine with standard Unix tools

```bash
# Which feature flags are enabled?
jray data.json --filter "featureFlags" | grep "true"

# Count how many users exist
jray data.json --filter "users" | grep "\.name " | wc -l

# Find all email addresses in the entire document
jray data.json | grep "email"

# Extract and save a subtree
jray data.json --select "organization" > org.json
```

---

## How it works

`jray` converts every leaf value in your JSON into a path-value line:

```
json.users[0].preferences.theme = "dark"
│    │        │            │       │
│    │        │            │       └─ value (JSON-encoded)
│    │        │            └───────── key
│    │        └────────────────────── nested path
│    └─────────────────────────────── array index
└──────────────────────────────────── root prefix
```

These lines are stable, sortable, and diff-able. They work with any line-oriented Unix tool. And they're fully reversible — `--ungron` reconstructs the original JSON exactly.

---

## Comparison

| Feature | jray | jq | gron |
|---|:---:|:---:|:---:|
| Flatten to grep-able lines | ✅ | ❌ | ✅ |
| Reconstruct JSON | ✅ | ❌ | ✅ |
| Filter by path | ✅ | ✅ | ❌ |
| Extract subtree as JSON | ✅ | ✅ | ❌ |
| No query language to learn | ✅ | ❌ | ✅ |
| Zero dependencies | ✅ | ✅ | ✅ |
| TypeScript / modern codebase | ✅ | ❌ | ❌ |

---

## Development

```bash
# Clone
git clone https://github.com/siyadhkc/jray
cd jray

# Install dependencies
bun install

# Run locally
bun run src/cli.ts data.json

# Run tests
bun test

# Build a standalone binary
bun build src/cli.ts --compile --outfile dist/jray
```

### Project structure

```
jray/
├── src/
│   ├── cli.ts          # CLI entry point — argument parsing, I/O
│   ├── flatten.ts      # JSON → flat lines
│   ├── unflatten.ts    # flat lines → JSON
│   └── filter.ts       # path-based filtering and selection
├── test/
│   ├── basic.test.ts   # core round-trip tests
│   ├── data.json       # realistic test dataset
│   └── edge.json       # edge cases (empty arrays, nulls, deep nesting)
└── package.json
```

---

## Contributing

Contributions are welcome! If you find a bug or want a feature, [open an issue](https://github.com/siyadhkc/jray/issues) first so we can discuss it.

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes with tests
4. Run `bun test` — all tests must pass
5. Open a pull request

Please keep pull requests focused — one feature or fix per PR.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ☕ and <a href="https://bun.sh">Bun</a></p>
