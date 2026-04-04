type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject { [key: string]: JSONValue }
interface JSONArray extends Array<JSONValue> {}

const FORBIDDEN_KEYS = ["__proto__", "constructor", "prototype"];

export function flatten(
  data: JSONValue,
  prefix = "",
  depth = 0,
  out: string[] = []
): string[] {

  if (depth > 100) {
    throw new Error("Max depth exceeded (possible malicious input)");
  }

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      flatten(data[i], `${prefix}[${i}]`, depth + 1, out);
    }
    return out;
  }

  if (typeof data === "object" && data !== null) {
    for (const key of Object.keys(data)) {

      if (FORBIDDEN_KEYS.includes(key)) continue;

      const safeKey = prefix ? `${prefix}.${key}` : key;
      flatten((data as any)[key], safeKey, depth + 1, out);
    }
    return out;
  }

  // primitive
  out.push(`${prefix}=${String(data)}`);
  return out;
}