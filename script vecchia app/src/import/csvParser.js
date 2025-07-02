/**
 * @fileoverview Modulo per il parsing e processamento di file CSV
 * @author Sistema ScriptPazienti
 * @version 1.0.0
 */

// ============================
// ESPONE FUNZIONI GLOBALMENTE
// ============================
this.import_csvParser = this.import_csvParser || {};

/**
 * Processa i dati CSV e li importa nei fogli di destinazione
 * @param {Array} csvData - Dati CSV come array bidimensionale
 * @param {Object} sheetDest - Foglio di destinazione DatiPazienti
 * @param {Object} sheetElenco - Foglio di destinazione ElencoPazienti
 * @throws {Error} Se si verificano errori durante l'importazione
 */
function processaCsvData(csvData, sheetDest, sheetElenco) {
  const ui = SpreadsheetApp.getUi();
  
  // Trova la prossima riga vuota in ElencoPazienti
  let nextRowElenco = utils.trovaPrimaRigaVuota(sheetElenco, 0, 1);
  let righeProcessate = 0;
  
  // Processa il file CSV riga per riga
  for (let i = 1; i < csvData.length; i++) { // Salta la prima riga (intestazioni)
    const riga = csvData[i];
    
    // Ignora righe vuote
    if (riga.join('').trim() === '') continue;
    
    // Verifica se ci sono abbastanza campi da processare
    if (riga.length < 2) continue;
    
    // Prepara un array di valori da impostare in un'unica operazione
    const valoriDaImpostare = new Array(21).fill("");
    
    // Popola l'array con i valori dalla riga CSV
    for (let j = 0; j < riga.length && j < 21; j++) {
      // Se è una data, convertirla correttamente (ultime due colonne)
      if (j >= riga.length - 2) {
        if (utils.isDataValida(riga[j].trim())) {
          valoriDaImpostare[j] = new Date(riga[j].trim());
        } else {
          valoriDaImpostare[j] = riga[j].trim();
        }
      } else {
        valoriDaImpostare[j] = riga[j].trim();
      }
    }
    
    // Pulisce e imposta i valori nella riga 2 in un'unica operazione
    sheetDest.getRange(2, 1, 1, 21).setValues([valoriDaImpostare]);
    
    // Imposta il formato data per le ultime due colonne se necessario
    if (riga.length >= 2) {
      if (utils.isDataValida(riga[riga.length-2].trim())) {
        sheetDest.getRange(2, riga.length-1).setNumberFormat("dd/mm/yyyy");
      }
      if (utils.isDataValida(riga[riga.length-1].trim())) {
        sheetDest.getRange(2, riga.length).setNumberFormat("dd/mm/yyyy");
      }
    }
    
    // Forza il ricalcolo del foglio solo una volta per riga
    SpreadsheetApp.flush();
    
    // Chiamata diretta alla funzione di copia senza attesa
    try {
      CopiaIncollaSenzaTendine();
    } catch (err) {
      throw new Error(`Errore durante la copia: ${err.message}`);
    }
    
    // Aggiorna la riga successiva per la prossima iterazione
    nextRowElenco = utils.trovaPrimaRigaVuota(sheetElenco, 0, 1);
    righeProcessate++;
  }
  
  // Forza un ricalcolo finale del foglio
  SpreadsheetApp.flush();
  
  // Applica i colori alternati all'area
  try {
    applicaColoriAlternati(sheetElenco);
    console.log("Dati importati correttamente! Righe processate:", righeProcessate);
  } catch (err) {
    console.log("Dati importati correttamente, ma errore durante applicazione colori alternati:", err.message);
  }
}

/**
 * Versione diretta della funzione processaCsvData che restituisce un risultato invece di mostrare alert
 * @param {Array} csvData - Dati CSV come array bidimensionale
 * @param {Object} sheetDest - Foglio di destinazione DatiPazienti
 * @param {Object} sheetElenco - Foglio di destinazione ElencoPazienti
 * @return {Object} Oggetto contenente il risultato dell'importazione
 */
function processaCsvDataDiretto(csvData, sheetDest, sheetElenco) {
  // Trova la prossima riga vuota in ElencoPazienti
  let nextRowElenco = utils.trovaPrimaRigaVuota(sheetElenco, 0, 1);
  let righeProcessate = 0;
  let messaggioErrore = "";
  
  // Processa il file CSV riga per riga
  for (let i = 1; i < csvData.length; i++) { // Salta la prima riga (intestazioni)
    const riga = csvData[i];
    
    // Ignora righe vuote
    if (riga.join('').trim() === '') continue;
    
    // Verifica se ci sono abbastanza campi da processare
    if (riga.length < 2) continue;
    
    // Prepara un array di valori da impostare in un'unica operazione
    const valoriDaImpostare = new Array(21).fill("");
    
    // Popola l'array con i valori dalla riga CSV
    for (let j = 0; j < riga.length && j < 21; j++) {
      // Se è una data, convertirla correttamente (ultime due colonne)
      if (j >= riga.length - 2) {
        if (utils.isDataValida(riga[j].trim())) {
          valoriDaImpostare[j] = new Date(riga[j].trim());
        } else {
          valoriDaImpostare[j] = riga[j].trim();
        }
      } else {
        valoriDaImpostare[j] = riga[j].trim();
      }
    }
    
    // Pulisce e imposta i valori nella riga 2 in un'unica operazione
    sheetDest.getRange(2, 1, 1, 21).setValues([valoriDaImpostare]);
    
    // Imposta il formato data per le ultime due colonne se necessario
    if (riga.length >= 2) {
      if (utils.isDataValida(riga[riga.length-2].trim())) {
        sheetDest.getRange(2, riga.length-1).setNumberFormat("dd/mm/yyyy");
      }
      if (utils.isDataValida(riga[riga.length-1].trim())) {
        sheetDest.getRange(2, riga.length).setNumberFormat("dd/mm/yyyy");
      }
    }
    
    // Forza il ricalcolo del foglio solo una volta per riga
    SpreadsheetApp.flush();
    
    // Chiamata diretta alla funzione di copia senza attesa
    try {
      CopiaIncollaSenzaTendine();
    } catch (err) {
      messaggioErrore = "Errore durante la copia: " + err.message;
      break;
    }
    
    // Aggiorna la riga successiva per la prossima iterazione
    nextRowElenco = utils.trovaPrimaRigaVuota(sheetElenco, 0, 1);
    righeProcessate++;
  }
  
  // Forza un ricalcolo finale del foglio
  SpreadsheetApp.flush();
  
  // Applica i colori alternati all'area
  try {
    applicaColoriAlternati(sheetElenco);
  } catch (err) {
    if (messaggioErrore === "") {
      messaggioErrore = "Errore durante l'applicazione dei colori alternati: " + err.message;
    }
  }
  
  return {
    righeProcessate: righeProcessate,
    message: messaggioErrore
  };
}

/**
 * Valida il contenuto CSV prima del processamento
 * @param {Array} csvData - Dati CSV come array bidimensionale
 * @return {Object} Risultato della validazione
 */
function validaCsvData(csvData) {
  if (!csvData || !Array.isArray(csvData)) {
    return { 
      isValid: false, 
      error: "Dati CSV non validi: non è un array" 
    };
  }
  
  if (csvData.length < 2) {
    return { 
      isValid: false, 
      error: "File CSV deve contenere almeno una riga di intestazioni e una riga di dati" 
    };
  }
  
  // Verifica la presenza di intestazioni
  const headers = csvData[0];
  if (!headers || headers.length < 2) {
    return { 
      isValid: false, 
      error: "Le intestazioni del CSV devono contenere almeno 2 colonne" 
    };
  }
  
  // Conta le righe valide (non vuote)
  let righeValide = 0;
  for (let i = 1; i < csvData.length; i++) {
    const riga = csvData[i];
    if (riga && riga.join('').trim() !== '' && riga.length >= 2) {
      righeValide++;
    }
  }
  
  if (righeValide === 0) {
    return { 
      isValid: false, 
      error: "Nessuna riga di dati valida trovata nel CSV" 
    };
  }
  
  return { 
    isValid: true, 
    righeValide: righeValide,
    totalRows: csvData.length - 1 // esclude header
  };
}

/**
 * Funzione per attendere un certo numero di millisecondi
 * @param {Number} milliseconds - Millisecondi da attendere
 */
function wait(milliseconds) {
  const start = new Date().getTime();
  let end = start;
  while (end < start + milliseconds) {
    end = new Date().getTime();
  }
}

// ============================
// ESPOSIZIONE GLOBALE MODULO
// ============================

// Espone le funzioni nel namespace globale
this.import_csvParser = {
  processaCsvData: processaCsvData,
  processaCsvDataDiretto: processaCsvDataDiretto,
  validaCsvData: validaCsvData,
  wait: wait
};

// Espone anche individualmente per retrocompatibilità
this.processaCsvData = processaCsvData;
this.processaCsvDataDiretto = processaCsvDataDiretto; 
this.validaCsvData = validaCsvData;
