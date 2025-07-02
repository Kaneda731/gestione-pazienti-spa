/**
 * Gestione filtri pazienti con registrazione criteri e aggiornamento automatico.
 * Questa versione utilizza i moduli centralizzati per mantenere codice pulito e modulare.
 * 
 * === FUNZIONI ENTRY POINT ===
 * - avviaFiltroInterattivo() - Menu principale
 * - aggiornaFoglioFiltroSuAttivazione() - Aggiornamento automatico
 * 
 * === DIPENDENZE ===
 * @requires filtriCore.js - Logica business
 * @requires filtriUI.js - Interfaccia utente
 * @requires designSystem.js - CSS unificato
 * @requires errorHandler.js - Gestione errori
 */

// === LEGACY COMPATIBILITY ===
// Mantenute per retrocompatibilità con script esistenti

/** @deprecated Usa FiltriService.getFoglioRegistro() */
function getFoglioRegistro() {
  return FiltriService.getFoglioRegistro();
}

/** @deprecated Usa FiltriService.registraCriteriFiltro() */
function registraCriteriFiltro(nomeFoglio, colIndex, valoreFiltro) {
  return FiltriService.registraCriteriFiltro(nomeFoglio, colIndex, valoreFiltro);
}

/** @deprecated Usa FiltriService.getCriteriFiltro() */
function getCriteriFiltro(nomeFoglio) {
  return FiltriService.getCriteriFiltro(nomeFoglio);
}

/** @deprecated Usa FiltriService.preparaFoglioDestinazione() */
function preparaFoglioDestinazione(nomeFoglio) {
  return FiltriService.preparaFoglioDestinazione(nomeFoglio);
}

/** @deprecated Usa FiltriService.applicaFormattazioneStandard() */
function applicaFormattazioneStandard(sheet) {
  return FiltriService.applicaFormattazioneStandard(sheet);
}

/** @deprecated Usa FiltriService.eseguiFiltro() */
function eseguiFiltro(colIndex, valoreFiltro, foglioDest) {
  const risultato = FiltriService.eseguiFiltro(colIndex, valoreFiltro, foglioDest);
  return risultato.righeFiltrate || 0; // Compatibilità con vecchia interfaccia
}

/** @deprecated Usa FiltriUI.getCSSTemplate() */
function getCSSTemplate() {
  return FiltriUI.getCSSTemplate();
}

/** @deprecated Usa FiltriUI.creaDialogoBase() */
function creaDialogoBase(titolo, contenutoHTML, larghezza = 580, altezza = 450, responsive = false) {
  return FiltriUI.creaDialogoBase(titolo, contenutoHTML, larghezza, altezza, responsive);
}

/** @deprecated Usa FiltriUI.mostraDialogoSelezioneColonna() */
function mostraDialogoSelezioneColonna() {
  return FiltriUI.mostraDialogoSelezioneColonna();
}

/** @deprecated Usa FiltriUI.mostraDialogoSelezioneValore() */
function mostraDialogoSelezioneValore(valori, colIndex) {
  return FiltriUI.mostraDialogoSelezioneValore(valori, colIndex);
}

/** @deprecated Usa errorHandler.js direttamente */
function mostraDialogoSuccesso(messaggio, dettagli = '') {
  return mostraSuccesso(messaggio, dettagli);
}

/** @deprecated Usa errorHandler.js direttamente */
function mostraDialogoErrore(messaggio, dettagli = '') {
  return mostraErrore(messaggio, dettagli);
}

// === CORE BUSINESS LOGIC ===

/**
 * Gestisce la selezione della colonna per il filtro pazienti
 * @param {number} colIndex - Indice della colonna selezionata
 */
function FILTRO_PAZIENTI_SELEZIONA_COLONNA_UNICO_2024(colIndex) {
  try {
    const valoriUnici = FiltriService.getValoriUnici(colIndex);
    
    if (valoriUnici.length === 0) {
      mostraErrore(
        'Nessun dato disponibile',
        'La colonna selezionata non contiene dati da filtrare.'
      );
      return;
    }
    
    // Salva la colonna selezionata nelle proprietà
    PropertiesService.getScriptProperties().setProperty('colonnaSelezionata', colIndex.toString());
    
    // Mostra dialogo selezione valore usando il modulo UI
    FiltriUI.mostraDialogoSelezioneValore(valoriUnici, colIndex);
    
  } catch (error) {
    gestisciErrore(error, 'FILTRO_PAZIENTI_SELEZIONA_COLONNA_UNICO_2024', true);
  }
}

/**
 * Gestisce la selezione del valore e crea il foglio filtrato
 * @param {*} valore - Valore selezionato per il filtro
 */
function handleSelezioneValore(valore) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const colIndex = parseInt(properties.getProperty('colonnaSelezionata'));
    
    if (isNaN(colIndex)) {
      throw new Error('Colonna selezionata non valida');
    }

    const nomeFoglio = valore.toString().substring(0, 31);
    
    // Usa il servizio centralizzato per preparare e filtrare
    const foglioDest = FiltriService.preparaFoglioDestinazione(nomeFoglio);
    if (!foglioDest) {
      throw new Error('Impossibile creare il foglio destinazione');
    }

    const risultato = FiltriService.eseguiFiltro(colIndex, valore, foglioDest);
    
    if (!risultato.successo) {
      throw new Error(risultato.messaggio || 'Errore durante l\'esecuzione del filtro');
    }

    // Registra i criteri e attiva il foglio
    FiltriService.registraCriteriFiltro(nomeFoglio, colIndex, valore);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.setActiveSheet(foglioDest);
    
    // Pulisci proprietà temporanee
    properties.deleteProperty('colonnaSelezionata');
    
    // Mostra messaggio di successo
    mostraSuccesso(
      'Foglio filtrato creato con successo!',
      `Righe elaborate: ${risultato.righeOriginali}\nRighe filtrate: ${risultato.righeFiltrate}\nFoglio: "${nomeFoglio}"\nValore filtrato: "${valore}"`
    );
    
  } catch (error) {
    // Pulisci proprietà in caso di errore
    PropertiesService.getScriptProperties().deleteProperty('colonnaSelezionata');
    gestisciErrore(error, 'handleSelezioneValore', true);
  }
}

// === ENTRY POINTS ===

/**
 * Macro principale: avvia il processo di filtro con interfaccia moderna
 */
function avviaFiltroInterattivo() {
  try {
    const foglioOrigine = getFoglioSicuro(FILTRI_CONFIG.NOME_FOGLIO_ORIGINE);
    
    if (!foglioOrigine.successo) {
      mostraErrore(
        'Foglio non trovato',
        `Il foglio '${FILTRI_CONFIG.NOME_FOGLIO_ORIGINE}' non esiste nel documento corrente.`
      );
      return;
    }

    // Verifica che ci siano dati nel foglio
    if (foglioOrigine.foglio.getLastRow() < 2) {
      mostraErrore(
        'Nessun dato disponibile',
        `Il foglio '${FILTRI_CONFIG.NOME_FOGLIO_ORIGINE}' non contiene dati da filtrare.`
      );
      return;
    }
    
    // Salva le intestazioni nelle proprietà per evitare errori del grafico
    const intestazioni = foglioOrigine.foglio.getRange(1, 1, 1, foglioOrigine.foglio.getLastColumn()).getValues()[0];
    PropertiesService.getScriptProperties().setProperty('intestazioni', JSON.stringify(intestazioni));
    
    // Avvia il processo con il dialogo di selezione colonna usando il modulo UI
    FiltriUI.mostraDialogoSelezioneColonna();
    
  } catch (error) {
    gestisciErrore(error, 'avviaFiltroInterattivo', true);
  }
}

/**
 * Funzione di compatibilità per il grafico - reindirizza al filtro
 */
function processoSelezioneColonna() {
  // FORZA il reindirizzamento al filtro - non eseguire mai il grafico
  PropertiesService.getScriptProperties().deleteProperty('intestazioni');
  
  // Avvia il nostro dialogo di selezione colonna per il filtro
  FiltriUI.mostraDialogoSelezioneColonna();
}

/**
 * Funzione di compatibilità per handleSelezioneColonnaGrafico - reindirizza al filtro
 * @param {string} selectedColumn - Lettera della colonna selezionata
 */
function handleSelezioneColonnaGrafico(selectedColumn) {
  // FORZA il reindirizzamento al filtro - non eseguire mai il grafico
  PropertiesService.getScriptProperties().deleteProperty('intestazioni');
  
  // Convertiamo la lettera della colonna in indice numerico
  const colIndex = selectedColumn.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
  
  // Chiamiamo direttamente la nostra funzione del filtro
  FILTRO_PAZIENTI_SELEZIONA_COLONNA_UNICO_2024(colIndex);
}

/**
 * Aggiorna il foglio filtrato in base ai criteri registrati
 * Funzione trigger per aggiornamento automatico
 */
function aggiornaFoglioFiltroSuAttivazione() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    
    // Ignora fogli di sistema
    if (sheet.getName() === FILTRI_CONFIG.NOME_FOGLIO_ORIGINE || 
        sheet.getName() === FILTRI_CONFIG.NOME_FOGLIO_REGISTRO) {
      return;
    }
    
    // Ottieni criteri filtro per questo foglio
    const criteri = FiltriService.getCriteriFiltro(sheet.getName());
    if (!criteri) return;
    
    // Verifica che il foglio abbia dati prima di procedere
    if (sheet.getLastRow() < 2) return;
    
    // Pulisci e rigenera il contenuto
    sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).clearContent();
    FiltriService.eseguiFiltro(criteri.colIndex, criteri.valoreFiltro, sheet);
    
    // Applica colori alternati dopo il filtro
    applicaColoriAlternatiStandalone();
    
    logAvanzato(`Foglio filtrato aggiornato automaticamente: ${sheet.getName()}`, 'INFO');
    
  } catch (error) {
    logAvanzato(`Errore in aggiornaFoglioFiltroSuAttivazione: ${error.message}`, 'ERROR');
  }
}
