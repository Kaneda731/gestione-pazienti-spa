/**
 * Servizio per la gestione dei dati specifici del grafico diagnosi.
 * Contiene la logica per il recupero e il filtraggio dei dati per il grafico.
 * Non modifica i dati originali del foglio.
 *
 * === DIPENDENZE ===
 * @requires constants.js - SHEET_NAMES
 * @requires utils.js - getFoglioSicuro, logAvanzato, parseDate
 * @requires errorHandler.js - gestisciErrore
 */

const GraficoService = {

  /**
   * Ottiene i dati delle diagnosi filtrate dal foglio ElencoPazienti, utilizzando la cache.
   * @param {object} filtri - Oggetto contenente i criteri di filtro.
   * @param {string} [filtri.reparto] - Reparto di appartenenza.
   * @param {string} [filtri.livello] - Livello di assistenza.
   * @param {string} [filtri.dataDal] - Data di ricovero (inizio intervallo).
   * @param {string} [filtri.dataAl] - Data di ricovero (fine intervallo).
   * @returns {Array<string>} Un array di stringhe rappresentanti le diagnosi filtrate.
   */
  getDatiFiltratiPerGrafico: function(filtri = {}) {
    try {
      logAvanzato('Inizio recupero dati per grafico con filtri (con cache).', 'INFO', filtri);

      const cache = CacheService.getScriptCache();
      // Genera una chiave cache unica basata sui filtri
      const CACHE_KEY = 'graficoDiagnosiData_' + JSON.stringify(filtri);
      const CACHE_EXPIRATION_SECONDS = 300; // 5 minuti (perché i dati dei pazienti possono cambiare più spesso)

      // 1. Prova a recuperare i dati dalla cache
      let cachedData = cache.get(CACHE_KEY);
      if (cachedData != null) {
        logAvanzato('Dati grafico recuperati dalla cache.', 'INFO');
        return JSON.parse(cachedData);
      }

      logAvanzato('Dati grafico non trovati nella cache, recupero dal foglio.', 'INFO');

      const foglioResult = getFoglioSicuro(SHEET_NAMES.ELENCO_PAZIENTI);
      if (!foglioResult.successo) {
        throw new Error(foglioResult.errore);
      }
      const foglio = foglioResult.foglio;

      const datiCompleti = foglio.getDataRange().getValues();
      if (datiCompleti.length < 2) {
        logAvanzato('Nessun dato paziente trovato nel foglio.', 'WARN');
        return [];
      }

      const header = datiCompleti[0];
      const dati = datiCompleti.slice(1); // Esclude l'header

      // Mappa i nomi delle colonne agli indici per flessibilità
      const colMap = {
        reparto: header.indexOf('Tipo di ricovero'),
        diagnosi: header.indexOf('Diagnosi'),
        dataRicovero: header.indexOf('Ingresso'),
        livello: header.indexOf('IDA')
      };

      // Verifica che tutte le colonne necessarie esistano
      for (const key in colMap) {
        if (colMap[key] === -1) {
          throw new Error(`Colonna '${key}' non trovata nel foglio '${SHEET_NAMES.ELENCO_PAZIENTI}'.`);
        }
      }

      const datiFiltrati = dati.filter(riga => {
        let includeRow = true;

        // Filtro per Reparto
        if (filtri.reparto && filtri.reparto !== '') {
          if (riga[colMap.reparto] !== filtri.reparto) {
            includeRow = false;
          }
        }

        // Filtro per Livello Assistenza
        if (includeRow && filtri.livello && filtri.livello !== '') {
          if (riga[colMap.livello] !== filtri.livello) {
            includeRow = false;
          }
        }

        // Filtro per Data di Ricovero
        if (includeRow && (filtri.dataDal || filtri.dataAl)) {
          const dataRicoveroRaw = riga[colMap.dataRicovero];
          const dataRicovero = parseDate(dataRicoveroRaw); // Usa la tua funzione parseDate

          if (!dataRicovero) {
            // Se la data non è valida, escludi la riga o gestisci come preferisci
            includeRow = false; 
          } else {
            if (filtri.dataDal && filtri.dataDal !== '') {
              const dal = parseDate(filtri.dataDal);
              if (dal && dataRicovero < dal) {
                includeRow = false;
              }
            }
            if (includeRow && filtri.dataAl && filtri.dataAl !== '') {
              const al = parseDate(filtri.dataAl);
              // Aggiungi un giorno alla data 'al' per includere l'intero giorno
              if (al) {
                al.setDate(al.getDate() + 1);
                if (dataRicovero >= al) {
                  includeRow = false;
                }
              }
            }
          }
        }

        return includeRow;
      });

      // Estrai solo le diagnosi dai dati filtrati
      const diagnosiFiltrate = datiFiltrati
        .map(riga => riga[colMap.diagnosi])
        .filter(diagnosi => diagnosi && diagnosi.toString().trim() !== '')
        .map(diagnosi => diagnosi.toString().trim());

      // Memorizza i dati nella cache
      cache.put(CACHE_KEY, JSON.stringify(diagnosiFiltrate), CACHE_EXPIRATION_SECONDS);

      logAvanzato(`Recuperate ${diagnosiFiltrate.length} diagnosi filtrate e memorizzate nella cache.`, 'INFO');
      return diagnosiFiltrate;

    } catch (error) {
      gestisciErrore(error, 'GraficoService.getDatiFiltratiPerGrafico', false); // Non mostrare all'utente, gestito dal client
      throw new Error(`Errore nel recupero dati grafico: ${error.message}`);
    }
  }
};

// Esporta il servizio per renderlo disponibile ad altri script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GraficoService;
}
