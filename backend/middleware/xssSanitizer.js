/**
 * Simple XSS sanitization utility.
 * Strips dangerous HTML/script characters from string values in objects.
 */

const DANGEROUS_PATTERNS = [
  /&/g,
  /</g,
  />/g,
  /"/g,
  /'/g,
];

const REPLACEMENTS = ['&amp;', '&lt;', '&gt;', '&quot;', '&#x27;'];

/**
 * Escape HTML entities in a string.
 */
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  let result = str;
  for (let i = 0; i < DANGEROUS_PATTERNS.length; i++) {
    result = result.replace(DANGEROUS_PATTERNS[i], REPLACEMENTS[i]);
  }
  return result;
};

/**
 * Recursively sanitize all string values in an object.
 */
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') return escapeHtml(obj);
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to prevent XSS attacks.
 */
const xssSanitizer = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = xssSanitizer;
