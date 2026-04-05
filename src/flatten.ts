function formatValue(value: any): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (value === null) return "null";

  if (typeof value === "boolean") return value ? "true" : "false";

  return String(value);
}

export function flatten(obj: any, prefix = ""): string[] {
  let result: string[] = [];

  // Handle arrays
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      result.push(`${prefix}=[]`);
      return result;
    }

    obj.forEach((item, index) => {
      const newKey = `${prefix}[${index}]`;
      result.push(...flatten(item, newKey));
    });

    return result;
  }

  // Handle objects
  if (typeof obj === "object" && obj !== null) {
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      result.push(`${prefix}={}`);
      return result;
    }

    for (let key of keys) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      result.push(...flatten(obj[key], newKey));
    }

    return result;
  }

  // Handle primitive values
  result.push(`${prefix}=${formatValue(obj)}`);
  return result;
}