/**
 * version.ts
 *
 * Small helper for reading the package version at runtime so the CLI output
 * and HTTP user agent stay aligned with the published package version.
 */

const FALLBACK_VERSION = "0.0.0";

let cachedVersion: string | null = null;

export async function getPackageVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;

  try {
    const pkg = await Bun.file(new URL("../package.json", import.meta.url)).json() as {
      version?: unknown;
    };

    if (typeof pkg.version === "string" && pkg.version.length > 0) {
      cachedVersion = pkg.version;
      return cachedVersion;
    }
  } catch {
    // Fall through to the stable fallback below.
  }

  cachedVersion = FALLBACK_VERSION;
  return cachedVersion;
}
