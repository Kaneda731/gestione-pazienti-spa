/**
 * @deprecated Usa applicaColoriAlternatiStandalone() per funzionalità complete
 * Funzione per applicare colori alternati all'area dati di un foglio
 * @param {Object} sheet - Foglio di calcolo a cui applicare i colori alternati
 */
function applicaColoriAlternati(sheet) {
  if (!sheet) {
    throw new Error("Foglio non specificato");
  }
  
  // Ottieni l'ultima riga e colonna con dati
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow <= 0 || lastCol <= 0) {
    return; // Nessun dato da formattare
  }
  
  // Formatta l'intestazione (riga 1) con sfondo blu e testo bianco
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground('#4682B4')
             .setFontColor('#FFFFFF')
             .setFontWeight('bold')
             .setHorizontalAlignment('center')
             .setVerticalAlignment('middle');
  
  // Applica colori alternati alle righe dati (dalla riga 2 in poi)
  for (var i = 2; i <= lastRow; i++) {
    var rowIndex = i - 2; // Indice 0-based (escludendo l'intestazione)
    // Calcola il colore alternato direttamente
    var color = (rowIndex % 2 === 0) ? '#DDDDDD' : '#FFFFFF';
    
    // Applica il colore alla riga
    var rowRange = sheet.getRange(i, 1, 1, lastCol);
    rowRange.setBackground(color)
            .setFontColor('#000000')
            .setHorizontalAlignment('center')
            .setVerticalAlignment('middle');
  }
  
  // Applica bordi a tutto il range dati
  var dataRange = sheet.getRange(1, 1, lastRow, lastCol);
  dataRange.setBorder(true, true, true, true, true, true);
  
  // Ottimizza la larghezza delle colonne
  for (var j = 1; j <= lastCol; j++) {
    sheet.autoResizeColumn(j);
  }
}

/**
 * @deprecated Usa applicaColoriAlternatiStandalone() direttamente
 * Wrapper per richiamare applicaColoriAlternati sul foglio attivo.
 */
function applicaColoriAlternatiMacro() {
  // Redirigi alla versione completa standalone
  if (typeof applicaColoriAlternatiStandalone === 'function') {
    applicaColoriAlternatiStandalone();
  } else {
    // Fallback alla versione semplificata
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    applicaColoriAlternati(sheet);
  }
}
