/**
 * InfectionDataManager - Gestisce lo stato temporaneo dei dati di infezione
 * durante il processo di inserimento paziente
 */
class InfectionDataManager {
  constructor() {
    this.infectionData = null;
    this.isValid = false;
    this.validationErrors = [];
  }

  /**
   * Imposta i dati di infezione e li valida
   * @param {Object} data - Dati infezione
   * @param {string} data.data_evento - Data infezione (YYYY-MM-DD)
   * @param {string} data.agente_patogeno - Agente patogeno
   * @param {string} [data.descrizione] - Descrizione opzionale
   */
  setInfectionData(data) {
    if (!data) {
      this.clearInfectionData();
      return;
    }

    this.infectionData = {
      data_evento: data.data_evento || '',
      agente_patogeno: data.agente_patogeno || '',
      descrizione: data.descrizione || '',
      timestamp: Date.now()
    };

    this.validateInfectionData(this.infectionData);
  }

  /**
   * Restituisce i dati di infezione correnti
   * @returns {Object|null} Dati infezione o null se non presenti
   */
  getInfectionData() {
    return this.infectionData ? { ...this.infectionData } : null;
  }

  /**
   * Pulisce tutti i dati temporanei di infezione
   */
  clearInfectionData() {
    this.infectionData = null;
    this.isValid = false;
    this.validationErrors = [];
  }

  /**
   * Verifica se ci sono dati di infezione validi
   * @returns {boolean} True se i dati sono presenti e validi
   */
  hasValidInfectionData() {
    return this.infectionData !== null && this.isValid;
  }

  /**
   * Verifica se ci sono dati di infezione (anche se non validi)
   * @returns {boolean} True se ci sono dati presenti
   */
  hasInfectionData() {
    return this.infectionData !== null;
  }

  /**
   * Valida i dati di infezione
   * @param {Object} data - Dati da validare
   * @returns {boolean} True se i dati sono validi
   */
  validateInfectionData(data) {
    this.validationErrors = [];
    
    if (!data) {
      this.isValid = false;
      return false;
    }

    // Validazione data evento
    if (!data.data_evento) {
      this.validationErrors.push({
        field: 'data_evento',
        message: 'La data dell\'infezione è obbligatoria'
      });
    } else {
      const eventDate = new Date(data.data_evento);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fine della giornata corrente
      
      if (isNaN(eventDate.getTime())) {
        this.validationErrors.push({
          field: 'data_evento',
          message: 'Formato data non valido'
        });
      } else if (eventDate > today) {
        this.validationErrors.push({
          field: 'data_evento',
          message: 'La data dell\'infezione non può essere futura'
        });
      }
    }

    // Validazione agente patogeno
    if (!data.agente_patogeno || data.agente_patogeno.trim() === '') {
      this.validationErrors.push({
        field: 'agente_patogeno',
        message: 'L\'agente patogeno è obbligatorio'
      });
    } else if (data.agente_patogeno.trim().length < 2) {
      this.validationErrors.push({
        field: 'agente_patogeno',
        message: 'L\'agente patogeno deve contenere almeno 2 caratteri'
      });
    } else if (data.agente_patogeno.length > 100) {
      this.validationErrors.push({
        field: 'agente_patogeno',
        message: 'L\'agente patogeno non può superare i 100 caratteri'
      });
    }

    // Validazione descrizione (opzionale)
    if (data.descrizione && data.descrizione.length > 500) {
      this.validationErrors.push({
        field: 'descrizione',
        message: 'La descrizione non può superare i 500 caratteri'
      });
    }

    this.isValid = this.validationErrors.length === 0;
    return this.isValid;
  }

  /**
   * Restituisce gli errori di validazione
   * @returns {Array} Array di errori di validazione
   */
  getValidationErrors() {
    return [...this.validationErrors];
  }

  /**
   * Restituisce gli errori per un campo specifico
   * @param {string} fieldName - Nome del campo
   * @returns {Array} Array di errori per il campo specificato
   */
  getFieldErrors(fieldName) {
    return this.validationErrors.filter(error => error.field === fieldName);
  }

  /**
   * Verifica se un campo specifico ha errori
   * @param {string} fieldName - Nome del campo
   * @returns {boolean} True se il campo ha errori
   */
  hasFieldError(fieldName) {
    return this.validationErrors.some(error => error.field === fieldName);
  }

  /**
   * Restituisce un riepilogo dello stato corrente
   * @returns {Object} Stato corrente del manager
   */
  getStatus() {
    return {
      hasData: this.hasInfectionData(),
      isValid: this.isValid,
      errorCount: this.validationErrors.length,
      timestamp: this.infectionData?.timestamp || null
    };
  }

  /**
   * Cleanup automatico dei dati scaduti (più vecchi di 1 ora)
   * Utile per prevenire accumulo di dati temporanei
   */
  cleanupExpiredData() {
    if (this.infectionData && this.infectionData.timestamp) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (this.infectionData.timestamp < oneHourAgo) {
        this.clearInfectionData();
        return true;
      }
    }
    return false;
  }
}

// Istanza singleton per gestire lo stato globale
const infectionDataManager = new InfectionDataManager();

export default infectionDataManager;
export { InfectionDataManager };