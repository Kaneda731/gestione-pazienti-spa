/**
 * Gestione Dimissioni Pazienti - Modularizzato
 * Utilizza i nuovi moduli per separare logica business, UI e validazione
 * 
 * @requires constants.js: SHEET_NAMES, COLUMNS, CONFIG
 * @requires errorHandler.js: mostraErrore, mostraSuccesso, logAvanzato
 * @requires designSystem.js: DesignSystem
 * @requires pazienti/pazienteService.js: PazienteService
 * @requires pazienti/pazienteUI.js: PazienteUI  
 * @requires pazienti/pazienteValidation.js: PazienteValidation (LEGACY)
 * @requires validation/validationSystem.js: ValidationSystem
 * @requires supabaseLoader.js: getSupabaseClient
 * 
 * @version 2.1.0 - Aggiunta integrazione Supabase
 * @since 2025-06-29
 */

/**
 * Restituisce l'URL del deployment della Web App.
 * Utilizzato dal frontend per costruire link dinamici.
 * @returns {string} L'URL del deployment della Web App.
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Gestisce il processo di dimissione di un paziente chiamato dalla Web App.
 * @param {string} nome - Nome del paziente.
 * @param {string} cognome - Cognome del paziente.
 * @param {string} dataDimissioneStr - Data di dimissione in formato stringa (es. YYYY-MM-DD).
 * @returns {Object} Oggetto con `successo` (boolean) e `message` (string).
 */
async function dimettiPazienteDaWebApp(nome, cognome, dataDimissioneStr) {
  try {
    logAvanzato(`Richiesta dimissione da WebApp per ${nome} ${cognome} con data ${dataDimissioneStr}`, 'INFO');

    // 1. Valida i dati di input
    if (!nome || !cognome || !dataDimissioneStr) {
      return { successo: false, message: "Nome, cognome e data di dimissione sono obbligatori." };
    }

    const validazioneData = ValidationSystem.validateDate(dataDimissioneStr, 'dimissione');
    if (!validazioneData.isValid) {
      return { successo: false, message: validazioneData.message };
    }
    const dataDimissioneNormalizzata = validazioneData.normalizedValue;

    // 2. Cerca il paziente
    const ricercaResult = PazienteService.gestisciRicercaPaziente(nome, cognome);

    if (ricercaResult.tipo === 'ERRORE') {
      return { successo: false, message: ricercaResult.messaggio };
    }
    if (ricercaResult.tipo === 'NESSUN_RISULTATO') {
      return { successo: false, message: "Paziente non trovato o già dimesso." };
    }
    if (ricercaResult.tipo === 'PAZIENTI_MULTIPLI') {
      return { successo: false, message: "Trovati più pazienti omonimi. Si prega di utilizzare l'interfaccia completa per la selezione." };
    }

    // Paziente unico trovato
    const paziente = ricercaResult.paziente;

    // 3. Imposta la data di dimissione
    const successoDimissione = PazienteService.impostaDataDimissione(
      paziente.riga,
      dataDimissioneNormalizzata,
      paziente.nome,
      paziente.cognome
    );

    if (successoDimissione) {
      

      return { successo: true, message: `Paziente ${nome} ${cognome} dimesso con successo.` };
    } else {
      return { successo: false, message: "Errore durante l'aggiornamento della data di dimissione." };
    }

  } catch (error) {
    gestisciErrore(error, 'dimettiPazienteDaWebApp', false); // L'errore verrà gestito dal client
    return { successo: false, message: `Errore di sistema: ${error.message}` };
  }
}

// ===== FUNZIONI DI COMPATIBILITÀ LEGACY =====
// Mantengono compatibilità con codice esistente

/** @deprecated Usa ValidationSystem.validateDate() */
function parseDate(str) {
  // Prova prima il nuovo sistema
  if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady()) {
    const result = ValidationSystem.validateDate(str, 'generic');
    return result.isValid ? result.normalizedValue : null;
  }
  
  // Fallback al sistema legacy
  if (typeof PazienteValidation !== 'undefined') {
    return PazienteValidation.parseDate(str);
  }
  
  // Fallback per compatibilità se nessun modulo è caricato
  console.warn('Nessun sistema di validazione disponibile, usando fallback parseDate');
  return null;
}

/** @deprecated Usa ValidationSystem.validateDate() con normalizzazione */
function normalizzaData(date) {
  // Prova prima il nuovo sistema
  if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady()) {
    const result = ValidationSystem.validateDate(date, 'generic');
    if (result.isValid && result.normalizedValue) {
      // Formatta come stringa DD/MM/YYYY
      const d = new Date(result.normalizedValue);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return null;
  }
  
  // Fallback al sistema legacy
  if (typeof PazienteValidation !== 'undefined') {
    return PazienteValidation.normalizzaData(date);
  }
  
  console.warn('Nessun sistema di validazione disponibile, usando fallback normalizzaData');
  return null;
}

/** @deprecated Usa ValidationSystem con text normalization */
function capitalizeWords(str) {
  // Prova prima il nuovo sistema (usando core validation)
  if (typeof ValidationSystem !== 'undefined' && ValidationSystem.isReady() && ValidationSystem.core) {
    const sanitized = ValidationSystem.core.sanitizeString(str);
    // Implementazione capitalizeWords con core validation
    return sanitized.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Fallback al sistema legacy
  if (typeof PazienteValidation !== 'undefined') {
    return PazienteValidation.capitalizeWords(str);
  }
  
  console.warn('Nessun sistema di validazione disponibile, usando fallback capitalizeWords');
  return str;
}

/** @deprecated Usa ValidationSystem.validateName() */
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
  
  // Fallback al sistema legacy
  if (typeof PazienteValidation !== 'undefined') {
    return PazienteValidation.validaNomeCognome(nome, cognome);
  }
  
  console.warn('Nessun sistema di validazione disponibile, usando fallback validaNomeCognome');
  return { valido: false, messaggio: 'Modulo validazione non disponibile' };
}

// ===== FUNZIONI UI MODERNIZZATE =====
// Ora utilizzano i moduli PazienteUI con DesignSystem unificato

/** @deprecated Usa PazienteUI.mostraDialogoInput() */
function mostraDialogoInput(titolo, messaggio, placeholder, callback) {
  if (typeof PazienteUI !== 'undefined') {
    return PazienteUI.mostraDialogoInput(titolo, messaggio, placeholder, callback.name);
  }
  // Fallback legacy
  console.warn('PazienteUI non disponibile, usando fallback mostraDialogoInput');
  const input = SpreadsheetApp.getUi().prompt(titolo, messaggio, SpreadsheetApp.getUi().ButtonSet.OK_CANCEL);
  if (input.getSelectedButton() === SpreadsheetApp.getUi().Button.OK) {
    callback(input.getResponseText());
  }
}

/** @deprecated Usa PazienteUI.mostraDialogoRicercaPaziente() */
function mostraDialogoRicercaPaziente(callback) {
  if (typeof PazienteUI !== 'undefined') {
    return PazienteUI.mostraDialogoRicercaPaziente(callback.name);
  }
  console.warn('PazienteUI non disponibile, usando fallback mostraDialogoRicercaPaziente');
  // Fallback legacy semplificato
  const nome = SpreadsheetApp.getUi().prompt('Nome', 'Inserisci il nome:', SpreadsheetApp.getUi().ButtonSet.OK_CANCEL);
  if (nome.getSelectedButton() === SpreadsheetApp.getUi().Button.OK) {
    const cognome = SpreadsheetApp.getUi().prompt('Cognome', 'Inserisci il cognome:', SpreadsheetApp.getUi().ButtonSet.OK_CANCEL);
    if (cognome.getSelectedButton() === SpreadsheetApp.getUi().Button.OK) {
      callback(nome.getResponseText(), cognome.getResponseText());
    }
  }
}

/** @deprecated Usa PazienteUI.mostraDialogoSelezioneOmonimo() */
function mostraDialogoSelezioneOmonimo(pazienti) {
  if (typeof PazienteUI !== 'undefined') {
    return PazienteUI.mostraDialogoSelezioneOmonimo(pazienti, 'handleSelezionePazienteOmonimo');
  }
  console.warn('PazienteUI non disponibile, usando fallback mostraDialogoSelezioneOmonimo');
  // Fallback molto semplificato
  mostraErrore('Pazienti Multipli', 'Trovati più pazienti omonimi. Utilizza l\'interfaccia completa.');
}

// ===== FUNZIONI BUSINESS LOGIC MODERNIZZATE =====
// Ora utilizzano i moduli PazienteService per gestione centralizzata

// Funzioni callback per gestire gli input
function handleDataDimissione(input) {
  Logger.log('Callback data dimissione chiamata con input: ' + input);
  processoDataDimissione(input);
}

/**
 * Entry point principale per inserimento data dimissione
 * Funzione di livello superiore che coordina il processo
 */
function inserisciDataDimissione() {
  try {
    // Verifica disponibilità foglio
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);

    if (!sheet) {
      mostraErrore("Errore", `Il foglio '${SHEET_NAMES.ELENCO_PAZIENTI}' non esiste.`);
      return;
    }

    // Mostra dialogo di ricerca paziente
    if (typeof PazienteUI !== 'undefined') {
      PazienteUI.mostraDialogoRicercaPaziente('processoRicercaPaziente');
    } else {
      // Fallback legacy
      mostraDialogoRicercaPaziente(processoRicercaPaziente);
    }

  } catch (error) {
    logAvanzato(`Errore in inserisciDataDimissione: ${error.message}`, 'ERROR');
    mostraErrore('Errore', `Si è verificato un errore: ${error.message}`);
  }
}

/**
 * Processa la ricerca del paziente utilizzando il nuovo PazienteService
 * @param {string} nome - Nome del paziente
 * @param {string} cognome - Cognome del paziente
 */
function processoRicercaPaziente(nome, cognome) {
  try {
    Logger.log(`Input ricerca: ${nome} ${cognome}`);

    // Usa il nuovo servizio se disponibile
    if (typeof PazienteService !== 'undefined') {
      const risultato = PazienteService.gestisciRicercaPaziente(nome, cognome);
      
      switch (risultato.tipo) {
        case 'NESSUN_RISULTATO':
          SpreadsheetApp.getUi().alert(
            'Paziente non trovato',
            risultato.messaggio,
            SpreadsheetApp.getUi().ButtonSet.OK
          );
          break;
          
        case 'PAZIENTE_UNICO':
          // Salva i dati del paziente e procedi
          PazienteService.salvaDatiPazienteTemporanei(risultato.paziente);
          
          // Mostra dialogo per data dimissione
          if (typeof PazienteUI !== 'undefined') {
            PazienteUI.mostraDialogoInput(
              'Data Dimissione',
              'Inserisci la data di dimissione (GG/MM/AAAA):',
              'GG/MM/AAAA',
              'handleDataDimissione'
            );
          } else {
            mostraDialogoInput(
              'Data Dimissione',
              'Inserisci la data di dimissione (GG/MM/AAAA):',
              'GG/MM/AAAA',
              handleDataDimissione
            );
          }
          break;
          
        case 'PAZIENTI_MULTIPLI':
          Logger.log('Trovati più pazienti omonimi, mostrando dialogo di selezione');
          if (typeof PazienteUI !== 'undefined') {
            PazienteUI.mostraDialogoSelezioneOmonimo(risultato.pazienti, 'handleSelezionePazienteOmonimo');
          } else {
            mostraDialogoSelezioneOmonimo(risultato.pazienti);
          }
          break;
          
        case 'ERRORE':
          mostraErrore('Errore', risultato.messaggio);
          break;
      }
    } else {
      // Fallback alla vecchia implementazione
      console.warn('PazienteService non disponibile, usando implementazione legacy');
      processoRicercaPazienteLegacy(nome, cognome);
    }

  } catch (error) {
    Logger.log('Errore in processoRicercaPaziente: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    mostraErrore('Errore', 'Si è verificato un errore durante la ricerca: ' + error.message);
  }
}

/**
 * Gestisce la selezione di un paziente dal dialogo omonimi
 * @param {number} riga - Il numero della riga del paziente selezionato
 */
function handleSelezionePazienteOmonimo(riga) {
  try {
    Logger.log('Paziente selezionato dalla riga: ' + riga);
    
    if (typeof PazienteService !== 'undefined') {
      // Usa il nuovo servizio
      const paziente = PazienteService.getPazienteDaRiga(riga);
      paziente.riga = riga; // Assicura che la riga sia impostata
      
      // Salva i dati temporaneamente
      PazienteService.salvaDatiPazienteTemporanei(paziente);
      
      // Procedi con la richiesta della data di dimissione
      if (typeof PazienteUI !== 'undefined') {
        PazienteUI.mostraDialogoInput(
          'Data Dimissione',
          'Inserisci la data di dimissione (GG/MM/AAAA):',
          'GG/MM/AAAA',
          'handleDataDimissione'
        );
      } else {
        mostraDialogoInput(
          'Data Dimissione',
          'Inserisci la data di dimissione (GG/MM/AAAA):',
          'GG/MM/AAAA',
          handleDataDimissione
        );
      }
    } else {
      // Fallback legacy
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);
      const nome = sheet.getRange(riga, COLUMNS.NOME).getValue();
      const cognome = sheet.getRange(riga, COLUMNS.COGNOME).getValue();
      
      PropertiesService.getScriptProperties().setProperties({
        'rigaTrovata': riga.toString(),
        'nomePaziente': nome,
        'cognomePaziente': cognome
      });

      mostraDialogoInput(
        'Data Dimissione',
        'Inserisci la data di dimissione (GG/MM/AAAA):',
        'GG/MM/AAAA',
        handleDataDimissione
      );
    }
  } catch (error) {
    Logger.log('Errore in handleSelezionePazienteOmonimo: ' + error.message);
    mostraErrore('Errore', 'Si è verificato un errore: ' + error.message);
  }
}

/**
 * Processa l'inserimento della data di dimissione
 * @param {string} inputDataDimissione - Stringa della data inserita
 */
function processoDataDimissione(inputDataDimissione) {
  try {
    if (typeof PazienteService !== 'undefined') {
      // Usa il nuovo servizio modulare
      const paziente = PazienteService.recuperaDatiPazienteTemporanei();
      
      if (!paziente) {
        mostraErrore('Errore', 'Dati paziente non trovati. Riprova la ricerca.');
        return;
      }

      console.log(`Dati recuperati - Riga: ${paziente.riga}, Nome: ${paziente.nome}, Cognome: ${paziente.cognome}`);
      console.log(`Data input ricevuta: ${inputDataDimissione}`);
      
      const risultato = PazienteService.gestisciDimissionePaziente(inputDataDimissione, paziente);
      
      if (risultato.successo) {
        // Pulizia dati temporanei
        PazienteService.pulisciDatiTemporanei();
        
        // Log silenzioso invece di alert di conferma
        Logger.log(`✅ ${risultato.messaggio}`);
        
        // Opzionale: mostra notifica di successo
        if (typeof mostraSuccesso === 'function') {
          mostraSuccesso('Dimissione Completata', risultato.messaggio);
        }
      } else {
        mostraErrore('Errore', risultato.messaggio);
      }
    } else {
      // Fallback alla vecchia implementazione
      console.warn('PazienteService non disponibile, usando implementazione legacy');
      processoDataDimissioneLegacy(inputDataDimissione);
    }

  } catch (error) {
    console.error('Errore in processoDataDimissione:', error);
    mostraErrore('Errore', 'Si è verificato un errore: ' + error.message);
  }
}

// ===== FUNZIONI LEGACY DI FALLBACK =====
// Mantengono compatibilità quando i nuovi moduli non sono disponibili

/**
 * Implementazione legacy per la ricerca pazienti
 * @deprecated Usa PazienteService.gestisciRicercaPaziente()
 */
function processoRicercaPazienteLegacy(nome, cognome) {
  // Implementazione originale semplificata per fallback
  console.warn('Usando implementazione legacy per ricerca pazienti');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);
    
    // Validazione basica
    if (!nome || !cognome) {
      mostraErrore('Errore', 'Nome e cognome sono obbligatori.');
      return;
    }
    
    const lastRow = Math.min(sheet.getLastRow(), CONFIG.MAX_RIGHE || 500);
    const valori = sheet.getRange(2, 1, lastRow - 1, COLUMNS.DATA_DIMISSIONE).getValues();
    
    // Ricerca semplificata
    for (let i = 0; i < valori.length; i++) {
      const cellCognome = String(valori[i][COLUMNS.COGNOME - 1] || '').toLowerCase().trim();
      const cellNome = String(valori[i][COLUMNS.NOME - 1] || '').toLowerCase().trim();
      const dataDimissione = valori[i][COLUMNS.DATA_DIMISSIONE - 1];
      
      if (cellCognome === cognome.toLowerCase().trim() && 
          cellNome === nome.toLowerCase().trim() && 
          (!dataDimissione || dataDimissione === '')) {
        
        // Paziente trovato - salva e procedi
        PropertiesService.getScriptProperties().setProperties({
          'rigaTrovata': (i + 2).toString(),
          'nomePaziente': nome,
          'cognomePaziente': cognome
        });
        
        mostraDialogoInput(
          'Data Dimissione',
          'Inserisci la data di dimissione (GG/MM/AAAA):',
          'GG/MM/AAAA',
          handleDataDimissione
        );
        return;
      }
    }
    
    // Nessun paziente trovato
    SpreadsheetApp.getUi().alert(
      'Paziente non trovato',
      "Paziente non trovato o già dimesso.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    mostraErrore('Errore', 'Si è verificato un errore durante la ricerca: ' + error.message);
  }
}

/**
 * Implementazione legacy per dimissione paziente
 * @deprecated Usa PazienteService.gestisciDimissionePaziente()
 */
function processoDataDimissioneLegacy(inputDataDimissione) {
  console.warn('Usando implementazione legacy per dimissione paziente');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);
    
    // Recupera i dati salvati
    const properties = PropertiesService.getScriptProperties();
    const rigaTrovata = parseInt(properties.getProperty('rigaTrovata'));
    const nomePaziente = properties.getProperty('nomePaziente');
    const cognomePaziente = properties.getProperty('cognomePaziente');

    if (!rigaTrovata || !nomePaziente || !cognomePaziente) {
      mostraErrore('Errore', 'Dati paziente non trovati. Riprova la ricerca.');
      return;
    }

    const dataStr = inputDataDimissione.trim();
    
    // Parsing data semplificato
    const dataObj = parseDate(dataStr);
    if (!dataObj) {
      SpreadsheetApp.getUi().alert('Errore', 'Formato data non valido. Usa GG/MM/AAAA.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }

    // Normalizza la data
    const dataNormalizzata = normalizzaData(dataObj);
    
    // Imposta la data nella cella
    const cellaDimissione = sheet.getRange(rigaTrovata, COLUMNS.DATA_DIMISSIONE);
    cellaDimissione.setValue(dataNormalizzata);
    
    // Pulisci le proprietà
    properties.deleteProperty('rigaTrovata');
    properties.deleteProperty('nomePaziente');
    properties.deleteProperty('cognomePaziente');
    
    Logger.log(`✅ Data dimissione inserita correttamente per ${nomePaziente} ${cognomePaziente}`);
    
  } catch (error) {
    console.error('Errore in processoDataDimissioneLegacy:', error);
    mostraErrore('Errore', 'Si è verificato un errore: ' + error.message);
  }
}

// ===== INFORMAZIONI MODULO =====

/**
 * Verifica stato modularizzazione con gestione asincrona
 * @returns {Object} Status dei moduli caricati
 */
function getModularizationStatus() {
  return {
    pazienteService: typeof PazienteService !== 'undefined' && 
                     typeof PazienteService.isAvailable === 'function' && 
                     PazienteService.isAvailable(),
    pazienteUI: typeof PazienteUI !== 'undefined' && 
                typeof PazienteUI.isAvailable === 'function' && 
                PazienteUI.isAvailable(),
    pazienteValidation: typeof PazienteValidation !== 'undefined' && 
                        typeof PazienteValidation.isAvailable === 'function' && 
                        PazienteValidation.isAvailable(),
    validationSystem: typeof ValidationSystem !== 'undefined' && 
                      typeof ValidationSystem.isReady === 'function' && 
                      ValidationSystem.isReady(),
    designSystem: typeof DesignSystem !== 'undefined',
    errorHandler: typeof mostraErrore !== 'undefined',
    constants: typeof SHEET_NAMES !== 'undefined' && typeof COLUMNS !== 'undefined'
  };
}

/**
 * Log stato modularizzazione al caricamento con retry
 */
function logModularizationStatus() {
  const status = getModularizationStatus();
  const allLoaded = Object.values(status).every(Boolean);
  
  if (allLoaded) {
    if (typeof logAvanzato === 'function') {
      logAvanzato('inserisciDataDimissione.js caricato - Modalità MODULARE attiva', 'INFO');
    } else {
      console.log('✅ inserisciDataDimissione.js - Modalità MODULARE attiva');
    }
  } else {
    // Programma un retry dopo 100ms per dare tempo ai moduli di caricarsi
    Utilities.sleep(100);
    const statusRetry = getModularizationStatus();
    const allLoadedRetry = Object.values(statusRetry).every(Boolean);
    
    if (allLoadedRetry) {
      if (typeof logAvanzato === 'function') {
        logAvanzato('inserisciDataDimissione.js caricato - Modalità MODULARE attiva (dopo retry)', 'INFO');
      } else {
        console.log('✅ inserisciDataDimissione.js - Modalità MODULARE attiva (dopo retry)');
      }
    } else {
      console.warn('⚠️ inserisciDataDimissione.js - Modalità LEGACY attiva (alcuni moduli mancanti)');
      console.warn('Moduli mancanti:', Object.entries(statusRetry).filter(([k,v]) => !v).map(([k,v]) => k));
    }
  }
}

/**
 * Verifica moduli con delay sincrono per GAS
 */
function verificaModuliAsincrono() {
  // Usa Utilities.sleep per delay sincrono in GAS
  Utilities.sleep(200);
  const status = getModularizationStatus();
  const allLoaded = Object.values(status).every(Boolean);
  
  if (allLoaded) {
    if (typeof logAvanzato === 'function') {
      logAvanzato('✅ Verifica completata: Tutti i moduli caricati correttamente', 'INFO');
    } else {
      console.log('✅ Verifica completata: Tutti i moduli caricati correttamente');
    }
  }
}

// Inizializzazione intelligente al caricamento (chiamata diretta per GAS)
inizializzazioneIntelligente();

/**
 * Test rapido per verificare che i moduli siano caricati
 * Questa funzione può essere chiamata manualmente per verificare lo stato
 */
function testRapidoModuli() {
  console.log('🔍 TEST RAPIDO - Verifica moduli base...');
  
  const moduli = {
    'PazienteValidation': typeof PazienteValidation !== 'undefined' && PazienteValidation.isAvailable(),
    'PazienteService': typeof PazienteService !== 'undefined' && PazienteService.isAvailable(),
    'PazienteUI': typeof PazienteUI !== 'undefined' && PazienteUI.isAvailable(),
    'DesignSystem': typeof DesignSystem !== 'undefined',
    'Constants': typeof SHEET_NAMES !== 'undefined' && typeof COLUMNS !== 'undefined',
    'ErrorHandler': typeof mostraErrore !== 'undefined'
  };
  
  const moduliCaricati = Object.values(moduli).filter(Boolean).length;
  const moduliTotali = Object.keys(moduli).length;
  
  if (moduliCaricati === moduliTotali) {
    console.log('✓ Tutti i moduli essenziali sono caricati');
    console.log('✅ TEST RAPIDO SUPERATO');
    
    if (typeof logAvanzato === 'function') {
      logAvanzato('TEST RAPIDO SUPERATO - Sistema pronto', 'INFO');
    }
    
    return true;
  } else {
    console.log(`⚠️ Moduli caricati: ${moduliCaricati}/${moduliTotali}`);
    Object.entries(moduli).forEach(([nome, caricato]) => {
      console.log(`${caricato ? '✓' : '✗'} ${nome}`);
    });
    
    return false;
  }
}

/**
 * Verifica silenciosa dello stato dei moduli
 * Utilizzata durante il caricamento per evitare warning prematuri
 */
function verificaModuliSilenzioso() {
  try {
    const status = getModularizationStatus();
    const allLoaded = Object.values(status).every(Boolean);
    
    if (allLoaded) {
      // Log solo quando tutto è caricato
      if (typeof logAvanzato === 'function') {
        logAvanzato('🎉 Modularizzazione COMPLETA - Tutti i moduli caricati correttamente', 'INFO');
      } else {
        console.log('🎉 Modularizzazione COMPLETA - Tutti i moduli caricati correttamente');
      }
      return true;
    }
    
    return false;
  } catch (error) {
    // Silenzioso durante il caricamento
    return false;
  }
}

/**
 * Inizializzazione intelligente dei moduli
 * Evita warning durante il caricamento sequenziale di GAS
 */
function inizializzazioneIntelligente() {
  // Prima verifica immediata (silente)
  if (verificaModuliSilenzioso()) {
    return; // Tutto ok, non serve altro
  }
  
  // Se non tutto è caricato, programma verifiche progressive (sincrone per GAS)
  let tentativi = 0;
  const maxTentativi = 3;
  
  while (tentativi < maxTentativi) {
    tentativi++;
    
    // Attendi un po' prima della prossima verifica
    Utilities.sleep(150);
    
    if (verificaModuliSilenzioso()) {
      return; // Tutto caricato, esce
    }
  }
  
  // Se arriviamo qui, alcuni moduli potrebbero mancare
  const status = getModularizationStatus();
  const moduliMancanti = Object.entries(status).filter(([k,v]) => !v).map(([k,v]) => k);
  
  if (moduliMancanti.length > 0) {
    console.warn('⚠️ Alcuni moduli potrebbero non essere completamente caricati:', moduliMancanti);
    console.log('💡 Esegui testRapidoModuli() per verificare lo stato attuale');
  }
}

// Inizializzazione intelligente al caricamento (chiamata diretta per GAS)
inizializzazioneIntelligente();
