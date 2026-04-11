/**
 * fetch.ts
 *
 * PURPOSE: Fetch JSON from a URL so users can do:
 *   jray https://api.github.com/users/1
 *
 * Instead of the old way:
 *   curl -s https://api.github.com/users/1 | jray
 *
 * WHY THIS MATTERS:
 * This is gron's killer feature. Being able to point directly at a URL
 * and immediately explore its structure is how developers discover APIs.
 * Without it, jray is just a file tool.
 *
 * WHY USE BUN'S NATIVE FETCH:
 * Bun has fetch() built in — it's the same Web API as browsers.
 * No need for node-fetch, axios, or got. Zero extra dependencies.
 */

// ─── URL detection ────────────────────────────────────────────────────────────

/**
 * isURL(input) → boolean
 *
 * Returns true if the input looks like an HTTP/HTTPS URL.
 *
 * WHY NOT USE URL CONSTRUCTOR:
 * new URL("notaurl") throws — we'd need try/catch everywhere.
 * A simple regex is cleaner for this use case.
 */
export function isURL(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

// ─── URL fetcher ──────────────────────────────────────────────────────────────

/**
 * fetchJSON(url) → Promise<string>
 *
 * Fetches a URL and returns the raw JSON text.
 * The caller (cli.ts) is responsible for parsing it.
 *
 * WHY RETURN RAW STRING not parsed JSON:
 * Keeping concerns separated — fetch.ts handles HTTP,
 * cli.ts handles parsing. If fetch returns parsed JSON,
 * we lose the original formatting and error context.
 *
 * WHAT WE HANDLE:
 * - Non-200 HTTP responses (404, 401, 500, etc.)
 * - Non-JSON responses (HTML error pages)
 * - Network errors (no connection, DNS failure)
 * - Timeout (20 seconds, matching gron's default)
 */
export async function fetchJSON(url: string): Promise<string> {
  let response: Response;

  try {
    // AbortSignal.timeout is Bun-native — sets a 20s timeout
    // WHY 20s: Matches gron's timeout. Long enough for slow APIs,
    // short enough that the user doesn't think the tool is frozen.
    response = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: {
        // Tell servers we want JSON — some APIs return HTML without this
        "Accept": "application/json, text/plain, */*",
        // Identify ourselves — good practice for open source tools
        "User-Agent": "jray/0.2.0 (https://github.com/siyadhkc/Jray)",
      },
    });
  } catch (err) {
    // Network-level error — DNS failure, no internet, timeout, etc.
    if (err instanceof Error) {
      if (err.name === "TimeoutError") {
        throw new Error(`request timed out after 20 seconds: ${url}`);
      }
      throw new Error(`failed to fetch ${url}: ${err.message}`);
    }
    throw new Error(`failed to fetch ${url}`);
  }

  // HTTP error response (404, 401, 500, etc.)
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${url}`
    );
  }

  // Check content type — warn if it's not JSON
  // WHY WARN NOT ERROR: Some APIs return JSON without the correct
  // Content-Type header. We try to parse it anyway.
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json") && !contentType.includes("text")) {
    // Not throwing — we'll let JSON.parse fail naturally if it's binary
  }

  const text = await response.text();

  // Quick sanity check — if it starts with < it's probably HTML
  if (text.trimStart().startsWith("<")) {
    throw new Error(
      `${url} returned HTML, not JSON. ` +
      `The server may require authentication or the URL may be wrong.`
    );
  }

  return text;
}