# Changelog

All notable changes to jray will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com).

---

## [0.2.0] — 2026-04-11

### Added
- Color output — paths cyan, strings yellow, numbers blue, booleans red, null gray
- Auto-detects terminal (no color when piping — respects [NO_COLOR](https://no-color.org) standard)
- `--no-color` / `-m` flag to force monochrome output
- URL fetching — `jray https://api.example.com/data` works directly, no curl needed
- `--values` flag — print just raw values without paths

### Fixed
- Package size reduced from 115 MB to 14 KB by excluding compiled binary

---

## [0.1.0] — 2026-04-08

### Added
- `flatten` — convert any JSON to grep-able flat lines
- `unflatten` / `--ungron` — reconstruct JSON from flat lines
- `--filter` — filter lines by path (never matches values)
- `--select` — extract any subtree as clean JSON
- stdin support — works with pipes
- Zero dependencies, built with Bun + TypeScript
- MIT license