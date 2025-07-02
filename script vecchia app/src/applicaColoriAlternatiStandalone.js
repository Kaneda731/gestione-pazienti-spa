/**
 * Funzione standalone per applicare colori alternati all'area dati del foglio attivo
 * Può essere assegnata a un pulsante o a un menu personalizzato
 */
function applicaColoriAlternatiStandalone() {
  // Valore da aggiungere alla larghezza auto-calcolata delle colonne (in pixel)
  const LARGHEZZA_COLONNA_EXTRA = 25; // Aumentato per dare più spazio

  // Ottieni il foglio attivo
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!sheet) {
    // Rimosso alert di errore - solo log
    console.error("Errore: Nessun foglio attivo");
    return;
  }
  
  // Ottieni l'ultima riga e colonna con dati
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow <= 0 || lastCol <= 0) {
    // Rimosso alert - solo log silenzioso
    console.log("Nessun dato da formattare nel foglio: " + sheet.getName());
    return; // Nessun dato da formattare
  }
  
  // Formatta l'intestazione (riga 1) con sfondo blu e testo bianco
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground('#4682B4')
             .setFontFamily("Comfortaa") // Imposta il font Comfortaa per l'intestazione
             .setFontColor('#FFFFFF')
             .setFontWeight('bold')
             .setHorizontalAlignment('center')
             .setVerticalAlignment('middle');
  
  // Inizializza la cache di formattazione
  inizializzaCacheFormattazione(sheet, lastRow + 10); // +10 per margine di sicurezza
  
  // Applica colori alternati alle righe dati (dalla riga 2 in poi)
  for (var i = 2; i <= lastRow; i++) {
    var rowIndex = i - 2; // Indice 0-based per getAlternatingRowColor (escludendo l'intestazione)
    var color = getAlternatingRowColor(rowIndex, true, '#DDDDDD', '#FFFFFF');
    
    // Applica il colore alla riga
    var rowRange = sheet.getRange(i, 1, 1, lastCol);
    rowRange.setBackground(color)
            .setFontFamily("Comfortaa") // Imposta il font Comfortaa per le righe dati
            .setFontColor('#000000')
            .setHorizontalAlignment('center')
            .setVerticalAlignment('middle');
  }
  
  // Applica bordi a tutto il range dati
  var dataRange = sheet.getRange(1, 1, lastRow, lastCol);
  dataRange.setBorder(true, true, true, true, true, true);
  
  // Ottimizza la larghezza delle colonne
  for (var j = 1; j <= lastCol; j++) {
    sheet.autoResizeColumn(j); // Calcola la larghezza ottimale
    SpreadsheetApp.flush(); // Forza l'applicazione delle modifiche per una lettura più accurata
    var larghezzaAttuale = sheet.getColumnWidth(j); // Ottieni la larghezza calcolata
    sheet.setColumnWidth(j, larghezzaAttuale + LARGHEZZA_COLONNA_EXTRA); // Imposta la nuova larghezza
  }
  
  // Log silenzioso invece di alert
  console.log("Formattazione applicata con successo al foglio: " + sheet.getName());
}

// Variabili per la cache di formattazionelet cacheFormattazione = {};
let nomeUltimoFoglio = '';
let ultimoDimensionamentoCache = 0;

/**
 * Inizializza la cache di formattazione per un foglio
 * @param {Object} sheet - Foglio di calcolo
 * @param {Number} maxRows - Numero massimo di righe da memorizzare in cache
 */
function inizializzaCacheFormattazione(sheet, maxRows) {
  if (nomeUltimoFoglio !== sheet.getName()) {
    nomeUltimoFoglio = sheet.getName();
    cacheFormattazione = {righe: Array(maxRows).fill(false), colori: Array(maxRows).fill('')};
    ultimoDimensionamentoCache = maxRows;
  } else if (maxRows > ultimoDimensionamentoCache) {
    cacheFormattazione.righe.length = maxRows;
    cacheFormattazione.colori.length = maxRows;
    ultimoDimensionamentoCache = maxRows;
  }
}

/**
 * Restituisce il colore alternato per una riga
 * @param {Number} row - Indice della riga (0-based)
 * @param {Boolean} usaCache - Se utilizzare la cache
 * @param {String} colorePari - Colore per le righe pari
 * @param {String} coloreDispari - Colore per le righe dispari
 * @returns {String} - Codice colore HTML
 */
function getAlternatingRowColor(row, usaCache = true, colorePari = '#F0F0F0', coloreDispari = '#FFFFFF') {
  if (usaCache && cacheFormattazione.colori && cacheFormattazione.colori[row]) {
    return cacheFormattazione.colori[row];
  }
  var colore = (row % 2 === 0) ? colorePari : coloreDispari;
  if (usaCache && cacheFormattazione.colori) {
    cacheFormattazione.colori[row] = colore;
  }
  return colore;
}

/**
 * Funzione per creare un menu personalizzato che include la funzione di colorazione alternata.
 * Può essere richiamata manualmente per aggiungere il menu "Formattazione".
 */
function addFormattazioneMenu() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Formattazione')
    .addItem('Applica Colori Alternati', 'applicaColoriAlternatiStandalone')
    .addToUi();
}
