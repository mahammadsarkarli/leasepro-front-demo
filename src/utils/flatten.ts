// utils/flatten.ts
export function flattenObject(
    obj: Record<string, any>,
    prefix = "",
    out: Record<string, any> = {}
  ): Record<string, any> {
    Object.entries(obj ?? {}).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        flattenObject(value, fullKey, out);
      } else {
        out[fullKey] = value;
      }
    });
    return out;
  }
  