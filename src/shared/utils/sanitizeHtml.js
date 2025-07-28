import DOMPurify from 'dompurify';

/**
 * Sanitize a string of HTML to prevent XSS attacks.
 * @param {string} dirtyHtml - The potentially unsafe HTML string.
 * @returns {string} - The sanitized HTML string.
 */
export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml) return '';
  try {
    return DOMPurify.sanitize(dirtyHtml);
  } catch (error) {
    console.warn('Error sanitizing HTML:', error);
    return String(dirtyHtml).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
