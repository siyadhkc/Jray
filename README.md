# jray

> Flatten, query, and reconstruct JSON — fast.

[![npm](https://img.shields.io/npm/v/@siyadkc/jray)](https://npmjs.com/package/@siyadkc/jray)
[![CI](https://github.com/siyadhkc/Jray/actions/workflows/ci.yml/badge.svg)](https://github.com/siyadhkc/Jray/actions)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![built with bun](https://img.shields.io/badge/built%20with-bun-f9f1e1.svg)](https://bun.sh)

`jray` turns deeply nested JSON into flat, grep-able lines. Query any field by path. Extract subtrees. Fetch from URLs. Reconstruct back. Pipe it into anything.

Think of it as [`gron`](https://github.com/tomnomnom/gron) meets [`jq`](https://jqlang.org) — but faster, simpler, and written in TypeScript.

---

## Why jray?

Most JSON tools make you learn a query language. `jray` doesn't. It makes JSON behave like plain text so you can use the tools you already know: `grep`, `awk`, `sed`, `cut`.

```bash
# Find every email address in any JSON
jray data.json | grep "email"

# Fetch a live API and explore it instantly
jray https://jsonplaceholder.typicode.com/users/1

# Extract a subtree as clean JSON
jray data.json --select "billing"
```

---

## Install

```bash
# with npm
npm install -g @siyadkc/jray

# with bun
bun add -g @siyadkc/jray
```

Requires [Bun](https://bun.sh) `>=1.0.0`.

---

## Usage

```
jray [options] [file|url]

Options:
  -u, --ungron          Reconstruct JSON from flat jray lines
  -f, --filter <path>   Show only lines matching a path
  -s, --select <path>   Extract a path as JSON
      --values          Print just the raw values
  -m, --no-color        Disable color output
  -v, --version         Show version
  -h, --help            Show help
```

---

## Examples

### Flatten JSON to grep-able lines

```bash
$ jray data.json

json.organization.name = "Acme Corporation"
json.users[0].name = "Alice Pemberton"
json.users[0].active = true
json.billing.plan = "enterprise"
json.featureFlags.darkMode = true
```

Output is automatically colorized in your terminal. Disable with `--no-color`.

### Fetch directly from a URL

```bash
$ jray https://jsonplaceholder.typicode.com/users/1

json.name = "Leanne Graham"
json.email = "Sincere@april.biz"
json.address.city = "Gwenborough"
json.company.name = "Romaguera-Crona"
```

### Filter by path

```bash
$ jray data.json --filter "billing"

json.billing.plan = "enterprise"
json.billing.seats = 25
json.billing.currency = "USD"
```

Unlike `grep`, `--filter` only matches against **paths** — never values.

### Select a subtree as JSON

```bash
$ jray data.json --select "billing"

{
  "plan": "enterprise",
  "seats": 25,
  "currency": "USD"
}
```

### Print just values

```bash
$ jray data.json --filter "users" --values

Alice Pemberton
bob@acme.io
true
```

### Reconstruct JSON

```bash
$ jray data.json | jray --ungron
# outputs original JSON perfectly reconstructed
```

---

## How it works

Every leaf value gets its own line with the full path:

```
json.users[0].preferences.theme = "dark"
│    │        │            │       │
│    │        │            │       └─ JSON-encoded value
│    │        │            └───────── key
│    │        └────────────────────── nested path
│    └─────────────────────────────── array index
└──────────────────────────────────── root prefix
```

---

## Comparison

| Feature | jray | jq | gron |
|---|:---:|:---:|:---:|
| Flatten to grep-able lines | ✅ | ❌ | ✅ |
| Reconstruct JSON | ✅ | ❌ | ✅ |
| Filter by path | ✅ | ✅ | ❌ |
| Extract subtree as JSON | ✅ | ✅ | ❌ |
| Fetch from URLs | ✅ | ❌ | ✅ |
| Color output | ✅ | ✅ | ✅ |
| Print raw values | ✅ | ✅ | ✅ |
| No query language | ✅ | ❌ | ✅ |
| Zero dependencies | ✅ | ✅ | ✅ |
| TypeScript / modern | ✅ | ❌ | ❌ |

---

## Development

```bash
git clone https://github.com/siyadhkc/Jray
cd Jray
bun install
bun run src/cli.ts test/data.json
bun test
```

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) first. PRs welcome!

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">Built with ☕ and <a href="https://bun.sh">Bun</a> · <a href="https://siyadhkc.github.io/Jray">Website</a> · <a href="https://npmjs.com/package/@siyadkc/jray">npm</a></p>