/**
 * FILTRI CORE - Logica business per gestione filtri pazienti
 * Modulo estratto da aggiornaFoglioFiltroSuAttivazione.js
 * 
 * === RESPONSABILITÀ ===
 * - Gestione registro filtri
 * - Esecuzione filtri sui dati
 * - Preparazione fogli destinazione
 * - Formattazione standard
 * 
 * === DIPENDENZE ===
 * @requires constants.js - SHEET_NAMES, CONFIG
 * @requires utils.js - getFoglioSicuro, logAvanzato
 * @requires errorHandler.js - gestisciErrore
 */

// === COSTANTI MODULO ===
const FILTRI_CONFIG = {
  NOME_FOGLIO_ORIGINE: 'ElencoPazienti',
  NOME_FOGLIO_REGISTRO: 'RegistroFiltri',
  COLONNA_DA_NASCONDERE: 9, // Colonna I (1-based)
  ALTEZZA_RIGA_PX: 20
};

/**
 * Servizio principale per gestione filtri
 */
const FiltriService = {

  /**
   * Ritorna (o crea) il foglio registro dei filtri
   * @returns {Sheet} Foglio registro filtri
   */
  getFoglioRegistro() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let registro = ss.getSheetByName(FILTRI_CONFIG.NOME_FOGLIO_REGISTRO);
      
      if (!registro) {
        registro = ss.insertSheet(FILTRI_CONFIG.NOME_FOGLIO_REGISTRO);
        registro.appendRow(['NomeFoglio', 'ColonnaFiltro', 'ValoreFiltro']);
        registro.hideSheet();
        logAvanzato('Creato nuovo foglio registro filtri', 'INFO');
      }
      
      return registro;
    } catch (error) {
      gestisciErrore(error, 'getFoglioRegistro', true);
      return null;
    }
  },

  /**
   * Salva o aggiorna i criteri di filtro nel registro
   * @param {string} nomeFoglio - Nome del foglio filtrato
   * @param {number} colIndex - Indice colonna filtro
   * @param {string} valoreFiltro - Valore del filtro
   * @returns {boolean} Successo operazione
   */
  registraCriteriFiltro(nomeFoglio, colIndex, valoreFiltro) {
    try {
      const registro = this.getFoglioRegistro();
      if (!registro) return false;

      const data = registro.getDataRange().getValues();
      let row = -1;
      
      // Cerca riga esistente per questo foglio
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === nomeFoglio) {
          row = i + 1;
          break;
        }
      }
      
      // Aggiorna o inserisce nuovo record
      if (row === -1) {
        registro.appendRow([nomeFoglio, colIndex, valoreFiltro]);
        logAvanzato('Nuovo criterio filtro registrato', 'INFO', { nomeFoglio, colIndex, valoreFiltro });
      } else {
        registro.getRange(row, 2, 1, 2).setValues([[colIndex, valoreFiltro]]);
        logAvanzato('Criterio filtro aggiornato', 'INFO', { nomeFoglio, colIndex, valoreFiltro });
      }
      
      return true;
    } catch (error) {
      gestisciErrore(error, 'registraCriteriFiltro', true);
      return false;
    }
  },

  /**
   * Ottiene i criteri di filtro per un foglio se presenti
   * @param {string} nomeFoglio - Nome del foglio
   * @returns {Object|null} Criteri filtro o null se non presenti
   */
  getCriteriFiltro(nomeFoglio) {
    try {
      const registro = this.getFoglioRegistro();
      if (!registro) return null;

      const data = registro.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === nomeFoglio) {
          return {
            nomeFoglio: data[i][0],
            colIndex: data[i][1],
            valoreFiltro: data[i][2]
          };
        }
      }
      
      return null;
    } catch (error) {
      gestisciErrore(error, 'getCriteriFiltro', false);
      return null;
    }
  },

  /**
   * Prepara il foglio destinazione per i dati filtrati
   * @param {string} nomeFoglio - Nome del foglio destinazione
   * @returns {Sheet|null} Foglio preparato o null se errore
   */
  preparaFoglioDestinazione(nomeFoglio) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let foglioDest = ss.getSheetByName(nomeFoglio);
      
      if (!foglioDest) {
        foglioDest = ss.insertSheet(nomeFoglio);
        logAvanzato('Creato nuovo foglio destinazione', 'INFO', { nomeFoglio });
      } else {
        // Pulisce il foglio esistente
        foglioDest.clear();
        logAvanzato('Foglio destinazione pulito', 'INFO', { nomeFoglio });
      }
      
      return foglioDest;
    } catch (error) {
      gestisciErrore(error, 'preparaFoglioDestinazione', true);
      return null;
    }
  },

  /**
   * Applica formattazione standard al foglio
   * @param {Sheet} sheet - Foglio da formattare
   * @returns {boolean} Successo operazione
   */
  applicaFormattazioneStandard(sheet) {
    try {
      if (!sheet) return false;

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      
      if (lastRow === 0 || lastCol === 0) return true;

      // Formattazione header
      if (lastRow >= 1) {
        const headerRange = sheet.getRange(1, 1, 1, lastCol);
        headerRange.setFontWeight('bold')
                  .setBackground('#4285F4')
                  .setFontColor('#FFFFFF');
      }

      // Bordi e allineamento
      const dataRange = sheet.getRange(1, 1, lastRow, lastCol);
      dataRange.setBorder(true, true, true, true, true, true)
              .setVerticalAlignment('middle');

      // Colori alternati per le righe
      if (lastRow > 1) {
        for (let row = 2; row <= lastRow; row++) {
          const rowRange = sheet.getRange(row, 1, 1, lastCol);
          if (row % 2 === 0) {
            rowRange.setBackground('#F8F9FA');
          } else {
            rowRange.setBackground('#FFFFFF');
          }
        }
      }

      // Imposta altezza righe
      sheet.setRowHeights(1, lastRow, FILTRI_CONFIG.ALTEZZA_RIGA_PX);

      // Auto-resize colonne
      sheet.autoResizeColumns(1, lastCol);

      // Congela header
      if (lastRow >= 1) {
        sheet.setFrozenRows(1);
      }

      // Nasconde colonna specifica se presente
      if (lastCol >= FILTRI_CONFIG.COLONNA_DA_NASCONDERE) {
        sheet.hideColumns(FILTRI_CONFIG.COLONNA_DA_NASCONDERE);
      }

      logAvanzato('Formattazione standard applicata', 'INFO', { 
        foglio: sheet.getName(), 
        righe: lastRow, 
        colonne: lastCol 
      });
      
      return true;
    } catch (error) {
      gestisciErrore(error, 'applicaFormattazioneStandard', true);
      return false;
    }
  },

  /**
   * Esegue il filtro sui dati e popola il foglio destinazione
   * @param {number} colIndex - Indice colonna da filtrare
   * @param {string} valoreFiltro - Valore per il filtro
   * @param {Sheet} foglioDest - Foglio destinazione
   * @returns {Object} Risultato operazione con statistiche
   */
  eseguiFiltro(colIndex, valoreFiltro, foglioDest) {
    try {
      const risultato = {
        successo: false,
        righeFiltrate: 0,
        righeOriginali: 0,
        messaggio: ''
      };

      // Ottiene il foglio origine
      const foglioOrigine = getFoglioSicuro(FILTRI_CONFIG.NOME_FOGLIO_ORIGINE);
      if (!foglioOrigine.successo) {
        risultato.messaggio = foglioOrigine.errore;
        return risultato;
      }

      const sheet = foglioOrigine.foglio;
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();

      if (lastRow < 2) {
        risultato.messaggio = 'Nessun dato da filtrare nel foglio origine';
        return risultato;
      }

      risultato.righeOriginali = lastRow - 1; // Esclude header

      // Legge tutti i dati
      const datiCompleti = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      const header = datiCompleti[0];
      const datiDaFiltrare = datiCompleti.slice(1);

      // Applica filtro
      const datiFiltrati = datiDaFiltrare.filter(riga => {
        const valoreCella = riga[colIndex] ? riga[colIndex].toString() : '';
        return valoreCella === valoreFiltro;
      });

      risultato.righeFiltrate = datiFiltrati.length;

      if (datiFiltrati.length === 0) {
        risultato.messaggio = `Nessuna riga trovata con valore "${valoreFiltro}" nella colonna selezionata`;
        return risultato;
      }

      // Scrive i dati nel foglio destinazione
      foglioDest.getRange(1, 1, 1, header.length).setValues([header]);
      foglioDest.getRange(2, 1, datiFiltrati.length, datiFiltrati[0].length).setValues(datiFiltrati);

      // Applica formattazione
      this.applicaFormattazioneStandard(foglioDest);

      risultato.successo = true;
      risultato.messaggio = `Filtro applicato con successo: ${datiFiltrati.length} righe trovate`;

      logAvanzato('Filtro eseguito con successo', 'INFO', {
        colIndex,
        valoreFiltro,
        righeFiltrate: datiFiltrati.length,
        righeOriginali: risultato.righeOriginali
      });

      return risultato;
    } catch (error) {
      gestisciErrore(error, 'eseguiFiltro', false);
      return {
        successo: false,
        righeFiltrate: 0,
        righeOriginali: 0,
        messaggio: `Errore durante l'esecuzione del filtro: ${error.message}`
      };
    }
  },

  /**
   * Ottiene i valori unici da una colonna per il filtro
   * @param {number} colIndex - Indice colonna
   * @returns {Array} Array di valori unici
   */
  getValoriUnici(colIndex) {
    try {
      const foglioOrigine = getFoglioSicuro(FILTRI_CONFIG.NOME_FOGLIO_ORIGINE);
      if (!foglioOrigine.successo) {
        return [];
      }

      const sheet = foglioOrigine.foglio;
      const lastRow = sheet.getLastRow();

      if (lastRow < 2) return [];

      const valori = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();
      const valoriUnici = [...new Set(valori.map(v => v[0]).filter(v => v !== null && v !== ''))];
      
      return valoriUnici.sort();
    } catch (error) {
      gestisciErrore(error, 'getValoriUnici', false);
      return [];
    }
  }
};

// Export per compatibilità
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FiltriService, FILTRI_CONFIG };
}
