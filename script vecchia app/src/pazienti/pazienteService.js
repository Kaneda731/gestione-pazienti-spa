/**
 * Servizio business logic per la gestione pazienti
 * Contiene tutta la logica di ricerca, selezione e dimissione pazienti
 * 
 * @requires constants.js: SHEET_NAMES, COLUMNS, CONFIG
 * @requires errorHandler.js: mostraErrore, mostraSuccesso, logAvanzato
 * @requires pazienti/pazienteValidation.js: PazienteValidation
 * 
 * @version 1.0.0
 * @since 2025-06-24
 */

/**
 * Servizio principale per la gestione dei pazienti
 * Fornisce metodi per ricerca, selezione e dimissione
 */
const PazienteService = {

  /**
   * Cerca pazienti non dimessi nel foglio ElencoPazienti
   * @param {string} nome - Nome del paziente
   * @param {string} cognome - Cognome del paziente
   * @returns {Array} Array di pazienti trovati
   */
  cercaPazientiNonDimessi(nome, cognome) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);

      if (!sheet) {
        throw new Error(`Il foglio '${SHEET_NAMES.ELENCO_PAZIENTI}' non esiste.`);
      }

      // Valida input
      const validazione = PazienteValidation.validaNomeCognome(nome, cognome);
      if (!validazione.valido) {
        throw new Error(validazione.messaggio);
      }

      const lastRow = Math.min(sheet.getLastRow(), CONFIG.MAX_RIGHE || 500);
      if (lastRow < 2) {
        return []; // Nessun dato oltre l'intestazione
      }

      // Leggi i valori dal foglio
      const valori = sheet.getRange(2, 1, lastRow - 1, COLUMNS.DATA_DIMISSIONE).getValues();
      const pazientiTrovati = [];

      // Normalizza il nome e cognome cercati
      const nomeCercato = validazione.nome.toLowerCase().trim();
      const cognomeCercato = validazione.cognome.toLowerCase().trim();

      // Cerca tutti i pazienti che corrispondono e non sono dimessi
      for (let i = 0; i < valori.length; i++) {
        const cellCognome = String(valori[i][COLUMNS.COGNOME - 1] || '').toLowerCase().trim();
        const cellNome = String(valori[i][COLUMNS.NOME - 1] || '').toLowerCase().trim();
        const dataIngresso = valori[i][COLUMNS.DATA_INGRESSO - 1];
        const dataDimissione = valori[i][COLUMNS.DATA_DIMISSIONE - 1];

        // Verifica corrispondenza nome/cognome e che non sia già dimesso
        const cognomeMatch = cellCognome === cognomeCercato;
        const nomeMatch = cellNome === nomeCercato;
        const nonDimesso = !dataDimissione || dataDimissione === '';

        if (cognomeMatch && nomeMatch && nonDimesso) {
          let dataIngressoStr = 'Data non disponibile';
          
          // Formatta la data di ingresso se disponibile
          if (dataIngresso instanceof Date && !isNaN(dataIngresso.getTime())) {
            try {
              dataIngressoStr = Utilities.formatDate(dataIngresso, 'Europe/Rome', 'dd/MM/yyyy');
            } catch (error) {
              logAvanzato(`Errore formattazione data ingresso riga ${i + 2}: ${error.message}`, 'WARNING');
            }
          }

          pazientiTrovati.push({
            riga: i + 2, // +2 perché partiamo dalla riga 2 (dopo header)
            nome: validazione.nome,
            cognome: validazione.cognome,
            dataIngresso: dataIngresso,
            dataIngressoStr: dataIngressoStr
          });
        }
      }

      logAvanzato(`Ricerca completata: trovati ${pazientiTrovati.length} pazienti per ${nome} ${cognome}`, 'INFO');
      return pazientiTrovati;

    } catch (error) {
      logAvanzato(`Errore in cercaPazientiNonDimessi: ${error.message}`, 'ERROR');
      throw error;
    }
  },

  /**
   * Ottiene i dati di un paziente da una riga specifica
   * @param {number} riga - Numero della riga nel foglio
   * @returns {Object} Dati del paziente
   */
  getPazienteDaRiga(riga) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);
      if (!sheet) {
        throw new Error(`Il foglio '${SHEET_NAMES.ELENCO_PAZIENTI}' non esiste.`);
      }

      const nome = sheet.getRange(riga, COLUMNS.NOME).getValue();
      const cognome = sheet.getRange(riga, COLUMNS.COGNOME).getValue();
      const dataIngresso = sheet.getRange(riga, COLUMNS.DATA_INGRESSO).getValue();

      return {
        riga: riga,
        nome: String(nome || '').trim(),
        cognome: String(cognome || '').trim(),
        dataIngresso: dataIngresso
      };

    } catch (error) {
      logAvanzato(`Errore in getPazienteDaRiga: ${error.message}`, 'ERROR');
      throw error;
    }
  },

  /**
   * Imposta la data di dimissione per un paziente
   * @param {number} riga - Numero della riga nel foglio
   * @param {Date} dataDimissione - Data di dimissione normalizzata
   * @param {string} nomePaziente - Nome del paziente (per log)
   * @param {string} cognomePaziente - Cognome del paziente (per log)
   * @returns {boolean} True se l'operazione è riuscita
   */
  impostaDataDimissione(riga, dataDimissione, nomePaziente, cognomePaziente) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);

      if (!sheet) {
        throw new Error(`Il foglio '${SHEET_NAMES.ELENCO_PAZIENTI}' non esiste.`);
      }

      // Verifica che la data sia valida
      if (!(dataDimissione instanceof Date) || isNaN(dataDimissione.getTime())) {
        throw new Error('Data di dimissione non valida.');
      }

      // Imposta la data nella cella
      const cellaDimissione = sheet.getRange(riga, COLUMNS.DATA_DIMISSIONE);
      cellaDimissione.setValue(dataDimissione);

      logAvanzato(`Data dimissione impostata correttamente per ${nomePaziente} ${cognomePaziente} (riga ${riga})`, 'INFO');
      return true;

    } catch (error) {
      logAvanzato(`Errore in impostaDataDimissione: ${error.message}`, 'ERROR');
      throw error;
    }
  },

  /**
   * Gestisce il processo completo di ricerca paziente
   * @param {string} nome - Nome del paziente
   * @param {string} cognome - Cognome del paziente
   * @returns {Object} Risultato della ricerca con azioni da intraprendere
   */
  gestisciRicercaPaziente(nome, cognome) {
    try {
      const pazientiTrovati = this.cercaPazientiNonDimessi(nome, cognome);

      if (pazientiTrovati.length === 0) {
        return {
          tipo: 'NESSUN_RISULTATO',
          messaggio: "Paziente non trovato o già dimesso nel foglio 'ElencoPazienti'. Verificare di aver inserito correttamente nome e cognome.",
          pazienti: []
        };
      }

      if (pazientiTrovati.length === 1) {
        return {
          tipo: 'PAZIENTE_UNICO',
          messaggio: 'Paziente trovato',
          pazienti: pazientiTrovati,
          paziente: pazientiTrovati[0]
        };
      }

      return {
        tipo: 'PAZIENTI_MULTIPLI',
        messaggio: `Trovati ${pazientiTrovati.length} pazienti omonimi`,
        pazienti: pazientiTrovati
      };

    } catch (error) {
      logAvanzato(`Errore in gestisciRicercaPaziente: ${error.message}`, 'ERROR');
      return {
        tipo: 'ERRORE',
        messaggio: `Si è verificato un errore durante la ricerca: ${error.message}`,
        pazienti: []
      };
    }
  },

  /**
   * Gestisce il processo completo di dimissione paziente
   * @param {string} dataStr - Stringa della data di dimissione
   * @param {Object} paziente - Dati del paziente da dimettere
   * @returns {Object} Risultato dell'operazione
   */
  gestisciDimissionePaziente(dataStr, paziente) {
    try {
      // Valida la data di dimissione
      const validazioneData = PazienteValidation.validaDataDimissione(dataStr);
      if (!validazioneData.valido) {
        return {
          successo: false,
          messaggio: validazioneData.messaggio
        };
      }

      // Imposta la data di dimissione
      const successo = this.impostaDataDimissione(
        paziente.riga,
        validazioneData.data,
        paziente.nome,
        paziente.cognome
      );

      if (successo) {
        return {
          successo: true,
          messaggio: `Data dimissione inserita correttamente per ${paziente.nome} ${paziente.cognome}`
        };
      } else {
        return {
          successo: false,
          messaggio: 'Errore durante l\'inserimento della data di dimissione'
        };
      }

    } catch (error) {
      logAvanzato(`Errore in gestisciDimissionePaziente: ${error.message}`, 'ERROR');
      return {
        successo: false,
        messaggio: `Si è verificato un errore: ${error.message}`
      };
    }
  },

  /**
   * Salva temporaneamente i dati del paziente nelle proprietà dello script
   * @param {Object} paziente - Dati del paziente da salvare
   */
  salvaDatiPazienteTemporanei(paziente) {
    try {
      PropertiesService.getScriptProperties().setProperties({
        'rigaTrovata': paziente.riga.toString(),
        'nomePaziente': paziente.nome,
        'cognomePaziente': paziente.cognome
      });
      
      logAvanzato(`Dati paziente salvati temporaneamente: ${paziente.nome} ${paziente.cognome}`, 'INFO');
    } catch (error) {
      logAvanzato(`Errore nel salvataggio dati temporanei: ${error.message}`, 'ERROR');
      throw error;
    }
  },

  /**
   * Recupera i dati del paziente dalle proprietà dello script
   * @returns {Object|null} Dati del paziente o null se non trovati
   */
  recuperaDatiPazienteTemporanei() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const rigaTrovata = properties.getProperty('rigaTrovata');
      const nomePaziente = properties.getProperty('nomePaziente');
      const cognomePaziente = properties.getProperty('cognomePaziente');

      if (!rigaTrovata || !nomePaziente || !cognomePaziente) {
        return null;
      }

      return {
        riga: parseInt(rigaTrovata),
        nome: nomePaziente,
        cognome: cognomePaziente
      };
    } catch (error) {
      logAvanzato(`Errore nel recupero dati temporanei: ${error.message}`, 'ERROR');
      return null;
    }
  },

  /**
   * Pulisce i dati temporanei dalle proprietà dello script
   */
  pulisciDatiTemporanei() {
    try {
      const properties = PropertiesService.getScriptProperties();
      properties.deleteProperty('rigaTrovata');
      properties.deleteProperty('nomePaziente');
      properties.deleteProperty('cognomePaziente');
      
      logAvanzato('Dati temporanei puliti', 'INFO');
    } catch (error) {
      logAvanzato(`Errore nella pulizia dati temporanei: ${error.message}`, 'WARNING');
    }
  },

  /**
   * Verifica disponibilità del servizio
   * @returns {boolean} True se il servizio è disponibile
   */
  isAvailable() {
    return typeof SpreadsheetApp !== 'undefined' && 
           typeof SHEET_NAMES !== 'undefined' && 
           typeof COLUMNS !== 'undefined';
  }
};

// Log del caricamento del modulo
if (typeof logAvanzato === 'function') {
  logAvanzato('PazienteService caricato correttamente', 'INFO');
} else {
  console.log('✓ PazienteService caricato');
}
