/**
 * Validation Layer - Date Validation Functions
 * Sistema di validazione per date centralizzato
 * 
 * @version 1.0.0
 * @since 2025-06-26
 * @requires validation/coreValidation.js
 */

/**
 * Servizio di validazione per le date
 * Centralizza tutte le validazioni relative alle date
 */
const DateValidation = {

  /**
   * Parsing avanzato di date da diversi formati
   * @param {string|Date} input - Input da parsare
   * @returns {Date|null} Oggetto Date valido o null
   */
  parseDate(input) {
    if (!input) return null;
    
    // Se è già un oggetto Date, validalo
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? null : input;
    }
    
    // Converte in stringa e pulisce
    const str = String(input).trim();
    if (!str) return null;
    
    // Pattern supportati
    const patterns = [
      {
        regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // GG/MM/AAAA
        order: ['day', 'month', 'year']
      },
      {
        regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // GG-MM-AAAA
        order: ['day', 'month', 'year']
      },
      {
        regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,  // AAAA/MM/GG
        order: ['year', 'month', 'day']
      },
      {
        regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // AAAA-MM-GG
        order: ['year', 'month', 'day']
      },
      {
        regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,  // GG.MM.AAAA
        order: ['day', 'month', 'year']
      }
    ];
    
    // Prova ogni pattern
    for (const pattern of patterns) {
      const match = str.match(pattern.regex);
      if (match) {
        const parts = {};
        pattern.order.forEach((part, index) => {
          parts[part] = parseInt(match[index + 1], 10);
        });
        
        const year = parts.year;
        const month = parts.month - 1; // JavaScript usa 0-11
        const day = parts.day;
        
        // Validazione base dei valori
        if (!this.isValidDateParts(day, month + 1, year)) {
          continue;
        }
        
        const date = new Date(year, month, day);
        
        // Verifica che la data creata corrisponda ai valori inseriti
        if (date.getFullYear() === year && 
            date.getMonth() === month && 
            date.getDate() === day) {
          return date;
        }
      }
    }
    
    // Prova il parsing standard come fallback
    const standardDate = new Date(str);
    return isNaN(standardDate.getTime()) ? null : standardDate;
  },

  /**
   * Valida i componenti di una data (giorno, mese, anno)
   * @param {number} day - Giorno (1-31)
   * @param {number} month - Mese (1-12)
   * @param {number} year - Anno
   * @returns {boolean} True se i componenti sono validi
   */
  isValidDateParts(day, month, year) {
    return day >= 1 && day <= 31 && 
           month >= 1 && month <= 12 && 
           year >= 1900 && year <= 2100;
  },

  /**
   * Normalizza una data per evitare problemi di timezone
   * @param {Date} date - Data da normalizzare
   * @returns {Date|null} Data normalizzata o null
   */
  normalizeDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    
    // Crea una nuova data a mezzogiorno per evitare problemi DST
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  },

  /**
   * Verifica se una data è nel passato
   * @param {Date} date - Data da verificare
   * @param {Date} referenceDate - Data di riferimento (default: oggi)
   * @returns {boolean} True se nel passato
   */
  isInPast(date, referenceDate = new Date()) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return false;
    return date < referenceDate;
  },

  /**
   * Verifica se una data è nel futuro
   * @param {Date} date - Data da verificare
   * @param {Date} referenceDate - Data di riferimento (default: oggi)
   * @returns {boolean} True se nel futuro
   */
  isInFuture(date, referenceDate = new Date()) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return false;
    return date > referenceDate;
  },

  /**
   * Verifica se una data è in un range specifico
   * @param {Date} date - Data da verificare
   * @param {Date} startDate - Data inizio range
   * @param {Date} endDate - Data fine range
   * @returns {boolean} True se nel range
   */
  isInDateRange(date, startDate, endDate) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return false;
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) return false;
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) return false;
    
    return date >= startDate && date <= endDate;
  },

  /**
   * Calcola la differenza in giorni tra due date
   * @param {Date} date1 - Prima data
   * @param {Date} date2 - Seconda data
   * @returns {number|null} Differenza in giorni o null se errore
   */
  daysDifference(date1, date2) {
    if (!(date1 instanceof Date) || isNaN(date1.getTime()) ||
        !(date2 instanceof Date) || isNaN(date2.getTime())) {
      return null;
    }
    
    const oneDay = 24 * 60 * 60 * 1000; // millisecondi in un giorno
    return Math.round((date2 - date1) / oneDay);
  },

  /**
   * Valida una data di ingresso ospedaliero
   * @param {string|Date} dateInput - Input data da validare
   * @returns {Object} Risultato validazione
   */
  validateAdmissionDate(dateInput) {
    const date = this.parseDate(dateInput);
    
    if (!date) {
      return CoreValidation.createValidationResult(
        false, 
        'Formato data non valido. Utilizzare GG/MM/AAAA.',
        dateInput
      );
    }

    // Data non può essere futura
    if (this.isInFuture(date)) {
      return CoreValidation.createValidationResult(
        false,
        'La data di ingresso non può essere nel futuro.',
        dateInput,
        date
      );
    }

    // Data non può essere troppo vecchia (10 anni fa)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    if (date < tenYearsAgo) {
      return CoreValidation.createValidationResult(
        false,
        'La data di ingresso sembra troppo vecchia. Verificare.',
        dateInput,
        date
      );
    }

    const normalizedDate = this.normalizeDate(date);
    return CoreValidation.createValidationResult(
      true,
      'Data di ingresso valida.',
      dateInput,
      normalizedDate
    );
  },

  /**
   * Valida una data di dimissione ospedaliera
   * @param {string|Date} dateInput - Input data da validare
   * @param {Date} admissionDate - Data di ingresso per confronto (opzionale)
   * @returns {Object} Risultato validazione
   */
  validateDischargeDate(dateInput, admissionDate = null) {
    const date = this.parseDate(dateInput);
    
    if (!date) {
      return CoreValidation.createValidationResult(
        false,
        'Formato data non valido. Utilizzare GG/MM/AAAA.',
        dateInput
      );
    }

    // Data non può essere futura
    if (this.isInFuture(date)) {
      return CoreValidation.createValidationResult(
        false,
        'La data di dimissione non può essere nel futuro.',
        dateInput,
        date
      );
    }

    // Se c'è una data di ingresso, la dimissione deve essere successiva
    if (admissionDate && date < admissionDate) {
      return CoreValidation.createValidationResult(
        false,
        'La data di dimissione deve essere successiva alla data di ingresso.',
        dateInput,
        date
      );
    }

    // Data non può essere troppo vecchia (10 anni fa)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    if (date < tenYearsAgo) {
      return CoreValidation.createValidationResult(
        false,
        'La data di dimissione sembra troppo vecchia. Verificare.',
        dateInput,
        date
      );
    }

    const normalizedDate = this.normalizeDate(date);
    return CoreValidation.createValidationResult(
      true,
      'Data di dimissione valida.',
      dateInput,
      normalizedDate
    );
  },

  /**
   * Verifica la disponibilità del servizio
   * @returns {boolean} True se disponibile
   */
  isAvailable() {
    return typeof CoreValidation !== 'undefined' && CoreValidation.isAvailable();
  }
};

// Log del caricamento del modulo
if (typeof logAvanzato === 'function') {
  logAvanzato('DateValidation caricato correttamente', 'INFO');
} else {
  console.log('✓ DateValidation caricato');
}
