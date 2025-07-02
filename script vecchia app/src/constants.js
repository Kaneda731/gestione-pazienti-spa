/**
 * Costanti globali per il progetto ScriptPazienti
 * Centralizza tutte le costanti per evitare duplicazioni
 */

// === CONFIGURAZIONE FOGLI ===
const SHEET_NAMES = {
  ELENCO_PAZIENTI: 'ElencoPazienti',
  DATI_PAZIENTI: 'DatiPazienti',
  REGISTRO_FILTRI: 'RegistroFiltri'
};

// === INDICI COLONNE (1-based per Google Sheets) ===
const COLUMNS = {
  NOME: 1,           // Colonna A
  COGNOME: 2,        // Colonna B
  DATA_INGRESSO: 6,  // Colonna F
  DATA_DIMISSIONE: 8 // Colonna H
};

// === CONFIGURAZIONE SISTEMA ===
const CONFIG = {
  MAX_RIGHE: 500,
  COLONNA_DA_NASCONDERE: 9, // Colonna I
  ALTEZZA_RIGA_PX: 20,
  
  // Colonne disponibili per analisi
  COLONNE_ANALISI: ['C', 'D', 'E', 'G'],
  
  // Timeout per operazioni asincrone
  TIMEOUT_MS: 30000
};

// === MESSAGGI DI ERRORE STANDARDIZZATI ===
const ERROR_MESSAGES = {
  FOGLIO_NON_TROVATO: (nome) => `Il foglio '${nome}' non esiste nel documento corrente.`,
  NESSUN_DATO: 'Nessun dato disponibile per l\'operazione richiesta.',
  FORMATO_DATA_INVALIDO: 'Formato data non valido. Usa GG/MM/AAAA.',
  PAZIENTE_NON_TROVATO: 'Paziente non trovato o già dimesso.',
  ERRORE_GENERICO: (dettagli) => `Si è verificato un errore: ${dettagli}`
};

// === CONFIGURAZIONE UI ===
const UI_CONFIG = {
  DIALOG_WIDTH: 580,
  DIALOG_HEIGHT: 450,
  DIALOG_WIDTH_LARGE: 700,
  DIALOG_HEIGHT_LARGE: 600,
  
  // Colori Material Design
  COLORS: {
    PRIMARY: '#1A73E8',
    SUCCESS: '#34A853',
    ERROR: '#EA4335',
    WARNING: '#FBBC04'
  }
};

// === REGEX PATTERNS ===
const PATTERNS = {
  DATA: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  NOME_COGNOME: /^[a-zA-ZÀ-ÿ\s'.-]+$/
};

// Export per uso in altri file (se supportato)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SHEET_NAMES,
    COLUMNS,
    CONFIG,
    ERROR_MESSAGES,
    UI_CONFIG,
    PATTERNS
  };
}
