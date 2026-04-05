export function flatten(obj: any, prefix = ""): string[] {
  let result: string[] = [];

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const newKey = `${prefix}[${index}]`;
      result.push(...flatten(item, newKey));
    });
    return result;
  }

  if (typeof obj === "object" && obj !== null) {
    for (let key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      result.push(...flatten(obj[key], newKey));
    }
    return result;
  }

  // primitive value
  result.push(`${prefix}=${obj}`);
  return result;
}