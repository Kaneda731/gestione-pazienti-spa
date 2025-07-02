/**
 * Modulo per la gestione del grafico delle diagnosi
 * Fornisce dati aggregati per la visualizzazione grafica
 * 
 * @author ScriptPazienti
 * @version 1.2.0
 * 
 * === DIPENDENZE ===
 * @requires GraficoService.js - GraficoService
 * @requires filtriCore.js - FiltriService
 * @requires constants.js - SHEET_NAMES
 * @requires utils.js - logAvanzato
 * @requires errorHandler.js - gestisciErrore
 */

/**
 * Ottiene i dati delle diagnosi per il grafico, applicando i filtri specificati.
 * @param {object} filtri Oggetto contenente i filtri da applicare.
 * @param {string} filtri.reparto Filtro per reparto di appartenenza.
 * @param {string} filtri.livello Filtro per livello di assistenza.
 * @param {string} filtri.dataDal Filtro per data di ricovero (inizio).
 * @param {string} filtri.dataAl Filtro per data di ricovero (fine).
 * @returns {Array} Array delle diagnosi dei pazienti filtrate.
 */
function getDatiGraficoDiagnosi(filtri = {}) {
  try {
    logAvanzato('Chiamata a getDatiGraficoDiagnosi con filtri:', 'INFO', filtri);
    // Utilizza il nuovo GraficoService per ottenere i dati filtrati
    const diagnosi = GraficoService.getDatiFiltratiPerGrafico(filtri);
    logAvanzato(`Restituite ${diagnosi.length} diagnosi filtrate per il grafico.`, 'INFO');
    return diagnosi;
  } catch (error) {
    gestisciErrore(error, 'getDatiGraficoDiagnosi', false); // L'errore verrà gestito dal withFailureHandler del client
    throw new Error(`Errore nel caricamento dati grafico: ${error.message}`);
  }
}

/**
 * Ottiene le opzioni uniche per i filtri (reparti e livelli) dal foglio, utilizzando la cache.
 * Utilizza FiltriService.getValoriUnici per coerenza.
 * @returns {object} Oggetto con due array: `reparti` e `livelli`.
 */
function getOpzioniFiltri() {
  try {
    logAvanzato('Inizio recupero opzioni filtri (con cache).', 'INFO');

    const cache = CacheService.getScriptCache(); // Ottieni la cache dello script
    const CACHE_KEY = 'opzioniFiltriGrafico'; // Chiave univoca per i dati nella cache
    const CACHE_EXPIRATION_SECONDS = 3600; // 1 ora (60 * 60 secondi)

    // 1. Prova a recuperare i dati dalla cache
    let cachedOptions = cache.get(CACHE_KEY);

    if (cachedOptions != null) {
      logAvanzato('Opzioni filtri recuperate dalla cache.', 'INFO');
      return JSON.parse(cachedOptions); // I dati dalla cache sono stringhe, quindi li parsiamo
    }

    logAvanzato('Opzioni filtri non trovate nella cache, recupero dal foglio.', 'INFO');

    // 2. Se non sono nella cache, recupera i dati dal foglio (logica esistente)
    const foglioResult = getFoglioSicuro(SHEET_NAMES.ELENCO_PAZIENTI);
    if (!foglioResult.successo) {
      throw new Error(foglioResult.errore);
    }
    const foglio = foglioResult.foglio;
    const header = foglio.getRange(1, 1, 1, foglio.getLastColumn()).getValues()[0];

    const colIndexReparto = header.indexOf('Tipo di ricovero');
    const colIndexLivello = header.indexOf('IDA');

    if (colIndexReparto === -1) throw new Error("Colonna 'Tipo di ricovero' non trovata.");
    if (colIndexLivello === -1) throw new Error("Colonna 'IDA' non trovata.");

    const reparti = FiltriService.getValoriUnici(colIndexReparto);
    const livelli = FiltriService.getValoriUnici(colIndexLivello);

    const opzioni = {
      reparti: reparti,
      livelli: livelli
    };

    // 3. Memorizza i dati nella cache per un'ora
    // I dati devono essere stringhe, quindi usiamo JSON.stringify
    cache.put(CACHE_KEY, JSON.stringify(opzioni), CACHE_EXPIRATION_SECONDS);

    logAvanzato('Opzioni filtri caricate con successo e memorizzate nella cache.', 'INFO', opzioni);
    return opzioni;

  } catch (error) {
    gestisciErrore(error, 'getOpzioniFiltri', false); // L'errore verrà gestito dal withFailureHandler del client
    throw new Error(`Errore nel caricamento delle opzioni di filtro: ${error.message}`);
  }
}

/**
 * Ottiene statistiche dettagliate sulle diagnosi (funzione non usata dal grafico, ma mantenuta per completezza)
 * @returns {Object} Oggetto con statistiche aggregate
 */
function getStatisticheDiagnosi() {
  try {
    logAvanzato('Inizio recupero statistiche diagnosi.', 'INFO');
    // Questa funzione potrebbe essere aggiornata per usare GraficoService.getDatiFiltratiPerGrafico
    // se si volessero statistiche su dati filtrati.
    const diagnosi = GraficoService.getDatiFiltratiPerGrafico({}); // Ottiene tutte le diagnosi non filtrate
    
    if (diagnosi.length === 0) {
      return {
        totalePazienti: 0,
        diagnosiUniche: 0,
        distribuzioneCompleta: {},
        top5Diagnosi: []
      };
    }
    
    // Conta le occorrenze
    const conteggio = {};
    diagnosi.forEach(d => {
      conteggio[d] = (conteggio[d] || 0) + 1;
    });
    
    // Ordina per frequenza
    const diagnosiOrdinate = Object.entries(conteggio)
      .sort(([,a], [,b]) => b - a)
      .map(([diagnosi, count]) => ({ diagnosi, count, percentuale: (count / diagnosi.length * 100).toFixed(1) }));
    
    const statistiche = {
      totalePazienti: diagnosi.length,
      diagnosiUniche: Object.keys(conteggio).length,
      distribuzioneCompleta: conteggio,
      top5Diagnosi: diagnosiOrdinate.slice(0, 5),
      diagnosiRare: diagnosiOrdinate.filter(d => d.count === 1).length
    };
    
    logAvanzato('Statistiche diagnosi generate.', 'INFO', statistiche);
    return statistiche;
    
  } catch (error) {
    gestisciErrore(error, 'getStatisticheDiagnosi', false);
    throw error;
  }
}

/**
 * Test della funzionalità grafico diagnosi (da aggiornare per riflettere i nuovi servizi)
 */
function testGraficoDiagnosi() {
  logAvanzato('Esecuzione testGraficoDiagnosi (da aggiornare).', 'WARN');
  // Questo test andrebbe aggiornato per testare le nuove funzioni di GraficoService
  return true;
}

/**
 * Utility per aggiornare automaticamente il grafico quando vengono aggiunti nuovi pazienti
 * Può essere chiamata dopo salvaNuovoPaziente()
 */
function notificaAggiornamentoGrafico() {
  logAvanzato('Notifica: dati diagnosi aggiornati, considerare refresh del grafico.', 'INFO');
}

