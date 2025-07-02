/**
 * Validation Layer - Main Validation System
 * Sistema di validazione centralizzato per ScriptPazienti
 * 
 * @version 1.0.0
 * @since 2025-06-26
 * @requires validation/coreValidation.js
 * @requires validation/dateValidation.js
 * @requires validation/csvValidation.js
 * @requires validation/patientValidation.js
 */

/**
 * Sistema di validazione unificato
 * Punto di accesso centrale per tutte le validazioni del progetto
 */
const ValidationSystem = {

  /**
   * Versione del sistema di validazione
   */
  VERSION: '1.0.0',

  /**
   * Moduli di validazione disponibili
   */
  modules: {
    core: 'CoreValidation',
    date: 'DateValidation', 
    csv: 'CsvValidation',
    patient: 'PatientValidation'
  },

  /**
   * Inizializza il sistema di validazione
   * @returns {Object} Risultato dell'inizializzazione
   */
  init() {
    const results = {
      success: true,
      loadedModules: [],
      failedModules: [],
      errors: []
    };

    // Verifica e carica ogni modulo
    Object.entries(this.modules).forEach(([key, moduleName]) => {
      try {
        if (typeof window !== 'undefined' && window[moduleName]) {
          // Browser environment
          this[key] = window[moduleName];
          results.loadedModules.push(moduleName);
        } else if (typeof global !== 'undefined' && global[moduleName]) {
          // Node.js environment  
          this[key] = global[moduleName];
          results.loadedModules.push(moduleName);
        } else if (typeof eval !== 'undefined' && typeof eval(moduleName) !== 'undefined') {
          // Google Apps Script environment
          this[key] = eval(moduleName);
          results.loadedModules.push(moduleName);
        } else {
          results.failedModules.push(moduleName);
          results.errors.push(`Modulo ${moduleName} non trovato`);
        }
      } catch (error) {
        results.failedModules.push(moduleName);
        results.errors.push(`Errore caricamento ${moduleName}: ${error.message}`);
      }
    });

    // Verifica se ci sono errori critici
    if (results.failedModules.length > 0) {
      results.success = false;
    }

    this.initResult = results;
    return results;
  },

  /**
   * Verifica se il sistema è pronto per l'uso
   * @returns {boolean} True se tutti i moduli sono caricati
   */
  isReady() {
    return this.initResult && this.initResult.success && 
           this.core && this.core.isAvailable();
  },

  /**
   * Ottiene informazioni sui moduli caricati
   * @returns {Object} Informazioni sui moduli
   */
  getModuleInfo() {
    if (!this.initResult) {
      this.init();
    }

    return {
      version: this.VERSION,
      totalModules: Object.keys(this.modules).length,
      loadedModules: this.initResult.loadedModules,
      failedModules: this.initResult.failedModules,
      isReady: this.isReady()
    };
  },

  // ==========================================
  // VALIDAZIONI RAPIDE (Delegate Methods)
  // ==========================================

  /**
   * Validazione rapida nome e cognome
   * @param {string} nome - Nome
   * @param {string} cognome - Cognome  
   * @returns {Object} Risultato validazione
   */
  validateName(nome, cognome) {
    if (!this.isReady() || !this.patient) {
      return this.createFallbackResult(false, 'Sistema validazione non disponibile');
    }
    return this.patient.validateNameSurname(nome, cognome);
  },

  /**
   * Validazione rapida data
   * @param {string|Date} dateInput - Data da validare
   * @param {string} type - Tipo di data ('admission', 'discharge', 'generic')
   * @returns {Object} Risultato validazione
   */
  validateDate(dateInput, type = 'generic') {
    if (!this.isReady() || !this.date) {
      return this.createFallbackResult(false, 'Sistema validazione date non disponibile');
    }

    switch (type) {
      case 'admission':
        return this.date.validateAdmissionDate(dateInput);
      case 'discharge':
        return this.date.validateDischargeDate(dateInput);
      default:
        const parsedDate = this.date.parseDate(dateInput);
        return this.core.createValidationResult(
          parsedDate !== null,
          parsedDate ? 'Data valida' : 'Formato data non valido',
          dateInput,
          parsedDate
        );
    }
  },

  /**
   * Validazione rapida CSV
   * @param {Array} csvData - Dati CSV
   * @param {Object} options - Opzioni validazione
   * @returns {Object} Risultato validazione
   */
  validateCsv(csvData, options = {}) {
    if (!this.isReady() || !this.csv) {
      return this.createFallbackResult(false, 'Sistema validazione CSV non disponibile');
    }
    return this.csv.validateFullCsv(csvData, options);
  },

  /**
   * Validazione rapida record paziente
   * @param {Object} patientData - Dati paziente
   * @returns {Object} Risultato validazione
   */
  validatePatient(patientData) {
    if (!this.isReady() || !this.patient) {
      return this.createFallbackResult(false, 'Sistema validazione paziente non disponibile');
    }
    return this.patient.validatePatientRecord(patientData);
  },

  /**
   * Validazione generica con fallback
   * @param {*} value - Valore da validare
   * @param {string} type - Tipo di validazione
   * @returns {Object} Risultato validazione
   */
  validate(value, type) {
    if (!this.isReady()) {
      return this.createFallbackResult(false, 'Sistema validazione non disponibile');
    }

    switch (type) {
      case 'notEmpty':
        return this.core.createValidationResult(
          this.core.isNotEmpty(value),
          this.core.isNotEmpty(value) ? 'Valore valido' : 'Valore richiesto',
          value
        );
      
      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return this.core.createValidationResult(
          this.core.matchesPattern(value, emailPattern),
          this.core.matchesPattern(value, emailPattern) ? 'Email valida' : 'Formato email non valido',
          value
        );

      default:
        return this.createFallbackResult(false, `Tipo di validazione '${type}' non riconosciuto`);
    }
  },

  /**
   * Crea un risultato di fallback quando i moduli non sono disponibili
   * @param {boolean} isValid - Se è valido
   * @param {string} message - Messaggio
   * @returns {Object} Risultato standardizzato
   */
  createFallbackResult(isValid, message) {
    return {
      isValid: Boolean(isValid),
      message: String(message || ''),
      value: null,
      normalizedValue: null,
      timestamp: new Date().toISOString(),
      fallback: true
    };
  },

  /**
   * Utility per debug e testing
   * @returns {Object} Informazioni di debug
   */
  debug() {
    return {
      system: this.getModuleInfo(),
      modules: {
        core: this.core ? 'LOADED' : 'NOT_LOADED',
        date: this.date ? 'LOADED' : 'NOT_LOADED', 
        csv: this.csv ? 'LOADED' : 'NOT_LOADED',
        patient: this.patient ? 'LOADED' : 'NOT_LOADED'
      },
      ready: this.isReady()
    };
  }
};

// Auto-inizializzazione del sistema
ValidationSystem.init();

// Log del caricamento del modulo
if (typeof logAvanzato === 'function') {
  logAvanzato('ValidationSystem caricato correttamente', 'INFO');
} else {
  console.log('✓ ValidationSystem caricato');
}

// Esposizione globale per compatibilità
if (typeof window !== 'undefined') {
  window.ValidationSystem = ValidationSystem;
} else if (typeof global !== 'undefined') {
  global.ValidationSystem = ValidationSystem;
}
