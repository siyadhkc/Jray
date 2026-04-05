# 🚀 jray (JSON X-Ray)

jray is a CLI tool that transforms complex JSON into grep-friendly key-value paths.

## 🔥 Features

* Flatten nested JSON into readable paths
* Grep-friendly output
* Simple CLI usage

## ⚡ Usage

```bash
cat data.json | bun src/cli.ts
```

### Example

Input:

```json
{
  "user": {
    "name": "Elliot Alderson"
  }
}
```

Output:

```
user.name=Elliot Alderson
```

## 🛠 Tech Stack

* Bun
* TypeScript

## 🚧 Roadmap

* [ ] Array support
* [ ] `--unray` reconstruction
* [ ] Streaming large JSON
