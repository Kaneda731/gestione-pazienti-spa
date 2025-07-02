/**
 * Validation Layer - Patient Data Validation
 * Sistema di validazione specifico per dati pazienti
 * 
 * @version 1.0.0
 * @since 2025-06-26
 * @requires validation/coreValidation.js
 * @requires validation/dateValidation.js
 * @requires constants.js
 */

/**
 * Servizio di validazione per dati pazienti
 * Estende le validazioni di base con logiche specifiche per pazienti
 */
const PatientValidation = {

  /**
   * Pattern per validazione dati pazienti
   */
  PATTERNS: {
    NOME_COGNOME: /^[a-zA-ZÀ-ÿĀ-žА-я\s'\-]+$/,
    CODICE_FISCALE: /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/,
    TELEFONO: /^[\+]?[0-9\s\-\(\)]{8,15}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  /**
   * Valida nome e cognome del paziente
   * @param {string} nome - Nome del paziente  
   * @param {string} cognome - Cognome del paziente
   * @returns {Object} Risultato validazione
   */
  validateNameSurname(nome, cognome) {
    const nomeClean = CoreValidation.sanitizeString(nome);
    const cognomeClean = CoreValidation.sanitizeString(cognome);

    // Verifica che non siano vuoti
    if (!CoreValidation.isNotEmpty(nomeClean)) {
      return CoreValidation.createValidationResult(
        false,
        'Il nome è obbligatorio.',
        { nome, cognome },
        { nome: nomeClean, cognome: cognomeClean }
      );
    }

    if (!CoreValidation.isNotEmpty(cognomeClean)) {
      return CoreValidation.createValidationResult(
        false,
        'Il cognome è obbligatorio.',
        { nome, cognome },
        { nome: nomeClean, cognome: cognomeClean }
      );
    }

    // Verifica lunghezza minima
    if (!CoreValidation.hasMinLength(nomeClean, 2)) {
      return CoreValidation.createValidationResult(
        false,
        'Il nome deve avere almeno 2 caratteri.',
        { nome, cognome },
        { nome: nomeClean, cognome: cognomeClean }
      );
    }

    if (!CoreValidation.hasMinLength(cognomeClean, 2)) {
      return CoreValidation.createValidationResult(
        false,
        'Il cognome deve avere almeno 2 caratteri.',
        { nome, cognome },
        { nome: nomeClean, cognome: cognomeClean }
      );
    }

    // Verifica pattern caratteri validi
    if (!CoreValidation.matchesPattern(nomeClean, this.PATTERNS.NOME_COGNOME)) {
      return CoreValidation.createValidationResult(
        false,
        'Il nome può contenere solo lettere, spazi, apostrofi e trattini.',
        { nome, cognome },
        { nome: nomeClean, cognome: cognomeClean }
      );
    }

    if (!CoreValidation.matchesPattern(cognomeClean, this.PATTERNS.NOME_COGNOME)) {
      return CoreValidation.createValidationResult(
        false,
        'Il cognome può contenere solo lettere, spazi, apostrofi e trattini.',
        { nome, cognome },
        { nome: nomeClean, cognome: cognomeClean }
      );
    }

    // Normalizza capitalizzazione
    const nomeNormalized = CoreValidation.capitalizeWords(nomeClean);
    const cognomeNormalized = CoreValidation.capitalizeWords(cognomeClean);

    return CoreValidation.createValidationResult(
      true,
      'Nome e cognome validi.',
      { nome, cognome },
      { nome: nomeNormalized, cognome: cognomeNormalized }
    );
  },

  /**
   * Valida una diagnosi medica
   * @param {string} diagnosi - Diagnosi da validare
   * @returns {Object} Risultato validazione
   */
  validateDiagnosis(diagnosi) {
    const diagnosiClean = CoreValidation.sanitizeString(diagnosi);

    if (!CoreValidation.isNotEmpty(diagnosiClean)) {
      return CoreValidation.createValidationResult(
        false,
        'La diagnosi è obbligatoria.',
        diagnosi,
        diagnosiClean
      );
    }

    if (!CoreValidation.hasMinLength(diagnosiClean, 3)) {
      return CoreValidation.createValidationResult(
        false,
        'La diagnosi deve avere almeno 3 caratteri.',
        diagnosi,
        diagnosiClean
      );
    }

    if (!CoreValidation.hasMaxLength(diagnosiClean, 200)) {
      return CoreValidation.createValidationResult(
        false,
        'La diagnosi non può superare 200 caratteri.',
        diagnosi,
        diagnosiClean
      );
    }

    // Normalizza capitalizzazione
    const diagnosiNormalized = CoreValidation.capitalizeWords(diagnosiClean);

    return CoreValidation.createValidationResult(
      true,
      'Diagnosi valida.',
      diagnosi,
      diagnosiNormalized
    );
  },

  /**
   * Valida il reparto ospedaliero
   * @param {string} reparto - Reparto da validare
   * @param {Array} repartiValidi - Lista reparti validi (opzionale)
   * @returns {Object} Risultato validazione
   */
  validateDepartment(reparto, repartiValidi = []) {
    const repartoClean = CoreValidation.sanitizeString(reparto);

    if (!CoreValidation.isNotEmpty(repartoClean)) {
      return CoreValidation.createValidationResult(
        false,
        'Il reparto è obbligatorio.',
        reparto,
        repartoClean
      );
    }

    // Se ci sono reparti validi specifici, verifica
    if (repartiValidi.length > 0 && !CoreValidation.isInList(repartoClean, repartiValidi)) {
      return CoreValidation.createValidationResult(
        false,
        `Reparto non valido. Reparti disponibili: ${repartiValidi.join(', ')}`,
        reparto,
        repartoClean
      );
    }

    const repartoNormalized = CoreValidation.capitalizeWords(repartoClean);

    return CoreValidation.createValidationResult(
      true,
      'Reparto valido.',
      reparto,
      repartoNormalized
    );
  },

  /**
   * Valida un codice paziente/identificativo
   * @param {string} codice - Codice da validare
   * @returns {Object} Risultato validazione
   */
  validatePatientCode(codice) {
    const codiceClean = String(codice || '').trim().toUpperCase();

    if (!CoreValidation.isNotEmpty(codiceClean)) {
      return CoreValidation.createValidationResult(
        false,
        'Il codice paziente è obbligatorio.',
        codice,
        codiceClean
      );
    }

    if (!CoreValidation.hasMinLength(codiceClean, 3)) {
      return CoreValidation.createValidationResult(
        false,
        'Il codice paziente deve avere almeno 3 caratteri.',
        codice,
        codiceClean
      );
    }

    if (!CoreValidation.hasMaxLength(codiceClean, 20)) {
      return CoreValidation.createValidationResult(
        false,
        'Il codice paziente non può superare 20 caratteri.',
        codice,
        codiceClean
      );
    }

    // Pattern base per codice (lettere, numeri, trattini)
    const CODICE_PATTERN = /^[A-Z0-9\-]+$/;
    if (!CoreValidation.matchesPattern(codiceClean, CODICE_PATTERN)) {
      return CoreValidation.createValidationResult(
        false,
        'Il codice paziente può contenere solo lettere maiuscole, numeri e trattini.',
        codice,
        codiceClean
      );
    }

    return CoreValidation.createValidationResult(
      true,
      'Codice paziente valido.',
      codice,
      codiceClean
    );
  },

  /**
   * Valida l'età di un paziente
   * @param {number|string} eta - Età da validare
   * @returns {Object} Risultato validazione
   */
  validateAge(eta) {
    const etaNumber = Number(eta);

    if (isNaN(etaNumber)) {
      return CoreValidation.createValidationResult(
        false,
        'L\'età deve essere un numero valido.',
        eta,
        null
      );
    }

    if (!CoreValidation.isInRange(etaNumber, 0, 150)) {
      return CoreValidation.createValidationResult(
        false,
        'L\'età deve essere compresa tra 0 e 150 anni.',
        eta,
        etaNumber
      );
    }

    return CoreValidation.createValidationResult(
      true,
      'Età valida.',
      eta,
      Math.floor(etaNumber)
    );
  },

  /**
   * Valida un record paziente completo
   * @param {Object} patientData - Dati paziente da validare
   * @returns {Object} Risultato validazione completa
   */
  validatePatientRecord(patientData) {
    const {
      nome,
      cognome, 
      diagnosi,
      reparto,
      dataIngresso,
      dataDimissione,
      eta,
      codice
    } = patientData || {};

    const validationResults = [];

    // Valida nome e cognome
    validationResults.push(this.validateNameSurname(nome, cognome));

    // Valida diagnosi se presente
    if (diagnosi) {
      validationResults.push(this.validateDiagnosis(diagnosi));
    }

    // Valida reparto se presente
    if (reparto) {
      validationResults.push(this.validateDepartment(reparto));
    }

    // Valida età se presente
    if (eta !== undefined && eta !== null) {
      validationResults.push(this.validateAge(eta));
    }

    // Valida codice se presente
    if (codice) {
      validationResults.push(this.validatePatientCode(codice));
    }

    // Valida date se disponibili e DateValidation è caricato
    if (typeof DateValidation !== 'undefined') {
      if (dataIngresso) {
        validationResults.push(DateValidation.validateAdmissionDate(dataIngresso));
      }
      
      if (dataDimissione) {
        const ingressoDate = DateValidation.parseDate(dataIngresso);
        validationResults.push(DateValidation.validateDischargeDate(dataDimissione, ingressoDate));
      }
    }

    // Combina tutti i risultati
    return CoreValidation.combineValidationResults(validationResults);
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
  logAvanzato('PatientValidation caricato correttamente', 'INFO');
} else {
  console.log('✓ PatientValidation caricato');
}
