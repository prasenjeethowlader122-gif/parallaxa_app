import type { Request, Response, NextFunction } from "express";
import xss from "xss";
import { logger } from "../lib/logger";

/**
 * WAF Middleware
 * - Blocks requests containing SQLi, XSS, path traversal patterns
 * - Sanitizes req.body (XSS clean)
 * - Compatible with Express 5 (req.query is a getter — overridden via defineProperty)
 */

const SUSPICIOUS_PATTERNS: RegExp[] = [
  /(\%27)|(\-\-)|(\%23)/i,             // SQLi encoded chars
  /(<script[\s\S]*?>)|(<\/script>)/i,  // Script tags
  /(\.\.\/|\.\.\\)/,                   // Path traversal
  /union\s+select/i,                   // SQLi union
  /exec\s+xp_/i,                       // SQLi stored proc
  /insert\s+into/i,                    // SQLi insert
  /drop\s+table/i,                     // SQLi drop
  /or\s+1\s*=\s*1/i,                   // SQLi tautology
  /javascript:/i,                       // JS protocol injection
  /on(load|error|click|mouseover)\s*=/i, // Event handler injection
];

function sanitizeValue(val: unknown): unknown {
  if (typeof val === "string") return xss(val);
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const k in val as object) {
      if (Object.prototype.hasOwnProperty.call(val, k)) {
        out[k] = sanitizeValue((val as Record<string, unknown>)[k]);
      }
    }
    return out;
  }
  return val;
}

function isSuspicious(val: unknown): boolean {
  if (typeof val === "string") return SUSPICIOUS_PATTERNS.some((p) => p.test(val));
  if (Array.isArray(val)) return val.some(isSuspicious);
  if (val !== null && typeof val === "object") {
    return Object.values(val as object).some(isSuspicious);
  }
  return false;
}

export const waf = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 1. Block suspicious patterns in URL, query string, and params
    if (
      isSuspicious(req.url) ||
      isSuspicious(req.query) ||
      isSuspicious(req.params)
    ) {
      logger.warn(
        { url: req.url, ip: req.ip, ua: req.headers["user-agent"] },
        "WAF: suspicious request blocked"
      );
      res.status(403).json({
        error: "Forbidden",
        message: "Request blocked by security policy.",
      });
      return;
    }

    // 2. Sanitize body (Express sets this as a writable property via json middleware)
    if (req.body !== undefined && req.body !== null) {
      req.body = sanitizeValue(req.body);
    }

    // 3. Sanitize query — Express 5 makes req.query a non-writable getter,
    //    so we override the descriptor to inject the sanitized value.
    const sanitizedQuery = sanitizeValue(req.query) as Record<string, unknown>;
    try {
      Object.defineProperty(req, "query", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: sanitizedQuery,
      });
    } catch {
      // If defineProperty fails, mutate keys in-place
      const q = req.query as Record<string, unknown>;
      for (const key in sanitizedQuery) {
        if (Object.prototype.hasOwnProperty.call(sanitizedQuery, key)) {
          q[key] = sanitizedQuery[key];
        }
      }
    }

    // 4. Sanitize params (regular writable object)
    if (req.params) {
      const sanitizedParams = sanitizeValue(req.params) as Record<string, string>;
      Object.assign(req.params, sanitizedParams);
    }

    next();
  } catch (err) {
    logger.error({ err }, "WAF processing error — blocking request for safety");
    res.status(500).json({ error: "Internal Server Error" });
  }
};
