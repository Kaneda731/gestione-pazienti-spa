/**
 * @deprecated Preferisci applicaColoriAlternatiStandalone() per nuovi sviluppi
 * Funzione per applicare formattazione standard con font Comfortaa e dimensione 10
 * Wrapper ottimizzato che usa la logica avanzata di applicaColoriAlternatiStandalone
 */
function ApplicaFormattazioneStandard() {
  try {
    // Usa la versione avanzata se disponibile
    if (typeof applicaColoriAlternatiStandalone === 'function') {
      applicaColoriAlternatiStandalone();
      
      // Applica le personalizzazioni specifiche di questa funzione
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      
      if (lastRow > 0 && lastCol > 0) {
        var range = sheet.getRange(1, 1, lastRow, lastCol);
        range.setFontSize(10); // Dimensione font specifica per questa formattazione
      }
      
      console.log("✅ Formattazione standard applicata (usando versione avanzata)");
      return;
    }
  } catch (error) {
    console.warn("⚠️ Fallback alla versione legacy di ApplicaFormattazioneStandard:", error.message);
  }
  
  // Fallback alla versione originale se applicaColoriAlternatiStandalone non è disponibile
  applyLegacyFormatting();
}

/**
 * Implementazione legacy della formattazione standard
 * Mantenuta per compatibilità
 */
function applyLegacyFormatting() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Trova l'ultima riga e l'ultima colonna contenente dati REALI
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getRange(1, 1, lastRow, sheet.getLastColumn())
                     .getValues()[0]
                     .reduceRight((a, v, i) => v !== "" && a === 0 ? i + 1 : a, 0);

  if (lastCol === 0) lastCol = 1; // fallback se non trova niente
  if (lastRow === 0) return; // Se il foglio è vuoto, non fare nulla

  var range = sheet.getRange(1, 1, lastRow, lastCol);

  // Applica font e dimensione
  range.setFontFamily("Comfortaa");
  range.setFontSize(10);

  // Allineamento generale per tutte le celle (l'intestazione avrà comunque la sua formattazione specifica)
  range.setHorizontalAlignment("center");
  range.setVerticalAlignment("middle");

  // Applica bordi a tutte le celle
  range.setBorder(true, true, true, true, true, true, "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Colore alternato (zebrato) per tutto l'intervallo.
  // La prima riga (intestazione) qui riceverà lo sfondo bianco.
  var backgrounds = [];
  for (var r = 0; r < lastRow; r++) { // Itera per il numero di righe totali
    // r = 0 è la prima riga (intestazione), r = 1 è la seconda riga, ecc.
    if (r % 2 == 0) { // Le righe con indice pari (1°, 3°, 5° del foglio...)
      backgrounds.push(Array(lastCol).fill("#ffffff")); // bianco
    } else { // Le righe con indice dispari (2°, 4°, 6° del foglio...)
      backgrounds.push(Array(lastCol).fill("#DDDDDD")); // grigio chiaro come in applicaColoriAlternatiStandalone.js
    }
  }
  range.setBackgrounds(backgrounds);

  // Formattazione specifica per l'intestazione (riga 1)
  // Questo sovrascriverà lo sfondo e l'allineamento impostati in precedenza per la prima riga.
  if (lastRow >= 1) { // Assicurati che esista almeno la riga dell'intestazione
    var headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange.setBackground('#4682B4')        // Sfondo celeste (SteelBlue)
               .setFontColor('#FFFFFF')       // Testo bianco
               .setFontWeight('bold')         // Grassetto
               .setHorizontalAlignment('center') // Allineamento orizzontale centrato
               .setVerticalAlignment('middle');  // Allineamento verticale centrato (già impostato, ma per chiarezza)
  }
}