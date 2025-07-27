import DOMPurify from 'dompurify';

/**
 * Sanitize a string of HTML to prevent XSS attacks.
 * @param {string} dirtyHtml - The potentially unsafe HTML string.
 * @returns {string} - The sanitized HTML string.
 */
export function sanitizeHtml(dirtyHtml) {
  return DOMPurify.sanitize(dirtyHtml);
}
