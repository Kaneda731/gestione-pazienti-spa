function CopiaIncollaSenzaTendine() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const SOURCE_SHEET_NAME = 'DatiPazienti';
  const DEST_SHEET_NAME = 'ElencoPazienti';

  const sourceSheet = ss.getSheetByName(SOURCE_SHEET_NAME);
  const destSheet = ss.getSheetByName(DEST_SHEET_NAME);

  if (!sourceSheet || !destSheet) {
    console.error("Uno dei fogli non esiste!");
    return;
  }

  // Trova l'ultima riga usata saltando la riga 1 (intestazioni)
  const sourceLastRow = sourceSheet.getLastRow();
  if (sourceLastRow <= 1) {
    console.log("Nessun dato trovato oltre l'intestazione in DatiPazienti!");
    return;
  }

  // Trova la prima riga vuota nel foglio destinazione (colonna A)
  const destValues = destSheet.getRange("A1:A").getValues();
  let destRow = destValues.findIndex(row => row[0] === "");
  if (destRow === -1) destRow = destValues.length;

  if (destRow >= 10000) {
    console.error("Impossibile trovare una riga vuota in ElencoPazienti!");
    return;
  }

  // Copia contenuti e formattazione da A a H dell'ultima riga valida
  const dataRange = sourceSheet.getRange(sourceLastRow, 1, 1, 8);
  const destRange = destSheet.getRange(destRow + 1, 1, 1, 8);

  destRange.setValues(dataRange.getValues());
  destRange.setFontStyles(dataRange.getFontStyles());
  destRange.setFontColors(dataRange.getFontColors());
  destRange.setBackgrounds(dataRange.getBackgrounds());
  destRange.setFontWeights(dataRange.getFontWeights());
  destRange.setFontSizes(dataRange.getFontSizes());
  destRange.setHorizontalAlignments(dataRange.getHorizontalAlignments());
  destRange.setVerticalAlignments(dataRange.getVerticalAlignments());

  // Applica bordi a tutte le celle dell'intervallo di destinazione (esterni e interni)
  destRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  // Imposta altezza riga (circa 1 cm ≈ 28 pixel)
  destSheet.setRowHeight(destRow + 1, 28);

  // Applica colore alternato (bianco / grigio)
  const backgroundColor = (destRow % 2 === 0) ? '#FFFFFF' : '#DDDDDD';
  destRange.setBackground(backgroundColor);

  // Cancella i dati da riga 2 fino all'ultima (ma non la riga 1)
  const numRowsToClear = sourceLastRow - 1;
  if (numRowsToClear > 0) {
    sourceSheet.getRange(2, 1, numRowsToClear, sourceSheet.getMaxColumns()).clearContent();
  }
}