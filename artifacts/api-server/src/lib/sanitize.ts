import xss from "xss";

/**
 * Sanitizes a string to prevent XSS attacks.
 * It uses the 'xss' library to strip out dangerous HTML tags and attributes.
 *
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitize(input: string): string {
  if (!input) return input;
  return xss(input);
}

/**
 * Sanitizes an object by applying sanitization to specified fields.
 *
 * @param obj The object to sanitize.
 * @param fields The fields to sanitize.
 * @returns The object with sanitized fields.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === "string") {
      result[field] = sanitize(result[field]) as any;
    }
  }
  return result;
}
