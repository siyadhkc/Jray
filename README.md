# jray

> Flatten, query, and reconstruct JSON with plain paths.

[![npm](https://img.shields.io/npm/v/@siyadkc/jray)](https://npmjs.com/package/@siyadkc/jray)
[![CI](https://github.com/siyadhkc/Jray/actions/workflows/ci.yml/badge.svg)](https://github.com/siyadhkc/Jray/actions)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![built with bun](https://img.shields.io/badge/built%20with-bun-f9f1e1.svg)](https://bun.sh)

`jray` turns nested JSON into flat, grep-able lines, lets you filter by path, extract subtrees, read from URLs or stdin, and reconstruct the original JSON again.

Think of it as a practical middle ground:

- closer to `gron` for exploration
- simpler than `jq` for everyday inspection
- friendlier when you want shell tools like `grep`, `awk`, `sed`, or PowerShell pipelines to do the heavy lifting

---

## What jray is good at

`jray` is strongest when you want to:

- inspect unknown JSON quickly
- flatten deep structures into one line per leaf value
- search by path instead of learning a query language
- extract one branch as valid JSON
- reconstruct JSON after line-based filtering or editing
- pipe JSON through existing shell workflows

It is a real alternative to `gron`, and a lightweight alternative to `jq` for path-based exploration and extraction.

It is **not** a full `jq` replacement for:

- arithmetic and aggregations
- mapping/reducing arrays
- joins, transforms, and complex JSON reshaping
- a full expression language

If you want programmable transformations, `jq` still goes further. If you want a fast path browser for JSON that feels natural in the terminal, `jray` is the better fit.

---

## What jray can do today

Current CLI features:

- flatten any JSON object, array, or primitive into `path = value` lines
- preserve arrays with index notation like `json.users[0].email`
- preserve special keys with bracket notation like `json["api.endpoint"]`
- reconstruct flattened output back into valid JSON with `--ungron`
- filter lines by path with `--filter`
- extract a subtree as JSON with `--select`
- print only values with `--values`
- print raw strings without quotes with `--raw`
- count path matches with `--count`
- sort object keys alphabetically before flattening with `--sort`
- compact JSON output for `--select` or `--ungron` with `--compact`
- read input from files, stdin, or `http`/`https` URLs
- colorize terminal output automatically when writing to a TTY
- run on macOS, Linux, and Windows anywhere Bun runs

Path matching supports:

- normal object paths like `billing.plan`
- nested array paths like `users[0].email`
- root arrays like `[0]`
- bracket notation for special keys like `["dot.key"]`
- explicit full paths like `json.users[0]` and shorthand paths like `users[0]`

---

## Install

```bash
# npm
npm install -g @siyadkc/jray

# bun
bun add -g @siyadkc/jray
```

`jray` currently expects [Bun](https://bun.sh) to be installed because the published CLI runs through Bun.

That means it is cross-platform in practice on:

- macOS with Bun
- Linux with Bun
- Windows with Bun

For maintainers:

- `bun run build` creates a portable Bun-targeted bundle at `dist/jray.js`
- `bun run build:native` creates a native binary for the current OS
- on Windows, that native build becomes `dist/jray.exe`
- the published npm package runs from `dist/jray.js`, not directly from `src/`

---

## Usage

```text
jray [options] [file|url]

Options:
  -u, --ungron          Reconstruct JSON from flat jray lines
  -f, --filter <path>   Show only lines matching a path
  -s, --select <path>   Extract a path as JSON
      --values          Print just the values (no paths)
      --sort            Sort keys alphabetically
      --count           Print only the number of matches
  -c, --compact         Compact JSON output (no whitespace)
  -r, --raw             Print raw strings (no quotes)
  -m, --no-color        Disable color output
  -v, --version         Show version
  -h, --help            Show help
```

---

## Core examples

### Flatten JSON to grep-able lines

```bash
$ jray test/data.json
json.organization.name = "Acme Corporation"
json.users[0].name = "Alice Pemberton"
json.users[0].active = true
json.billing.plan = "enterprise"
json.featureFlags.darkMode = true
```

Each leaf value becomes one line. This is what makes `jray` easy to combine with shell tools.

### Work with special keys safely

```bash
$ jray config.json
json["api.endpoint"] = "https://api.acme.io"
json["version string"] = "1.0.0"
json["feature.flag"] = true
```

### Filter by path

```bash
$ jray test/data.json --filter "billing"
json.billing.plan = "enterprise"
json.billing.seats = 25
json.billing.currency = "USD"
json.billing.renewsAt = "2026-01-01"
```

`--filter` matches only the path, never the value.

### Extract a subtree as JSON

```bash
$ jray test/data.json --select "billing"
{
  "plan": "enterprise",
  "seats": 25,
  "pricePerSeat": 49,
  "currency": "USD"
}
```

Compact form:

```bash
$ jray test/data.json --select "billing" --compact
{"plan":"enterprise","seats":25,"pricePerSeat":49,"currency":"USD","renewsAt":"2026-01-01","paymentMethod":{"type":"card","last4":"4242","brand":"visa","expiresAt":"2027-09"},"invoices":[{"id":"inv_001","amount":1225,"paid":true,"date":"2025-01-01"},{"id":"inv_002","amount":1225,"paid":true,"date":"2025-04-01"},{"id":"inv_003","amount":1225,"paid":false,"date":"2025-07-01"}]}
```

### Print only values

```bash
$ jray test/data.json --filter "users" --values
"usr_001"
"Alice Pemberton"
"alice@acme.io"
"admin"
true
```

Raw strings:

```bash
$ jray test/data.json --filter "users" --values --raw
usr_001
Alice Pemberton
alice@acme.io
admin
true
```

### Count matches

```bash
$ jray test/data.json --filter "users" --count
27
```

### Reconstruct JSON

```bash
$ jray test/data.json | jray --ungron
# round-trips back to the original JSON structure
```

You can also reconstruct from a saved flat file:

```bash
$ jray --ungron snapshot.jray
```

### Read directly from a URL

```bash
$ jray https://jsonplaceholder.typicode.com/users/1
json.id = 1
json.name = "Leanne Graham"
json.email = "Sincere@april.biz"
```

This is one of the reasons `jray` feels close to `gron`: point it at an API and explore immediately.

### Read from stdin

```bash
$ cat data.json | jray --filter "meta"
$ curl -s https://api.example.com/data | jray --select "results[0]"
```

PowerShell:

```powershell
Get-Content .\data.json | bun run src/cli.ts --filter "billing"
Invoke-RestMethod https://api.example.com/data | ConvertTo-Json -Depth 100 | bun run src/cli.ts --select "items[0]"
```

### Work with root arrays

```bash
$ echo '[1,2,3]' | jray
json[0] = 1
json[1] = 2
json[2] = 3

$ echo '[1,2,3]' | jray --filter "[0]"
json[0] = 1

$ echo '[1,2,3]' | jray --select "[1]"
2
```

### Work with quoted keys

```bash
$ echo '{"dot.key":1}' | jray
json["dot.key"] = 1

$ echo '{"dot.key":1}' | jray --select '["dot.key"]'
1
```

---

## Shell-friendly workflows

### Find every email field

```bash
jray test/data.json | grep "email"
```

### Inspect just invoice amounts

```bash
jray test/data.json --filter "billing.invoices" --values
```

### Extract a branch and save it

```bash
jray test/data.json --select "projects[0]" > project.json
```

### Sort keys before flattening

```bash
jray test/data.json --sort
```

### Turn JSON into line-oriented data, inspect it, then rebuild it

```bash
jray test/data.json > snapshot.jray
jray --ungron snapshot.jray
```

---

## Path rules

`jray` always flattens under a virtual root called `json`.

Examples:

- `json.user.name`
- `json.users[0].email`
- `json["dot.key"]`
- `json[0]`

When filtering or selecting, users can write either the full path or a shorthand:

- `user.name`
- `users[0].email`
- `["dot.key"]`
- `[0]`
- `json.user.name`
- `json["dot.key"]`

Matching is segment-aware, so `user` does not incorrectly match `username`.

---

## How it compares

| Feature | jray | jq | gron |
|---|:---:|:---:|:---:|
| Flatten to grep-able lines | ✅ | ❌ | ✅ |
| Reconstruct JSON | ✅ | ❌ | ✅ |
| Filter by path | ✅ | ✅ | ❌ |
| Extract subtree as JSON | ✅ | ✅ | ❌ |
| Direct URL input | ✅ | ❌ | ✅ |
| Print only values | ✅ | ✅ | ❌ |
| Raw string output | ✅ | ✅ | ❌ |
| No query language required | ✅ | ❌ | ✅ |
| Good for grep/awk/sed pipelines | ✅ | ⚠️ | ✅ |
| Advanced transforms | ❌ | ✅ | ❌ |
| Arithmetic / reductions | ❌ | ✅ | ❌ |

Quick read:

- choose `jray` when you want path-based exploration with minimal syntax
- choose `gron` when you only want flatten/unflatten and already use it
- choose `jq` when you need programmable transformations

---

## Output model

Every leaf value is emitted as:

```text
path = json_encoded_value
```

Example:

```text
json.users[0].preferences.theme = "dark"
│    │        │            │       │
│    │        │            │       └─ JSON-encoded value
│    │        │            └───────── key
│    │        └────────────────────── nested path
│    └─────────────────────────────── array index
└──────────────────────────────────── root prefix
```

This format is:

- readable to humans
- safe to parse back into JSON
- easy to search with plain text tools

---

## Limitations

Current tradeoffs worth knowing:

- this is not a full JSON query language
- `--count` is meaningful when used with `--filter`
- only the first positional file/URL argument is used
- the published npm package currently depends on Bun being installed
- native binaries are an optional build/release artifact, not the default npm install path

Those tradeoffs are reasonable for a focused JSON exploration tool, but they are good to be explicit about.

---

## Development

```bash
git clone https://github.com/siyadhkc/Jray
cd Jray
bun install
bun run src/cli.ts test/data.json
bun test
bun run build
bun run build:native
npm pack --dry-run
```

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) first. PRs welcome.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## License

MIT. See [LICENSE](LICENSE).

---

<p align="center">Built with Bun · <a href="https://siyadhkc.github.io/Jray">Website</a> · <a href="https://npmjs.com/package/@siyadkc/jray">npm</a></p>
