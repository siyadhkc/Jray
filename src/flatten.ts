export function flatten(obj: any, prefix = ""): string[] {
  let result: string[] = [];

  for (let key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === "object" && value !== null) {
      result.push(...flatten(value, newKey));
    } else {
      result.push(`${newKey}=${value}`);
    }
  }

  return result;
}