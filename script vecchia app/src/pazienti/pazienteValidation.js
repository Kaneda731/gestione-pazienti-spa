/**
 * Modulo di validazione per i dati dei pazienti
 * Centralizza tutte le funzioni di validazione e parsing per mantenere consistenza
 * 
 * @requires constants.js: PATTERNS
 * @requires errorHandler.js: logAvanzato
 * 
 * @version 1.0.0
 * @since 2025-06-24
 */

/**
 * Servizio di validazione per i dati dei pazienti
 * Fornisce metodi per validare e normalizzare i dati inseriti
 */
const PazienteValidation = {

  /**
   * Valida e analizza una data in diversi formati
   * @param {string|Date} str - Stringa data o oggetto Date
   * @returns {Date|null} Oggetto Date valido o null se invalido
   */
  parseDate(str) {
    if (!str) return null;
    
    // Se è già un oggetto Date, ritornalo
    if (str instanceof Date) {
      return isNaN(str.getTime()) ? null : str;
    }
    
    // Converte in stringa se necessario
    str = String(str).trim();
    if (!str) return null;
    
    // Prova diversi formati di data
    const formati = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // GG/MM/AAAA
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // GG-MM-AAAA
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,  // AAAA/MM/GG
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/    // AAAA-MM-GG
    ];
    
    for (let i = 0; i < formati.length; i++) {
      const match = str.match(formati[i]);
      if (match) {
        let gg, mm, aa;
        if (i < 2) { // GG/MM/AAAA o GG-MM-AAAA
          gg = parseInt(match[1], 10);
          mm = parseInt(match[2], 10) - 1; // JavaScript usa 0-11 per i mesi
          aa = parseInt(match[3], 10);
        } else { // AAAA/MM/GG o AAAA-MM-GG
          aa = parseInt(match[1], 10);
          mm = parseInt(match[2], 10) - 1;
          gg = parseInt(match[3], 10);
        }
        
        // Controlli di validità base
        if (gg < 1 || gg > 31 || mm < 0 || mm > 11 || aa < 1900 || aa > 2100) {
          continue; // Prova il formato successivo
        }
        
        const d = new Date(aa, mm, gg);
        // Verifica che la data sia effettivamente valida (es. 31/02 non esiste)
        if (!isNaN(d.getTime()) && 
            d.getFullYear() === aa && 
            d.getMonth() === mm && 
            d.getDate() === gg) {
          return d;
        }
      }
    }
    
    // Prova il parsing standard come fallback
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  },

  /**
   * Normalizza una data per evitare problemi di timezone
   * Imposta l'ora a mezzogiorno per evitare problemi con DST
   * @param {Date} date - Data da normalizzare
   * @returns {Date|null} Data normalizzata o null se invalida
   */
  normalizzaData(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    
    // Crea una nuova data con ore, minuti, secondi e millisecondi azzerati
    // Usa le 12:00 per evitare problemi con il cambio dell'ora
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  },

  /**
   * Capitalizza correttamente nomi e cognomi
   * @param {string} str - Stringa da capitalizzare
   * @returns {string} Stringa capitalizzata
   */
  capitalizeWords(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  },

  /**
   * Valida nome e cognome con controlli estesi
   * @param {string} nome - Nome del paziente
   * @param {string} cognome - Cognome del paziente
   * @returns {Object} Oggetto con validazione e dati normalizzati
   */
  validaNomeCognome(nome, cognome) {
    // Pattern per validazione nome/cognome (lettere, spazi, apostrofi, trattini)
    const NOME_COGNOME_PATTERN = /^[a-zA-ZÀ-ÿĀ-žА-я\s'\-]+$/;
    
    // Trim e controllo vuoti
    const nomeClean = (nome || '').trim();
    const cognomeClean = (cognome || '').trim();
    
    if (!nomeClean || !cognomeClean) {
      return {
        valido: false,
        messaggio: 'Nome e cognome sono obbligatori.',
        nome: nomeClean,
        cognome: cognomeClean
      };
    }
    
    // Controllo lunghezza minima
    if (nomeClean.length < 2 || cognomeClean.length < 2) {
      return {
        valido: false,
        messaggio: 'Nome e cognome devono avere almeno 2 caratteri.',
        nome: nomeClean,
        cognome: cognomeClean
      };
    }
    
    // Controllo caratteri validi
    if (!NOME_COGNOME_PATTERN.test(nomeClean) || !NOME_COGNOME_PATTERN.test(cognomeClean)) {
      return {
        valido: false,
        messaggio: 'Nome e cognome possono contenere solo lettere, spazi, apostrofi e trattini.',
        nome: nomeClean,
        cognome: cognomeClean
      };
    }
    
    // Capitalizza correttamente
    const nomeCapitalized = this.capitalizeWords(nomeClean);
    const cognomeCapitalized = this.capitalizeWords(cognomeClean);
    
    return {
      valido: true,
      messaggio: 'Validazione completata con successo.',
      nome: nomeCapitalized,
      cognome: cognomeCapitalized
    };
  },

  /**
   * Valida una data di dimissione
   * @param {string} dataStr - Stringa della data da validare
   * @returns {Object} Risultato della validazione
   */
  validaDataDimissione(dataStr) {
    if (!dataStr || typeof dataStr !== 'string') {
      return {
        valido: false,
        messaggio: 'Data di dimissione richiesta.',
        data: null
      };
    }

    const dataObj = this.parseDate(dataStr.trim());
    
    if (!dataObj) {
      return {
        valido: false,
        messaggio: 'Formato data non valido. Usa GG/MM/AAAA.',
        data: null
      };
    }

    // Verifica che la data non sia futura
    const oggi = new Date();
    if (dataObj > oggi) {
      return {
        valido: false,
        messaggio: 'La data di dimissione non può essere futura.',
        data: null
      };
    }

    // Verifica che la data non sia troppo vecchia (es. oltre 10 anni fa)
    const dateLimite = new Date(oggi.getFullYear() - 10, oggi.getMonth(), oggi.getDate());
    if (dataObj < dateLimite) {
      return {
        valido: false,
        messaggio: 'La data di dimissione sembra troppo vecchia. Verificare.',
        data: null
      };
    }

    const dataNormalizzata = this.normalizzaData(dataObj);
    
    return {
      valido: true,
      messaggio: 'Data valida.',
      data: dataNormalizzata
    };
  },

  /**
   * Verifica disponibilità del servizio
   * @returns {boolean} True se il servizio è disponibile
   */
  isAvailable() {
    return true;
  }
};

// Log del caricamento del modulo
if (typeof logAvanzato === 'function') {
  logAvanzato('PazienteValidation caricato correttamente', 'INFO');
} else {
  console.log('✓ PazienteValidation caricato');
}
