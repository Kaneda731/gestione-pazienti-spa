// Shared search utilities
// debounce, highlight, key helpers

import DOMPurify from 'dompurify';

export function debounce(fn, delay = 250) {
  let t;
  return function debounced(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), Math.max(0, delay));
  };
}

export function toSearchKey(term, activeOnly) {
  const t = (term || '').trim().toLowerCase();
  return `${t}::${activeOnly ? '1' : '0'}`;
}

export function escapeHtml(str = '') {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function highlight(text = '', term = '') {
  const t = term.trim();
  if (!t) return escapeHtml(text);
  try {
    const pattern = new RegExp(`(${t.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'ig');
    const replaced = escapeHtml(text).replace(pattern, '<mark>$1</mark>');
    return DOMPurify.sanitize(replaced, { ALLOWED_TAGS: ['mark'] });
  } catch {
    return escapeHtml(text);
  }
}

export function withAbortable(promiseFactory) {
  const controller = new AbortController();
  const promise = promiseFactory(controller.signal);
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
    then: (...args) => promise.then(...args),
    catch: (...args) => promise.catch(...args),
    finally: (...args) => promise.finally(...args),
  };
}

export default {
  debounce,
  toSearchKey,
  escapeHtml,
  highlight,
  withAbortable,
};
