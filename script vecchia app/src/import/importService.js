/**
 * @fileoverview Modulo per la logica di business dell'importazione CSV
 * @author Sistema ScriptPazienti
 * @version 1.0.0
 * @requires import/csvParser.js - Funzioni di parsing CSV (LEGACY)
 * @requires validation/validationSystem.js - ValidationSystem
 */

// ============================
// ESPONE FUNZIONI GLOBALMENTE
// ============================
this.import_importService = this.import_importService || {};

/**
 * Funzione per processare un file CSV locale
 * @param {String} csvContent - Contenuto del file CSV
 * @param {Object} sheetDest - Foglio di destinazione DatiPazienti
 * @param {Object} sheetElenco - Foglio di destinazione ElencoPazienti
 * @throws {Error} Se si verificano errori durante l'elaborazione
 */
function processaFileLocaleService(csvContent, sheetDest, sheetElenco) {
  try {
    // Converti il contenuto CSV in array
    const csvData = Utilities.parseCsv(csvContent);
    
    // Valida i dati CSV usando nuovo sistema con fallback
    let validazione;
    if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady()) {
      validazione = ValidationSystem.validateCsv(csvData);
    } else if (typeof validaCsvData === 'function') {
      // Fallback al sistema legacy
      validazione = validaCsvData(csvData);
    } else {
      throw new Error('Nessun sistema di validazione CSV disponibile');
    }
    
    if (!validazione.isValid) {
      throw new Error(validazione.message || validazione.error);
    }
    
    // Processa i dati usando funzione globale
    processaCsvData(csvData, sheetDest, sheetElenco);
    
    // Pulisci la proprietà dopo l'uso per liberare spazio
    PropertiesService.getScriptProperties().deleteProperty('localCsvContent');
  } 
  catch (err) {
    console.error("Errore durante l'elaborazione del file locale:", err.message);
    
    // Pulisci la proprietà in caso di errore
    PropertiesService.getScriptProperties().deleteProperty('localCsvContent');
    
    throw err;
  }
}

/**
 * Funzione per elaborare il contenuto di un file CSV locale
 * @param {String} content - Contenuto del file CSV
 * @return {Object} Oggetto contenente il risultato dell'importazione
 */
function processLocalCsvFile(content) {
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
    
    // Valida i dati CSV usando nuovo sistema con fallback
    let validazione;
    if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady()) {
      validazione = ValidationSystem.validateCsv(csvData);
    } else if (typeof validaCsvData === 'function') {
      // Fallback al sistema legacy
      validazione = validaCsvData(csvData);
    } else {
      return { 
        success: false, 
        message: "Errore: Nessun sistema di validazione CSV disponibile" 
      };
    }
    
    if (!validazione.isValid) {
      return { 
        success: false, 
        message: validazione.message || validazione.error 
      };
    }
    
    // Processa i dati direttamente usando funzione globale
    const result = processaCsvDataDiretto(csvData, sheetDest, sheetElenco);
    
    return {
      success: true,
      righeProcessate: result.righeProcessate,
      message: result.message || `Importazione completata. Righe processate: ${result.righeProcessate}`
    };
  } 
  catch (err) {
    return { 
      success: false, 
      message: `Errore durante l'elaborazione del file: ${err.message}` 
    };
  }
}

/**
 * Funzione per selezionare un file CSV da Google Drive
 * @return {Object} Oggetto contenente il tipo di origine e l'ID del file, o null se annullato
 */
function getFileFromDrive() {
  const ui = SpreadsheetApp.getUi();
  
  // Utilizziamo un approccio alternativo con un prompt
  const result = ui.prompt(
    'Seleziona file CSV da Drive',
    'Inserisci l\'ID del file CSV da Drive o lascia vuoto per cercare automaticamente:',
    ui.ButtonSet.OK_CANCEL
  );
  
  // Controlla se l'utente ha premuto "Annulla"
  if (result.getSelectedButton() == ui.Button.CANCEL) {
    return null;
  }
  
  const fileId = result.getResponseText().trim();
  
  // Se l'utente ha fornito un ID, verifica che sia valido
  if (fileId !== '') {
    try {
      const file = DriveApp.getFileById(fileId);
      if (file.getMimeType() !== MimeType.CSV) {
        console.log('Il file selezionato non è un CSV. Operazione annullata.');
        return null;
      }
      return { source: 'drive', fileId: fileId };
    } catch (e) {
      console.log('ID file non valido. Cercando automaticamente un file CSV.');
    }
  }
  
  // Cerca automaticamente file CSV in Drive
  const files = DriveApp.getFilesByType(MimeType.CSV);
  if (!files.hasNext()) {
    console.log('Nessun file CSV trovato in Drive.');
    return null;
  }
  
  // Se ci sono più file CSV, raccoglie le informazioni
  const fileOptions = [];
  const fileIds = [];
  
  while (files.hasNext()) {
    const file = files.next();
    fileOptions.push(file.getName());
    fileIds.push(file.getId());
  }
  
  if (fileIds.length === 1) {
    // Se c'è solo un file CSV, usalo direttamente
    return { source: 'drive', fileId: fileIds[0] };
  }
  
  // Verifica che fileOptions sia definito e sia un array
  if (!fileOptions || !Array.isArray(fileOptions) || fileOptions.length === 0) {
    console.log('Nessun file CSV valido trovato in Drive.');
    return null;
  }
  
  // Per semplicità, prendiamo il primo file
  // TODO: Implementare selezione tramite UI in importUI.js
  return { source: 'drive', fileId: fileIds[0] };
}

/**
 * Importa dati da Google Drive
 * @param {Object} sheetDest - Foglio di destinazione DatiPazienti
 * @param {Object} sheetElenco - Foglio di destinazione ElencoPazienti
 * @return {boolean} True se l'importazione è riuscita
 */
function importaDaGoogleDrive(sheetDest, sheetElenco) {
  const fileInfo = getFileFromDrive();
  if (!fileInfo) {
    console.log("Nessun file selezionato. Operazione annullata.");
    return false;
  }
  
  try {
    // Ottieni il contenuto del file CSV da Drive
    const csvFile = DriveApp.getFileById(fileInfo.fileId);
    const csvData = Utilities.parseCsv(csvFile.getBlob().getDataAsString());
    
    // Valida i dati CSV usando nuovo sistema con fallback
    let validazione;
    if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady()) {
      validazione = ValidationSystem.validateCsv(csvData);
    } else if (typeof import_csvParser !== 'undefined' && typeof import_csvParser.validaCsvData === 'function') {
      // Fallback al sistema legacy
      validazione = import_csvParser.validaCsvData(csvData);
    } else {
      throw new Error('Nessun sistema di validazione CSV disponibile');
    }
    
    if (!validazione.isValid) {
      throw new Error(validazione.message || validazione.error);
    }
    
    // Processa i dati
    import_csvParser.processaCsvData(csvData, sheetDest, sheetElenco);
    return true;
  } catch (err) {
    console.error("Errore durante l'importazione da Google Drive:", err.message);
    throw err;
  }
}

/**
 * Importa dati da Google Drive usando un fileId specifico (per il file picker)
 * @param {string} fileId - ID del file CSV da Google Drive
 * @return {Object} Oggetto contenente il risultato dell'importazione
 */
function importaDaGoogleDriveById(fileId) {
  console.log('🚀 Inizio importazione da Google Drive con fileId:', fileId);
  
  try {
    // Ottieni il foglio di lavoro attivo
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const fogli = validaFogliDestinazione(ss);
    
    if (!fogli) {
      throw new Error("Fogli di destinazione non trovati. Assicurati che esistano 'DatiPazienti' e 'ElencoPazienti'.");
    }
    
    // Ottieni il file da Google Drive
    const csvFile = DriveApp.getFileById(fileId);
    console.log('📄 File trovato:', csvFile.getName());
    
    // Leggi e processa il contenuto CSV
    const csvContent = csvFile.getBlob().getDataAsString();
    const csvData = Utilities.parseCsv(csvContent);
    
    console.log('📊 Righe CSV caricate:', csvData.length);
    
    // Valida i dati CSV usando nuovo sistema con fallback
    let validazione;
    if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady()) {
      validazione = ValidationSystem.validateCsv(csvData);
    } else if (typeof import_csvParser !== 'undefined' && typeof import_csvParser.validaCsvData === 'function') {
      // Fallback al sistema legacy
      validazione = import_csvParser.validaCsvData(csvData);
    } else {
      console.error('❌ Nessun sistema di validazione CSV disponibile');
      return {
        success: false,
        message: 'Errore: Nessun sistema di validazione CSV disponibile'
      };
    }
    
    if (!validazione.isValid) {
      console.error('❌ Validazione fallita:', validazione.message || validazione.error);
      return {
        success: false,
        message: 'Errore di validazione: ' + (validazione.message || validazione.error)
      };
    }
    
    // Processa i dati
    const risultato = import_csvParser.processaCsvData(csvData, fogli.sheetDest, fogli.sheetElenco);
    
    console.log('✅ Importazione completata con successo');
    return {
      success: true,
      righeProcessate: csvData.length - 1, // -1 per escludere l'header
      message: 'Importazione completata con successo'
    };
    
  } catch (err) {
    console.error('❌ Errore durante l\'importazione da Google Drive:', err);
    return {
      success: false,
      message: err.message || 'Errore sconosciuto durante l\'importazione'
    };
  }
}

/**
 * Valida i fogli di destinazione
 * @param {Object} ss - Spreadsheet attivo
 * @return {Object} Oggetto contenente i fogli validati o null se non validi
 */
function validaFogliDestinazione(ss) {
  const sheetDest = ss.getSheetByName("DatiPazienti");
  const sheetElenco = ss.getSheetByName("ElencoPazienti");
  
  if (!sheetDest || !sheetElenco) {
    console.error("Errore: Fogli 'DatiPazienti' o 'ElencoPazienti' non trovati.");
    return null;
  }
  
  return {
    sheetDest: sheetDest,
    sheetElenco: sheetElenco
  };
}

// ============================
// NAVIGAZIONE GOOGLE DRIVE
// ============================

/**
 * Ottiene il contenuto di una cartella Google Drive
 * @param {string|null} folderId - ID della cartella (null per root)
 * @return {Object} Oggetto con cartelle e file
 */
function getDriveFolderContents(folderId = null) {
  try {
    const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    
    // Ottieni sottocartelle
    const subFolders = [];
    const folderIterator = folder.getFolders();
    while (folderIterator.hasNext()) {
      const subFolder = folderIterator.next();
      subFolders.push({
        id: subFolder.getId(),
        name: subFolder.getName(),
        type: 'folder',
        modifiedDate: subFolder.getLastUpdated().toISOString(),
        size: null
      });
    }
    
    // Ottieni file CSV
    const csvFiles = [];
    const fileIterator = folder.getFiles();
    while (fileIterator.hasNext()) {
      const file = fileIterator.next();
      const fileName = file.getName();
      const mimeType = file.getMimeType();
      
      // Filtra solo file CSV
      if (fileName.toLowerCase().endsWith('.csv') || mimeType === 'text/csv') {
        csvFiles.push({
          id: file.getId(),
          name: fileName,
          type: 'file',
          modifiedDate: file.getLastUpdated().toISOString(),
          size: file.getSize(),
          mimeType: mimeType
        });
      }
    }
    
    // Ottieni informazioni cartella padre
    let parentFolder = null;
    if (folderId) {
      try {
        const currentFolder = DriveApp.getFolderById(folderId);
        const parentIterator = currentFolder.getParents();
        if (parentIterator.hasNext()) {
          const parent = parentIterator.next();
          parentFolder = {
            id: parent.getId(),
            name: parent.getName()
          };
        }
      } catch (e) {
        console.log('Impossibile ottenere cartella padre:', e.message);
      }
    }
    
    return {
      success: true,
      currentFolder: {
        id: folderId,
        name: folderId ? folder.getName() : 'Il mio Drive'
      },
      parentFolder: parentFolder,
      folders: subFolders.sort((a, b) => a.name.localeCompare(b.name)),
      files: csvFiles.sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate))
    };
    
  } catch (error) {
    console.error('Errore durante la lettura della cartella:', error);
    return {
      success: false,
      error: 'Errore durante la lettura della cartella: ' + error.message,
      folders: [],
      files: []
    };
  }
}

/**
 * Ottiene il percorso breadcrumb per una cartella
 * @param {string|null} folderId - ID della cartella
 * @return {Array} Array di oggetti breadcrumb
 */
function getDriveBreadcrumb(folderId = null) {
  const breadcrumb = [];
  
  try {
    if (!folderId) {
      return [{ id: null, name: 'Il mio Drive' }];
    }
    
    let currentFolder = DriveApp.getFolderById(folderId);
    const path = [];
    
    // Costruisci il percorso dal basso verso l'alto
    while (currentFolder) {
      path.unshift({
        id: currentFolder.getId(),
        name: currentFolder.getName()
      });
      
      const parentIterator = currentFolder.getParents();
      if (parentIterator.hasNext()) {
        currentFolder = parentIterator.next();
      } else {
        break;
      }
    }
    
    // Aggiungi root all'inizio
    breadcrumb.push({ id: null, name: 'Il mio Drive' });
    breadcrumb.push(...path);
    
    return breadcrumb;
    
  } catch (error) {
    console.error('Errore durante la creazione del breadcrumb:', error);
    return [{ id: null, name: 'Il mio Drive' }];
  }
}

/**
 * Verifica se un file è accessibile e ottiene le sue informazioni
 * @param {string} fileId - ID del file
 * @return {Object} Informazioni del file o errore
 */
function getDriveFileInfo(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    
    return {
      success: true,
      file: {
        id: file.getId(),
        name: file.getName(),
        size: file.getSize(),
        mimeType: file.getMimeType(),
        modifiedDate: file.getLastUpdated().toISOString(),
        owner: file.getOwner().getEmail()
      }
    };
    
  } catch (error) {
    console.error('Errore durante l\'accesso al file:', error);
    return {
      success: false,
      error: 'File non accessibile: ' + error.message
    };
  }
}

// ============================
// ESPOSIZIONE GLOBALE MODULO
// ============================

// Espone le funzioni nel namespace globale
this.import_importService = {
  processaFileLocaleService: processaFileLocaleService,
  processLocalCsvFile: processLocalCsvFile,
  getFileFromDrive: getFileFromDrive,
  importaDaGoogleDrive: importaDaGoogleDrive,
  importaDaGoogleDriveById: importaDaGoogleDriveById,
  validaFogliDestinazione: validaFogliDestinazione,
  getDriveFolderContents: getDriveFolderContents,
  getDriveBreadcrumb: getDriveBreadcrumb,
  getDriveFileInfo: getDriveFileInfo
};

// Espone anche individualmente per retrocompatibilità
this.processaFileLocaleService = processaFileLocaleService;
this.processLocalCsvFile = processLocalCsvFile;
this.getFileFromDrive = getFileFromDrive;
this.importaDaGoogleDrive = importaDaGoogleDrive;
this.importaDaGoogleDriveById = importaDaGoogleDriveById;
this.validaFogliDestinazione = validaFogliDestinazione;
this.getDriveFolderContents = getDriveFolderContents;
this.getDriveBreadcrumb = getDriveBreadcrumb;
this.getDriveFileInfo = getDriveFileInfo;
