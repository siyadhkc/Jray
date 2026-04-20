# Changelog

All notable changes to jray will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com).

---

## [Unreleased]

### Changed
- README and package metadata now make the Bun runtime requirement explicit for npm users
- CLI help output now mentions that Bun is required at runtime

---

## [0.2.4] — 2026-04-20

### Changed
- npm packaging now publishes `dist/jray.js` as the CLI entry point instead of shipping TypeScript source as the runtime entrypoint
- `prepack` now builds the CLI automatically during `npm pack` and `npm publish`
- `build:native` now compiles from the package entrypoint flow instead of a separate ad-hoc path

### Fixed
- CLI `--version` output now reads the package version dynamically instead of relying on a stale hardcoded fallback
- HTTP `User-Agent` version now stays aligned with the published package version

---

## [0.2.3] — 2026-04-19

### Changed
- default build now emits a portable Bun bundle at `dist/jray.js`
- native binaries are now an explicit `build:native` step instead of the default build output
- README and package metadata were updated to document the new build flow more clearly

---

## [0.2.2] — 2026-04-18

### Fixed
- `--ungron <file>` now reads the provided flat file instead of accidentally ignoring it
- `--filter` / `--select` now support root-array paths like `[0]`
- `--filter` / `--select` now support bracket-notation root keys like `["dot.key"]`

### Changed
- CLI parsing was refactored to be easier to test directly
- README was expanded with deeper feature coverage, path rules, shell examples, and clearer positioning against `jq` and `gron`
- regression tests were added for root-array selection, bracket-notation paths, and `--ungron` file handling

---

## [0.2.1] — 2026-04-11

### Added
- `src/bin.ts` wrapper added as the npm bin entry point
- `CONTRIBUTING.md` added to document contribution workflow
- `CHANGELOG.md` added to track project releases

### Changed
- README was rewritten and reorganized for clearer installation and usage guidance

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
