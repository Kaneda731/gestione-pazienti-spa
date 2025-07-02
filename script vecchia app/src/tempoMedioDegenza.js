/**
 * tempoMedioDegenza.js
 * 
 * Questo script permette di selezionare una diagnosi ed ottenere il tempo medio di degenza,
 * calcolato sulla base delle date di ingresso (colonna F) e dimissione (colonna H).
 */

/**
 * Mostra un dialog per selezionare la diagnosi e calcolare il tempo medio di degenza
 */
function calcolaTempoMedioDegenza() {
  // Ottieni il foglio "ElencoPazienti"
  const foglio = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ElencoPazienti");
  
  // Controlla se il foglio esiste
  if (!foglio) {
    mostraDialogoPersonalizzato("Errore", "Foglio 'ElencoPazienti' non trovato!", "error");
    return;
  }
  
  // Indici delle colonne (0-based)
  const COL_DIAGNOSI = 3;  // Colonna D (diagnosi)
  const COL_INGRESSO = 5;  // Colonna F (ingresso)
  const COL_DIMISSIONE = 7; // Colonna H (dimissione)
  
  // Ottieni tutte le diagnosi uniche
  const diagnosiUniche = ottieniDiagnosiUniche(foglio, COL_DIAGNOSI);
  
  // Controlla se ci sono diagnosi
  if (!diagnosiUniche || diagnosiUniche.length === 0) {
    mostraDialogoPersonalizzato("Errore", "Nessuna diagnosi trovata nel foglio!", "error");
    return;
  }
  
  // Mostra il dialog per selezionare la diagnosi
  mostraDialogoSelezioneDiagnosi(diagnosiUniche, COL_INGRESSO, COL_DIMISSIONE);
}

/**
 * Ottiene tutte le diagnosi uniche dal foglio
 * @param {Object} foglio - Il foglio di calcolo
 * @param {Number} colIndex - L'indice della colonna diagnosi (0-based)
 * @return {Array} Array di diagnosi uniche
 */
function ottieniDiagnosiUniche(foglio, colIndex) {
  const lastRow = foglio.getLastRow();
  
  // Controlla che ci siano dati oltre l'intestazione
  if (lastRow <= 1) {
    Logger.log('Nessun dato trovato nel foglio (solo intestazioni)');
    return [];
  }
  
  // Ottieni tutte le diagnosi (esclusa l'intestazione)
  const datiColonna = foglio.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();
  
  // Inizializza un Set per memorizzare le diagnosi uniche
  const diagnosiUniche = new Set();
  
  // Analizza i dati per trovare diagnosi uniche valide
  datiColonna.forEach(riga => {
    const valore = riga[0];
    
    // Gestione migliore dei valori null/undefined/vuoti
    if (valore !== null && valore !== undefined && valore !== '') {
      const diagnosi = String(valore).trim();
      
      // Non escludere valori che sono solo numeri o stringhe valide
      if (diagnosi && diagnosi.toLowerCase() !== 'null' && diagnosi.toLowerCase() !== 'undefined') {
        diagnosiUniche.add(diagnosi);
      }
    }
  });
  
  // Converti il Set in Array e ordina alfabeticamente
  return Array.from(diagnosiUniche).sort();
}

/**
 * Mostra un dialog per selezionare la diagnosi e calcolare il tempo medio di degenza
 * @param {Array} diagnosi - Array di diagnosi uniche
 * @param {Number} colIngresso - Indice della colonna ingresso (0-based)
 * @param {Number} colDimissione - Indice della colonna dimissione (0-based)
 */
function mostraDialogoSelezioneDiagnosi(diagnosi, colIngresso, colDimissione) {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        <base target="_top">
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
          ${DesignSystem.getUnifiedTempoMedioCSS('selection')}
        </style>
      </head>
      <body class="tempo-medio-selection">
        <div class="container">
          <div class="header">
            <h2><i class="material-icons">analytics</i> Tempo Medio Degenza</h2>
          </div>
          
          <div class="content">
            <!-- Selezione Diagnosi -->
            <div class="section">
              <h3 class="section-title"><i class="material-icons">medical_services</i> Seleziona Diagnosi</h3>
              <p class="section-description">Scegli una diagnosi per calcolare il tempo medio di degenza</p>
              
              <select class="diagnosi-select" id="diagnosiSelect">
                <option value="">-- Seleziona una diagnosi --</option>
                ${diagnosi.map(d => `<option value="${htmlEscape(d)}">${htmlEscape(d)}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-secondary" onclick="google.script.host.close()">
              <i class="material-icons">close</i> Annulla
            </button>
            <button class="btn btn-primary" id="calcolaButton" onclick="calcolaTempoMedio()" disabled>
              <i class="material-icons">calculate</i> Calcola
            </button>
          </div>
        </div>
        
        <script>
          // Event listener per attivare/disattivare il bottone Calcola
          document.getElementById('diagnosiSelect').addEventListener('change', function() {
            const calcolaButton = document.getElementById('calcolaButton');
            calcolaButton.disabled = !this.value;
          });
          
          // Funzione per calcolare il tempo medio
          function calcolaTempoMedio() {
            const diagnosiSelect = document.getElementById('diagnosiSelect');
            const diagnosi = diagnosiSelect.value;
            
            if (!diagnosi) {
              alert('Seleziona una diagnosi prima di calcolare.');
              return;
            }
            
            const calcolaButton = document.getElementById('calcolaButton');
            calcolaButton.disabled = true;
            calcolaButton.innerHTML = '<i class="material-icons">hourglass_empty</i> Calcolo...';
            
            google.script.run
              .withSuccessHandler(function() {
                google.script.host.close();
              })
              .withFailureHandler(function(error) {
                console.error('Errore:', error);
                alert('Errore: ' + error.message);
                calcolaButton.disabled = false;
                calcolaButton.innerHTML = '<i class="material-icons">calculate</i> Calcola';
              })
              .elaboraCalcoloTempoMedio(diagnosi);
          }
        </script>
      </body>
    </html>
  `)
    .setWidth(Math.min((typeof window !== 'undefined' && window.innerWidth) || 800, 500))
    .setHeight(Math.min((typeof window !== 'undefined' && window.innerHeight) || 720, 400))
    .setTitle('Calcolo Tempo Medio Degenza');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Tempo Medio Degenza');
}

/**
 * Elabora il calcolo del tempo medio di degenza per la diagnosi selezionata
 * @param {String} diagnosi - La diagnosi selezionata
 */
function elaboraCalcoloTempoMedio(diagnosi) {
  // Ottieni il foglio "ElencoPazienti"
  const foglio = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ElencoPazienti");
  
  // Indici delle colonne (0-based)
  const COL_DIAGNOSI = 3;  // Colonna D (diagnosi)
  const COL_INGRESSO = 5;  // Colonna F (ingresso)
  const COL_DIMISSIONE = 7; // Colonna H (dimissione)
  
  // Calcola il tempo medio di degenza
  const risultato = calcolaStatisticheDegenza(foglio, diagnosi, COL_DIAGNOSI, COL_INGRESSO, COL_DIMISSIONE);
  
  // Mostra i risultati
  mostraRisultatiTempoMedio(diagnosi, risultato);
}

/**
 * Calcola le statistiche di degenza per la diagnosi selezionata
 * @param {Object} foglio - Il foglio di calcolo
 * @param {String} diagnosi - La diagnosi selezionata
 * @param {Number} colDiagnosi - Indice della colonna diagnosi (0-based)
 * @param {Number} colIngresso - Indice della colonna ingresso (0-based)
 * @param {Number} colDimissione - Indice della colonna dimissione (0-based)
 * @return {Object} Oggetto con statistiche di degenza
 */
function calcolaStatisticheDegenza(foglio, diagnosi, colDiagnosi, colIngresso, colDimissione) {
  const lastRow = foglio.getLastRow();
  
  // Controlla che ci siano dati oltre l'intestazione
  if (lastRow <= 1) {
    Logger.log('Nessun dato trovato nel foglio (solo intestazioni)');
    return { 
      mediaDegenza: 0, 
      medianaDegenza: 0, 
      minDegenza: 0, 
      maxDegenza: 0, 
      numPazienti: 0,
      numPazientiCompletati: 0
    };
  }
  
  // Ottieni tutti i dati necessari (diagnosi, ingresso, dimissione)
  const dati = foglio.getRange(2, colDiagnosi + 1, lastRow - 1, 1).getValues();
  const dateIngresso = foglio.getRange(2, colIngresso + 1, lastRow - 1, 1).getValues();
  const dateDimissione = foglio.getRange(2, colDimissione + 1, lastRow - 1, 1).getValues();
  
  // Array per memorizzare i giorni di degenza
  const giorniDegenza = [];
  
  // Contatori
  let pazientiTotali = 0;
  let pazientiCompletati = 0;
  
  // Elabora i dati
  for (let i = 0; i < dati.length; i++) {
    const valoreDiagnosi = dati[i][0];
    
    // Verifica se la diagnosi corrisponde
    if (valoreDiagnosi === diagnosi) {
      pazientiTotali++;
      
      // Ottieni le date
      let dataIngresso = dateIngresso[i][0];
      let dataDimissione = dateDimissione[i][0];
      
      // Verifica se le date sono valide
      if (dataIngresso && dataDimissione) {
        // Converti le date se necessario
        if (!(dataIngresso instanceof Date)) {
          dataIngresso = parseDate(dataIngresso);
        }
        
        if (!(dataDimissione instanceof Date)) {
          dataDimissione = parseDate(dataDimissione);
        }
        
        // Calcola i giorni di degenza solo se entrambe le date sono valide
        if (dataIngresso instanceof Date && !isNaN(dataIngresso.getTime()) &&
            dataDimissione instanceof Date && !isNaN(dataDimissione.getTime())) {
          
          // Calcola la differenza in millisecondi e converti in giorni
          const diffTime = Math.abs(dataDimissione.getTime() - dataIngresso.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Aggiungi all'array
          giorniDegenza.push(diffDays);
          pazientiCompletati++;
        }
      }
    }
  }
  
  // Calcola le statistiche
  let mediaDegenza = 0;
  let medianaDegenza = 0;
  let minDegenza = 0;
  let maxDegenza = 0;
  
  if (giorniDegenza.length > 0) {
    // Media
    mediaDegenza = giorniDegenza.reduce((a, b) => a + b, 0) / giorniDegenza.length;
    
    // Mediana (ordina l'array e prendi il valore centrale)
    const giorniOrdinati = [...giorniDegenza].sort((a, b) => a - b);
    const mezzoIndice = Math.floor(giorniOrdinati.length / 2);
    
    if (giorniOrdinati.length % 2 === 0) {
      // Se il numero di elementi è pari, la mediana è la media dei due valori centrali
      medianaDegenza = (giorniOrdinati[mezzoIndice - 1] + giorniOrdinati[mezzoIndice]) / 2;
    } else {
      // Se il numero di elementi è dispari, la mediana è il valore centrale
      medianaDegenza = giorniOrdinati[mezzoIndice];
    }
    
    // Min e Max
    minDegenza = Math.min(...giorniDegenza);
    maxDegenza = Math.max(...giorniDegenza);
  }
  
  return {
    mediaDegenza: mediaDegenza,
    medianaDegenza: medianaDegenza,
    minDegenza: minDegenza,
    maxDegenza: maxDegenza,
    numPazienti: pazientiTotali,
    numPazientiCompletati: pazientiCompletati
  };
}

/**
 * Funzione di utilità per l'escape di caratteri HTML
 * @param {String} str - La stringa da elaborare
 * @return {String} La stringa con escape dei caratteri speciali HTML
 */
// htmlEscape ora utilizzata da utils.js per evitare duplicazioni

// parseDate ora utilizzata da utils.js per evitare duplicazioni

/**
 * Mostra i risultati del calcolo del tempo medio di degenza
 * @param {String} diagnosi - La diagnosi selezionata
 * @param {Object} risultato - Oggetto con le statistiche di degenza
 */
function mostraRisultatiTempoMedio(diagnosi, risultato) {
  // Formatta i numeri con 1 decimale
  const formatNumber = (num) => (Math.round(num * 10) / 10).toFixed(1);
  
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        <base target="_top">
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${DesignSystem.getUnifiedTempoMedioCSS('results')}
        </style>
      </head>
      <body class="tempo-medio-results">
        <div class="container">
          <div class="header">
            <h1 class="title">
              <i class="material-icons">analytics</i>
              Tempo Medio Degenza
            </h1>
            <div class="subtitle">Diagnosi: ${htmlEscape(diagnosi)}</div>
          </div>
          
          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-label">
                <i class="material-icons">access_time</i>
                Tempo Medio
              </div>
              <div class="stat-value">
                ${formatNumber(risultato.mediaDegenza)}
                <span class="stat-unit">giorni</span>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-label">
                <i class="material-icons">bar_chart</i>
                Mediana
              </div>
              <div class="stat-value">
                ${formatNumber(risultato.medianaDegenza)}
                <span class="stat-unit">giorni</span>
              </div>
            </div>
            
            <div class="stat-card secondary">
              <div class="stat-label">
                <i class="material-icons">arrow_downward</i>
                Minimo
              </div>
              <div class="stat-value">
                ${formatNumber(risultato.minDegenza)}
                <span class="stat-unit">giorni</span>
              </div>
            </div>
            
            <div class="stat-card secondary">
              <div class="stat-label">
                <i class="material-icons">arrow_upward</i>
                Massimo
              </div>
              <div class="stat-value">
                ${formatNumber(risultato.maxDegenza)}
                <span class="stat-unit">giorni</span>
              </div>
            </div>
          </div>
          
          <div class="pazienti-info">
            <i class="material-icons pazienti-icon">people</i>
            <div class="pazienti-text">
              Pazienti analizzati: ${risultato.numPazientiCompletati} su ${risultato.numPazienti} 
              ${risultato.numPazientiCompletati < risultato.numPazienti ? 
                `(${risultato.numPazienti - risultato.numPazientiCompletati} pazienti esclusi per dati mancanti)` : ''}
            </div>
          </div>
          
          <button class="action-button" onclick="google.script.host.close()">
            <i class="material-icons">done</i> Chiudi
          </button>
        </div>
      </body>
    </html>
  `)
    .setWidth(Math.min((typeof window !== 'undefined' && window.innerWidth) || 800, 500))
    .setHeight(Math.min((typeof window !== 'undefined' && window.innerHeight) || 720, 600))
    .setTitle('Risultati Tempo Medio Degenza');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Risultati Tempo Medio Degenza');
}
