/**
 * Funzione per creare un bottone che applica colori alternati al foglio attivo
 * Eseguire questa funzione una sola volta per aggiungere il bottone al foglio
 */
function creaBottoneColoriAlternati() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Creazione bottone per colori alternati',
    'Questa funzione creerà un bottone nel foglio attivo che applicherà colori alternati quando cliccato.\n\n' +
    'Vuoi procedere?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!sheet) {
    console.error("Errore: Nessun foglio attivo");
    return;
  }
  
  try {
    // Crea un disegno che funzionerà come bottone
    var drawing = sheet.insertDrawingObject(
      createButtonImage('Applica Colori Alternati')
    );
    
    // Posiziona il bottone nell'angolo in alto a destra del foglio
    var position = getButtonPosition(sheet);
    drawing.setPosition(position.row, position.column, 0, 0);
    
    // Assegna lo script al bottone
    assignScriptToDrawing(drawing, 'applicaColoriAlternatiStandalone');
    
    // Log di successo invece di alert
    console.log('Bottone creato con successo e aggiunto al foglio');
  } catch (e) {
    console.error('Errore durante la creazione del bottone:', e.toString());
  }
}

/**
 * Crea un'immagine per il bottone con il testo specificato
 * @param {String} text - Testo da visualizzare sul bottone
 * @returns {Object} - Oggetto immagine per il bottone
 */
function createButtonImage(text) {
  // Nota: In Google Apps Script, non è possibile creare immagini dinamicamente
  // Questa è una funzione segnaposto che in realtà non può essere implementata direttamente
  // In un'implementazione reale, si dovrebbe usare un'immagine predefinita o un'altra soluzione
  
  // Questo è un workaround: creiamo un oggetto fittizio che rappresenta l'immagine
  // In realtà, dovresti usare un'immagine predefinita o un altro approccio
  return {
    type: 'button',
    text: text,
    width: 150,
    height: 30
  };
}

/**
 * Determina la posizione ottimale per il bottone nel foglio
 * @param {Object} sheet - Foglio di calcolo
 * @returns {Object} - Posizione (riga e colonna) per il bottone
 */
function getButtonPosition(sheet) {
  // Posiziona il bottone nell'angolo in alto a destra
  return {
    row: 1,
    column: sheet.getLastColumn() + 2
  };
}

/**
 * Assegna uno script a un oggetto disegno (bottone)
 * @param {Object} drawing - Oggetto disegno (bottone)
 * @param {String} functionName - Nome della funzione da eseguire quando il bottone viene cliccato
 */
function assignScriptToDrawing(drawing, functionName) {
  // Nota: In Google Apps Script, non è possibile assegnare direttamente uno script a un disegno
  // Questa è una funzione segnaposto che in realtà non può essere implementata direttamente
  
  // In un'implementazione reale, si dovrebbe usare un altro approccio, come:
  // 1. Creare un menu personalizzato (già implementato in onOpen)
  // 2. Usare un'immagine con un URL che attiva uno script web app
  // 3. Usare un foglio HTML con bottoni che chiamano funzioni server-side
}

/**
 * Funzione alternativa per creare un bottone utilizzando una cella con un commento
 * Questa è un'implementazione più pratica rispetto all'uso di disegni
 */
function creaBottoneCella() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (!sheet) {
    console.error("Errore: Nessun foglio attivo");
    return;
  }
  
  try {
    // Trova una posizione adatta per il bottone
    var buttonRow = 1;
    var buttonCol = sheet.getLastColumn() + 2;
    
    // Crea una cella con testo che sembra un bottone
    var buttonCell = sheet.getRange(buttonRow, buttonCol);
    buttonCell.setValue("🎨 Applica Colori Alternati");
    
    // Formatta la cella per farla sembrare un bottone
    buttonCell.setBackground("#4682B4")
             .setFontColor("#FFFFFF")
             .setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
    
    // Imposta le dimensioni della cella
    sheet.setColumnWidth(buttonCol, 200);
    sheet.setRowHeight(buttonRow, 30);
    
    // Aggiungi un commento con istruzioni
    buttonCell.setNote(
      "Clicca su questa cella e poi esegui la funzione 'applicaColoriAlternatiStandalone' " +
      "dal menu 'Formattazione' o premendo Alt+F8 (Windows/Linux) o Option+F8 (Mac) " +
      "e selezionando la funzione."
    );
    
    // Log di successo invece di alert
    console.log('Cella-bottone creata con successo. Utilizzare il menu Formattazione per applicare i colori.');
  } catch (e) {
    console.error('Errore durante la creazione del bottone:', e.toString());
  }
}

/**
 * Funzione principale per creare un bottone
 * Questa funzione decide quale metodo utilizzare in base alle capacità dell'ambiente
 */
function creaBottone() {
  // Utilizziamo il metodo della cella, che è più affidabile
  creaBottoneCella();
}
