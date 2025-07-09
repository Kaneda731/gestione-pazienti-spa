// src/shared/utils/formatting.js

/**
 * Utilities per formattazione
 */

/**
 * Formatta una data in formato italiano
 * @param {string|Date} date - Data da formattare
 * @returns {string} Data formattata
 */
export function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('it-IT');
}

/**
 * Formatta una data in formato ISO per input
 * @param {string|Date} date - Data da formattare
 * @returns {string} Data in formato YYYY-MM-DD
 */
export function formatDateForInput(date) {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
}

/**
 * Formatta un nome proprio (prima lettera maiuscola)
 * @param {string} name - Nome da formattare
 * @returns {string} Nome formattato
 */
export function formatName(name) {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Formatta un numero con separatori delle migliaia
 * @param {number} number - Numero da formattare
 * @returns {string} Numero formattato
 */
export function formatNumber(number) {
    if (number === null || number === undefined) return '';
    return new Intl.NumberFormat('it-IT').format(number);
}

/**
 * Tronca un testo alla lunghezza specificata
 * @param {string} text - Testo da troncare
 * @param {number} maxLength - Lunghezza massima
 * @param {string} suffix - Suffisso da aggiungere (default: '...')
 * @returns {string} Testo troncato
 */
export function truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Rimuove spazi extra da una stringa
 * @param {string} text - Testo da pulire
 * @returns {string} Testo pulito
 */
export function cleanText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
}

/**
 * Capitalizza ogni parola in una stringa
 * @param {string} text - Testo da capitalizzare
 * @returns {string} Testo capitalizzato
 */
export function capitalizeWords(text) {
    if (!text) return '';
    return text.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Genera un ID univoco
 * @param {string} prefix - Prefisso per l'ID
 * @returns {string} ID univoco
 */
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Converte una stringa in slug URL-friendly
 * @param {string} text - Testo da convertire
 * @returns {string} Slug generato
 */
export function slugify(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ñ]/g, 'n')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
