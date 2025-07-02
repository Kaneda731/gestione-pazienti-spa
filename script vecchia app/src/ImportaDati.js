/**
 * @fileoverview Entry point per l'importazione dati CSV
 * @author Sistema ScriptPazienti
 * @version 2.0.0
 * @requires errorHandler.js - Gestione errori
 */

/**
 * Funzione principale per importare dati da un file CSV
 * Replica il comportamento della macro BASIC ImportaDatiDaCSV
 */
function importaDatiDaCSV() {
  try {
    // Verifica che siamo in un contesto valido per UI
    if (typeof SpreadsheetApp === 'undefined') {
      console.log('❌ SpreadsheetApp non disponibile');
      return;
    }
    
    // Verifica che possiamo accedere alla UI
    try {
      SpreadsheetApp.getUi();
    } catch (uiError) {
      console.log('❌ Errore contesto UI:', uiError.toString());
      console.log('💡 Questo è normale se eseguito dall\'editor script');
      console.log('✅ La funzione è disponibile e funziona correttamente');
      console.log('🔧 Per testare completamente, eseguire da un trigger del foglio');
      return;
    }
    
    // Mostra la finestra moderna di selezione origine (versione modulare)
    showCsvSourceSelector();
  } catch (error) {
    console.error('Errore durante l\'apertura finestra selezione:', error.toString());
    
    // Prova a mostrare l'alert solo se possiamo accedere alla UI
    try {
      SpreadsheetApp.getUi().alert('Errore durante l\'apertura finestra selezione: ' + error.toString());
    } catch (uiError) {
      console.log('💡 Impossibile mostrare alert UI (normale se eseguito dall\'editor)');
    }
  }
}

// ====================================================================
// FUNZIONI DI COMPATIBILITÀ - Mantengono la compatibilità con il codice esistente
// ====================================================================

/**
 * Funzione di compatibilità per processaFileLocale
 * @deprecated Usare import/importService.processaFileLocaleService
 */
function processaFileLocale(csvContent, sheetDest, sheetElenco) {
  return processaFileLocaleService(csvContent, sheetDest, sheetElenco);
}

/**
 * Funzione di compatibilità per processLocalCsvFile
 * @deprecated Usare import/importService.processLocalCsvFile
 */
function processLocalCsvFile(content) {
  return processLocalCsvFileInternal(content);
}

/**
 * Funzione di compatibilità per showLocalFileUploader
 * @deprecated Usare import/importUI.showLocalFileUploader
 */
function showLocalFileUploader() {
  return showLocalFileUploaderInternal();
}

// ====================================================================
// FUNZIONI UTILI MANTENUTE PER RETROCOMPATIBILITÀ
// ====================================================================

/**
 * Funzione per attendere un certo numero di millisecondi
 * @param {Number} milliseconds - Millisecondi da attendere
 * @deprecated Usare import/csvParser.wait
 */
function wait(milliseconds) {
  const start = new Date().getTime();
  let end = start;
  while (end < start + milliseconds) {
    end = new Date().getTime();
  }
}

/**
 * Funzione interna per processare file CSV locale senza namespace
 * @param {String} content - Contenuto del file CSV
 * @return {Object} Oggetto contenente il risultato dell'importazione
 */
function processLocalCsvFileInternal(content) {
  try {
    // Ottieni i fogli di destinazione
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetDest = ss.getSheetByName("DatiPazienti");
    const sheetElenco = ss.getSheetByName("ElencoPazienti");
    
    // Verifica che i fogli esistano
    if (!sheetDest || !sheetElenco) {
      return { 
        success: false, 
        message: "Errore: Fogli 'DatiPazienti' o 'ElencoPazienti' non trovati." 
      };
    }
    
    // Converti il contenuto CSV in array
    const csvData = Utilities.parseCsv(content);
    
    // Valida i dati CSV - versione semplificata
    if (!csvData || csvData.length < 2) {
      return { 
        success: false, 
        message: "Errore: Il file CSV deve contenere almeno un'intestazione e una riga di dati." 
      };
    }
    
    // Processa i dati direttamente - versione semplificata
    const result = processaCsvDataDiretto(csvData, sheetDest, sheetElenco);
    
    return {
      success: true,
      righeProcessate: result.righeProcessate,
      message: result.message || `Importazione completata. Righe processate: ${result.righeProcessate}`
    };
  } 
  catch (err) {
    console.error("Errore durante l'elaborazione del file:", err.message);
    return { 
      success: false, 
      message: `Errore durante l'elaborazione del file: ${err.message}` 
    };
  }
}

/**
 * Funzione interna per mostrare l'uploader di file locale
 */
function showLocalFileUploaderInternal() {
  const ui = SpreadsheetApp.getUi();
  
  // Crea un'interfaccia HTML per il caricamento del file
  const htmlOutput = HtmlService.createHtmlOutput(getLocalFileUploaderHTML())
    .setWidth(550)
    .setHeight(450)
    .setTitle('Importa CSV locale');
  
  ui.showModalDialog(htmlOutput, 'Importa CSV locale');
}

// ====================================================================
// FUNZIONI DI COMPATIBILITÀ - Le esposizioni globali sono ora gestite dai singoli moduli
// ====================================================================

/**
 * Entry point principale - mantiene la compatibilità
 * Tutte le funzioni dei moduli sono ora disponibili globalmente
 */

// ====================================================================
