import type { Request, Response, NextFunction } from "express";
import xss from "xss";
import { logger } from "../lib/logger";

/**
 * Basic WAF Middleware
 * - XSS Protection: Sanitizes input strings in req.body, req.query, and req.params
 * - Suspicious Pattern Blocking: Blocks requests containing common SQL injection or path traversal patterns
 */

const SUSPICIOUS_PATTERNS = [
  /(\%27)|(\-\-)|(\%23)/i, // SQLi patterns (removed single ' and # to avoid false positives)
  /(<script.*?>)|(<\/script>)/i,   // Simple XSS tags
  /(\.\.\/|\.\.\\)/,               // Path traversal
  /union\s+select/i,               // SQLi union select
  /exec\s+xp_/i,                   // SQLi stored procedure
];

function sanitizeObject(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    if (typeof obj === "string") {
      return xss(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
}

function isSuspicious(val: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(val));
}

function checkSuspicious(obj: any): boolean {
  if (typeof obj !== "object" || obj === null) {
    if (typeof obj === "string") {
      return isSuspicious(obj);
    }
    return false;
  }

  if (Array.isArray(obj)) {
    return obj.some(checkSuspicious);
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (checkSuspicious(obj[key])) return true;
    }
  }
  return false;
}

export const waf = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for suspicious patterns in URL and query
    if (checkSuspicious(req.url) || checkSuspicious(req.query) || checkSuspicious(req.params)) {
      logger.warn({ url: req.url, ip: req.ip }, "Suspicious request blocked by WAF");
      res.status(403).json({ error: "Forbidden", message: "Suspicious activity detected." });
      return;
    }

    // Sanitize body, query and params
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);

    next();
  } catch (err) {
    logger.error({ err }, "WAF error");
    next(); // Fallback to continue if WAF fails, but consider if you want to block
  }
};
