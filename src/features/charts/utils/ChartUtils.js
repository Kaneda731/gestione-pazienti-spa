/**
 * Utility per la gestione dei grafici
 */
class ChartUtils {
  /**
   * Funzione di throttling per limitare la frequenza di esecuzione
   * @param {Function} func - La funzione da eseguire
   * @param {number} limit - Il limite in millisecondi
   * @returns {Function} - La funzione con throttling
   */
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Funzione di debouncing per ritardare l'esecuzione
   * @param {Function} func - La funzione da eseguire
   * @param {number} wait - Il tempo di attesa in millisecondi
   * @returns {Function} - La funzione con debouncing
   */
  static debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  /**
   * Clona in modo sicuro un oggetto, gestendo le referenze circolari
   * @param {Object} obj - L'oggetto da clonare
   * @returns {Object} - L'oggetto clonato
   */
  static safeClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    try {
      // Prova a utilizzare JSON.parse/stringify per un deep clone
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.warn('Errore durante il deep clone, utilizzo shallow copy:', error);
      
      // Fallback a shallow copy
      if (Array.isArray(obj)) {
        return [...obj];
      }
      
      return { ...obj };
    }
  }

  /**
   * Calcola la percentuale di un valore rispetto a un totale
   * @param {number} value - Il valore
   * @param {number} total - Il totale
   * @param {number} decimals - Il numero di decimali (default: 1)
   * @returns {string} - La percentuale formattata
   */
  static calculatePercentage(value, total, decimals = 1) {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(decimals) + '%';
  }

  /**
   * Genera un ID univoco
   * @param {string} prefix - Prefisso per l'ID
   * @returns {string} - ID univoco
   */
  static generateUniqueId(prefix = 'chart') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica se un elemento è visibile nel viewport
   * @param {HTMLElement} element - L'elemento da verificare
   * @returns {boolean} - True se l'elemento è visibile
   */
  static isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Formatta un numero per la visualizzazione
   * @param {number} number - Il numero da formattare
   * @param {string} locale - Il locale da utilizzare (default: 'it-IT')
   * @returns {string} - Il numero formattato
   */
  static formatNumber(number, locale = 'it-IT') {
    return new Intl.NumberFormat(locale).format(number);
  }

  /**
   * Ottiene il colore di un dataset in base all'indice
   * @param {Object} dataset - Il dataset
   * @param {number} index - L'indice dell'elemento
   * @returns {string} - Il colore
   */
  static getDatasetColor(dataset, index) {
    if (!dataset) return '#36A2EB';
    
    if (Array.isArray(dataset.backgroundColor)) {
      return dataset.backgroundColor[index] || dataset.borderColor || '#36A2EB';
    }
    
    return dataset.backgroundColor || dataset.borderColor || '#36A2EB';
  }

  /**
   * Calcola il totale di un array di valori
   * @param {Array} data - Array di valori
   * @returns {number} - La somma dei valori
   */
  static calculateTotal(data) {
    if (!Array.isArray(data)) return 0;
    return data.reduce((sum, val) => sum + (Number(val) || 0), 0);
  }
}

export default ChartUtils;