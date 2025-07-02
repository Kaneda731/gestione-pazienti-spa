/**
 * Utilità comuni per il progetto ScriptPazienti
 * Funzioni di uso generale per evitare duplicazioni
 * 
 * === DIPENDENZE ===
 * @requires constants.js - PATTERNS, ERROR_MESSAGES
 * @requires validation/validationSystem.js - ValidationSystem (NEW)
 * @requires Google Apps Script - SpreadsheetApp, Logger, Utilities
 * 
 * === EXPORTS ===
 * Validazione: validaNomeCognome, parseDate, isDataValida, normalizzaData (LEGACY - usa ValidationSystem)
 * Formatting: formattaData, capitalizeWords, escapeHtml, htmlEscape  
 * Sheets: getFoglioSicuro, trovaPrimaRigaVuota
 * Utilities: logAvanzato, debounce, convertiNumeroInLettera
 */

/**
 * Valida nome e cognome
 * @deprecated Usa ValidationSystem.validateName()
 * @param {string} nome - Nome del paziente
 * @param {string} cognome - Cognome del paziente
 * @returns {Object} Oggetto con validazione e dati normalizzati
 */
function validaNomeCognome(nome, cognome) {
  // Prova prima il nuovo sistema
  if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady()) {
    const result = ValidationSystem.validateName(nome, cognome);
    return { 
      valido: result.isValid, 
      messaggio: result.message,
      nome: result.normalizedValue ? result.normalizedValue.nome : nome,
      cognome: result.normalizedValue ? result.normalizedValue.cognome : cognome
    };
  }
  
  // Fallback legacy
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
  
  // Controllo caratteri validi (solo lettere, spazi, apostrofi, trattini)
  if (!PATTERNS.NOME_COGNOME.test(nomeClean) || !PATTERNS.NOME_COGNOME.test(cognomeClean)) {
    return {
      valido: false,
      messaggio: 'Nome e cognome possono contenere solo lettere, spazi, apostrofi e trattini.',
      nome: nomeClean,
      cognome: cognomeClean
    };
  }
  
  // Capitalizza correttamente
  const nomeCapitalized = capitalizeWords(nomeClean);
  const cognomeCapitalized = capitalizeWords(cognomeClean);
  
  return {
    valido: true,
    messaggio: 'Validazione completata con successo.',
    nome: nomeCapitalized,
    cognome: cognomeCapitalized
  };
}

/**
 * Capitalizza le parole (prima lettera maiuscola, resto minuscolo)
 * @param {string} str - Stringa da capitalizzare
 * @returns {string} Stringa capitalizzata
 */
function capitalizeWords(str) {
  return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Valida e analizza una data  
 * @param {string} dateStr - Stringa data in formato GG/MM/AAAA
 * @returns {Date|null} Oggetto Date valido o null se invalido
 * @deprecated Usare parseDate() per consistenza naming
 */
function parseData(dateStr) {
  // Wrapper per compatibilità - rimandare a parseDate
  return parseDate(dateStr);
}

/**
 * Normalizza una data per evitare problemi di timezone
 * @deprecated Usa ValidationSystem.validateDate() che normalizza automaticamente
 * @param {Date} date - Data da normalizzare
 * @returns {Date} Data normalizzata
 */
function normalizzaData(date) {
  // Prova prima il nuovo sistema per date string
  if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady() && typeof date === 'string') {
    const result = ValidationSystem.validateDate(date, 'generic');
    return result.isValid ? result.normalizedValue : null;
  }
  
  // Fallback legacy per oggetti Date
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  
  // Crea una nuova data con ore, minuti, secondi e millisecondi azzerati
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

/**
 * Formatta una data per la visualizzazione
 * @param {Date} date - Data da formattare
 * @param {string} formato - Formato desiderato ('dd/mm/yyyy', 'yyyy-mm-dd', etc.)
 * @returns {string} Data formattata
 */
function formattaData(date, formato = 'dd/mm/yyyy') {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Data non valida';
  }
  
  try {
    switch (formato) {
      case 'dd/mm/yyyy':
        return Utilities.formatDate(date, 'Europe/Rome', 'dd/MM/yyyy');
      case 'yyyy-mm-dd':
        return Utilities.formatDate(date, 'Europe/Rome', 'yyyy-MM-dd');
      case 'dd/mm/yyyy hh:mm':
        return Utilities.formatDate(date, 'Europe/Rome', 'dd/MM/yyyy HH:mm');
      default:
        return Utilities.formatDate(date, 'Europe/Rome', formato);
    }
  } catch (error) {
    Logger.log('Errore nella formattazione data: ' + error.message);
    return 'Errore formattazione';
  }
}

/**
 * Ottiene un foglio per nome con gestione errori
 * @param {string} nomeFoglio - Nome del foglio da ottenere
 * @returns {Object} Oggetto con successo e foglio o errore
 */
function getFoglioSicuro(nomeFoglio) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const foglio = ss.getSheetByName(nomeFoglio);
    
    if (!foglio) {
      return {
        successo: false,
        errore: ERROR_MESSAGES.FOGLIO_NON_TROVATO(nomeFoglio),
        foglio: null
      };
    }
    
    return {
      successo: true,
      errore: null,
      foglio: foglio
    };
  } catch (error) {
    return {
      successo: false,
      errore: ERROR_MESSAGES.ERRORE_GENERICO(error.message),
      foglio: null
    };
  }
}

/**
 * Trova la prima riga vuota in una colonna specifica
 * @param {Sheet} sheet - Foglio di calcolo
 * @param {number} colIndex - Indice della colonna (0-based)
 * @param {number} startRow - Riga di partenza (0-based)
 * @returns {number} Indice della prima riga vuota
 */
function trovaPrimaRigaVuota(sheet, colIndex = 0, startRow = 1) {
  try {
    const lastRow = sheet.getLastRow();
    const values = sheet.getRange(startRow + 1, colIndex + 1, Math.max(1, lastRow - startRow), 1).getValues();
    
    for (let i = 0; i < values.length; i++) {
      if (!values[i][0] || values[i][0].toString().trim() === '') {
        return startRow + i;
      }
    }
    
    // Se non trova righe vuote, restituisce la prossima riga dopo l'ultima con dati
    return lastRow;
  } catch (error) {
    Logger.log('Errore in trovaPrimaRigaVuota: ' + error.message);
    return startRow;
  }
}

/**
 * Verifica se una stringa rappresenta una data valida
 * @deprecated Usa ValidationSystem.validateDate()
 * @param {string} dateStr - Stringa da verificare
 * @returns {boolean} True se è una data valida
 */
function isDataValida(dateStr) {
  // Prova prima il nuovo sistema
  if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady()) {
    const result = ValidationSystem.validateDate(dateStr, 'generic');
    return result.isValid;
  }
  
  // Fallback legacy
  return parseDate(dateStr) !== null;
}

/**
 * Log avanzato con timestamp e livello
 * @param {string} messaggio - Messaggio da loggare
 * @param {string} livello - Livello del log ('INFO', 'WARN', 'ERROR')
 * @param {Object} datiAggiuntivi - Dati aggiuntivi da loggare
 */
function logAvanzato(messaggio, livello = 'INFO', datiAggiuntivi = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${livello}] ${messaggio}`;
  
  Logger.log(logMessage);
  
  if (datiAggiuntivi) {
    Logger.log('Dati aggiuntivi: ' + JSON.stringify(datiAggiuntivi, null, 2));
  }
}

/**
 * Escape HTML per prevenire XSS
 * @param {string} str - Stringa da escapare
 * @returns {string} Stringa escapata
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Debounce per limitare la frequenza di chiamate di funzione
 * @param {Function} func - Funzione da debounceare
 * @param {number} wait - Millisecondi di attesa
 * @returns {Function} Funzione debouncata
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Escape HTML special characters in a string (Alias per compatibilità)
 * @param {String} str - The string to escape
 * @return {String} The escaped string
 */
function htmlEscape(str) {
  // Usa escapeHtml come implementazione principale
  return escapeHtml(str);
}

/**
 * Converte una stringa in un oggetto Date (implementazione unificata)
 * @deprecated Usa ValidationSystem.validateDate()
 * @param {String|Date} str - La stringa o data da convertire
 * @return {Date|null} La data convertita o null se non valida
 */
function parseDate(str) {
  // Prova prima il nuovo sistema
  if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady()) {
    const result = ValidationSystem.validateDate(str, 'generic');
    return result.isValid ? result.normalizedValue : null;
  }
  
  // Fallback legacy
  if (!str) return null;
  
  // Se è già un oggetto Date, ritornalo
  if (str instanceof Date) {
    return str;
  }
  
  // Converte in stringa se necessario
  str = String(str).trim();
  if (!str) return null;
  
  // Controllo con pattern specifico se PATTERNS è disponibile
  if (typeof PATTERNS !== 'undefined' && PATTERNS.DATA && !PATTERNS.DATA.test(str)) {
    // Fallback ai pattern generali se il pattern specifico fallisce
  }
  
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
        mm = parseInt(match[2], 10) - 1;
        aa = parseInt(match[3], 10);
      } else { // AAAA/MM/GG o AAAA-MM-GG
        aa = parseInt(match[1], 10);
        mm = parseInt(match[2], 10) - 1;
        gg = parseInt(match[3], 10);
      }
      
      // Controlli di validità estesi
      if (gg < 1 || gg > 31 || mm < 0 || mm > 11 || aa < 1900 || aa > 2100) {
        continue; // Prova il formato successivo
      }
      
      const d = new Date(aa, mm, gg);
      // Verifica che la data sia effettivamente valida
      if (!isNaN(d.getTime()) && d.getFullYear() === aa && d.getMonth() === mm && d.getDate() === gg) {
        return d;
      }
    }
  }
  
  // Prova il parsing standard come fallback
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Converte un numero di colonna in lettera (1=A, 2=B, ecc.)
 * @param {Number} numero - Il numero della colonna
 * @return {String} La lettera corrispondente
 */
function convertiNumeroInLettera(numero) {
  let lettera = '';
  while (numero > 0) {
    const modulo = (numero - 1) % 26;
    lettera = String.fromCharCode(65 + modulo) + lettera;
    numero = Math.floor((numero - modulo) / 26);
  }
  return lettera;
}

/**
 * Oggetto Utils per compatibilità con i test
 * Espone tutte le funzioni di utilità
 */
const Utils = {
  // Validazione
  validaNomeCognome,
  parseDate,
  isDataValida,
  normalizzaData,
  
  // Formatting
  formattaData,
  capitalizeWords,
  escapeHtml,
  htmlEscape,
  
  // Sheets
  getFoglioSicuro,
  trovaPrimaRigaVuota,
  
  // Utilities
  logAvanzato,
  debounce,
  convertiNumeroInLettera,
  
  // Verifica disponibilità
  isAvailable: () => true
};

/**
 * Oggetto utils globale per Google Apps Script
 * Espone le funzioni più utilizzate per i moduli
 */
const utils = {
  // Funzioni più utilizzate dai moduli
  trovaPrimaRigaVuota,
  isDataValida,
  parseDate,
  htmlEscape,
  escapeHtml,
  formattaData,
  logAvanzato,
  getFoglioSicuro,
  validaNomeCognome,
  normalizzaData,
  capitalizeWords,
  debounce,
  convertiNumeroInLettera,
  
  // Verifica disponibilità
  isAvailable: () => true
};

