/**
 * Validation Layer - Core Validation Functions
 * Sistema di validazione centralizzato per ScriptPazienti
 * 
 * @version 1.0.0
 * @since 2025-06-26
 * @requires constants.js
 */

/**
 * Servizio core di validazione
 * Fornisce funzioni base di validazione riutilizzabili
 */
const CoreValidation = {

  /**
   * Valida se un valore non è vuoto o null
   * @param {*} value - Valore da validare
   * @returns {boolean} True se non vuoto
   */
  isNotEmpty(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },

  /**
   * Valida se una stringa ha una lunghezza minima
   * @param {string} str - Stringa da validare
   * @param {number} minLength - Lunghezza minima
   * @returns {boolean} True se la lunghezza è valida
   */
  hasMinLength(str, minLength = 1) {
    return this.isNotEmpty(str) && String(str).trim().length >= minLength;
  },

  /**
   * Valida se una stringa ha una lunghezza massima
   * @param {string} str - Stringa da validare
   * @param {number} maxLength - Lunghezza massima
   * @returns {boolean} True se la lunghezza è valida
   */
  hasMaxLength(str, maxLength) {
    if (!this.isNotEmpty(str)) return true; // Vuoto è sempre valido per max length
    return String(str).trim().length <= maxLength;
  },

  /**
   * Valida se una stringa corrisponde a un pattern regex
   * @param {string} str - Stringa da validare
   * @param {RegExp} pattern - Pattern regex
   * @returns {boolean} True se corrisponde al pattern
   */
  matchesPattern(str, pattern) {
    if (!this.isNotEmpty(str)) return false;
    return pattern.test(String(str).trim());
  },

  /**
   * Valida se un numero è in un range specifico
   * @param {number} num - Numero da validare
   * @param {number} min - Valore minimo (incluso)
   * @param {number} max - Valore massimo (incluso)
   * @returns {boolean} True se nel range
   */
  isInRange(num, min, max) {
    const number = Number(num);
    if (isNaN(number)) return false;
    return number >= min && number <= max;
  },

  /**
   * Valida se un valore è in una lista di valori ammessi
   * @param {*} value - Valore da validare
   * @param {Array} allowedValues - Lista valori ammessi
   * @returns {boolean} True se il valore è ammesso
   */
  isInList(value, allowedValues) {
    if (!Array.isArray(allowedValues)) return false;
    return allowedValues.includes(value);
  },

  /**
   * Sanitizza una stringa rimuovendo caratteri pericolosi
   * @param {string} str - Stringa da sanitizzare
   * @returns {string} Stringa sanitizzata
   */
  sanitizeString(str) {
    if (!this.isNotEmpty(str)) return '';
    return String(str)
      .trim()
      .replace(/[<>\"'&]/g, '') // Rimuove caratteri HTML pericolosi
      .replace(/\s+/g, ' '); // Normalizza spazi multipli
  },

  /**
   * Capitalizza correttamente le parole
   * @param {string} str - Stringa da capitalizzare
   * @returns {string} Stringa capitalizzata
   */
  capitalizeWords(str) {
    if (!this.isNotEmpty(str)) return '';
    return String(str)
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  },

  /**
   * Crea un risultato di validazione standardizzato
   * @param {boolean} isValid - Se la validazione è passata
   * @param {string} message - Messaggio di validazione
   * @param {*} value - Valore validato (opzionale)
   * @param {*} normalizedValue - Valore normalizzato (opzionale)
   * @returns {Object} Risultato standardizzato
   */
  createValidationResult(isValid, message, value = null, normalizedValue = null) {
    return {
      isValid: Boolean(isValid),
      message: String(message || ''),
      value: value,
      normalizedValue: normalizedValue !== null ? normalizedValue : value,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Combina più risultati di validazione
   * @param {Array} results - Array di risultati di validazione
   * @returns {Object} Risultato combinato
   */
  combineValidationResults(results) {
    if (!Array.isArray(results) || results.length === 0) {
      return this.createValidationResult(false, 'Nessun risultato di validazione fornito');
    }

    const allValid = results.every(result => result.isValid);
    const messages = results
      .filter(result => result.message)
      .map(result => result.message);
    
    const combinedMessage = allValid 
      ? 'Tutte le validazioni sono passate'
      : messages.join('; ');

    return this.createValidationResult(allValid, combinedMessage, results);
  },

  /**
   * Verifica la disponibilità del servizio
   * @returns {boolean} True se disponibile
   */
  isAvailable() {
    return true;
  }
};

// Log del caricamento del modulo
if (typeof logAvanzato === 'function') {
  logAvanzato('CoreValidation caricato correttamente', 'INFO');
} else {
  console.log('✓ CoreValidation caricato');
}
