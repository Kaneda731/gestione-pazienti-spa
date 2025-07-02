/**
 * GraficoTortaDinamicoInterattivo.js
 * 
 * Questo script consente all'utente di selezionare una colonna e generare
 * un grafico a torta basato sui dati della colonna selezionata.
 * Utilizza Chart.js per la visualizzazione del grafico.
 */

/**
 * Funzione unificata per creare grafici a torta con selezione colonna e filtro date opzionale
 */
function creaGraficoAvanzato() {
  // IDENTIFICATORE: DesignSystem Material Design RIPRISTINATO dal commit funzionante
  console.log('� MATERIAL DESIGN RIPRISTINATO: creaGraficoAvanzato_v3.0_RIPRISTINO_COMPLETO');
  Logger.log('� MATERIAL DESIGN RIPRISTINATO: creaGraficoAvanzato_v3.0_RIPRISTINO_COMPLETO');
  
  // IMPORTANTE: Forza il caricamento del DesignSystem all'inizio
  try {
    console.log('🔄 creaGraficoAvanzato: Pre-caricamento DesignSystem...');
    Logger.log('🔄 creaGraficoAvanzato: Pre-caricamento DesignSystem...');
    
    // Forza una chiamata al DesignSystem per assicurarci che sia caricato
    const testCSS = DesignSystem.getUnifiedGraphCSS('selection');
    console.log(`✅ creaGraficoAvanzato: DesignSystem pre-caricato (${testCSS.length} caratteri)`);
    Logger.log(`✅ creaGraficoAvanzato: DesignSystem pre-caricato (${testCSS.length} caratteri)`);
  } catch (error) {
    console.log('❌ creaGraficoAvanzato: Errore pre-caricamento DesignSystem:', error.toString());
    Logger.log('❌ creaGraficoAvanzato: Errore pre-caricamento DesignSystem: ' + error.toString());
  }
  
  // Ottieni il foglio principale
  const foglio = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);
  
  // Controlla se il foglio esiste
  if (!foglio) {
    mostraErrore("Foglio non trovato", `Foglio '${SHEET_NAMES.ELENCO_PAZIENTI}' non trovato!`);
    return;
  }
  
  // Ottieni tutte le intestazioni delle colonne
  const intestazioni = foglio.getRange(1, 1, 1, foglio.getLastColumn()).getValues()[0];
  // Usa le colonne definite in constants.js
  const COLONNE_DISPONIBILI = CONFIG.COLONNE_ANALISI;
    
    // Verifica che COLONNE_DISPONIBILI sia definito e sia un array
    if (!COLONNE_DISPONIBILI || !Array.isArray(COLONNE_DISPONIBILI)) {
      mostraErrore("Configurazione non valida", "Configurazione colonne non valida!");
      return;
    }
  
  const indiciColonne = COLONNE_DISPONIBILI.map(col => col.charCodeAt(0) - 65); // Converti in indici 0-based
  
  // Crea un array di opzioni filtrato per le colonne specificate
  const opzioni = indiciColonne.map(indice => {
    if (indice < intestazioni.length && intestazioni[indice]) {
      const letteraColonna = convertiNumeroInLettera(indice + 1);
      return `${letteraColonna}: ${intestazioni[indice]}`;
    }
    return null;
  }).filter(opzione => opzione !== null);
  
  // Verifica che ci siano opzioni valide
  if (!opzioni || opzioni.length === 0) {
    mostraErrore("Nessuna colonna valida", "Nessuna colonna valida trovata per l'analisi!");
    return;
  }
  
  // Salva le intestazioni per l'uso nelle funzioni callback
  PropertiesService.getScriptProperties().setProperty('intestazioni', JSON.stringify(intestazioni));
  
  // DEBUG: Log per tracciare l'esecuzione
  console.log('🚀 creaGraficoAvanzato: Chiamando mostraDialogoSelezioneColonnaAvanzata...');
  Logger.log('🚀 creaGraficoAvanzato: Opzioni da passare: ' + JSON.stringify(opzioni));
  
  // Mostra la finestra di selezione colonna personalizzata (solo C, D, E, G)
  mostraDialogoSelezioneColonnaAvanzata(opzioni);
}

/**
 * Analizza i dati nella colonna selezionata e conta le occorrenze di ciascun valore
 * @param {Object} foglio - Il foglio di calcolo
 * @param {Number} colIndex - L'indice della colonna da analizzare
 * @return {Object} Un oggetto con etichette e dati per il grafico
 */
function analizzaDatiColonna(foglio, colIndex) {
  const startTime = new Date();
  const lastRow = foglio.getLastRow();
  
  if (lastRow <= 1) {
    Logger.log('Nessun dato trovato nel foglio (solo intestazioni)');
    return { etichette: [], dati: [] };
  }

  const cacheKey = `data_${foglio.getName()}_${colIndex}`;
  const cachedData = CacheService.getScriptCache().get(cacheKey);
  
  if (cachedData) {
    Logger.log('Dati recuperati dalla cache');
    return JSON.parse(cachedData);
  }

  const conteggi = {};
  const batchSize = 500; // Processa 500 righe alla volta
  let righeProcessate = 0;

  for (let startRow = 2; startRow <= lastRow; startRow += batchSize) {
    const endRow = Math.min(startRow + batchSize - 1, lastRow);
    const batch = foglio.getRange(startRow, colIndex + 1, endRow - startRow + 1, 1).getValues();
    
    batch.forEach(([valore]) => {
      if (valore != null && valore !== '') {
        const key = String(valore).trim().toLowerCase();
        if (key && key !== 'null' && key !== 'undefined') {
          conteggi[key] = (conteggi[key] || 0) + 1;
        }
      }
    });
    
    righeProcessate += batch.length;
    if (righeProcessate % 2000 === 0) {
      Utilities.sleep(200); // Previene timeout
    }
  }

  const result = {
    etichette: Object.keys(conteggi),
    dati: Object.values(conteggi)
  };

  CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), 300); // Cache per 5 minuti
  
  Logger.log(`Analisi completata in ${new Date() - startTime}ms`);
  Logger.log(`Righe processate: ${righeProcessate}, Categorie uniche: ${result.etichette.length}`);
  
  return result;
}

/**
 * Analizza i dati filtrando per intervallo di date
 * @param {Object} foglio - Il foglio di calcolo
 * @param {Number} colIndex - Indice della colonna da analizzare (0-based)
 * @param {Number} colDataRicovero - Indice colonna data ricovero (0-based)
 * @param {Date} startDate - Data di inizio filtro
 * @param {Date} endDate - Data di fine filtro
 * @return {Object} Oggetto con etichette e dati
 */
function analizzaDatiColonnaConFiltroDate(foglio, colIndex, colDataRicovero, startDate, endDate) {
  const lastRow = foglio.getLastRow();
  
  // Controlla che ci siano dati oltre l'intestazione
  if (lastRow <= 1) {
    Logger.log('Nessun dato trovato nel foglio (solo intestazioni)');
    return { etichette: [], dati: [] };
  }
  
  const datiColonna = foglio.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();
  const dateRicovero = foglio.getRange(2, colDataRicovero + 1, lastRow - 1, 1).getValues();
  const conteggi = {};
  
  // Normalizza le date di filtro alla mezzanotte
  const startDateNorm = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDateNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
  
  Logger.log('Analyzing data:');
  Logger.log('Start Date (normalized): ' + startDateNorm);
  Logger.log('End Date (normalized): ' + endDateNorm);
  Logger.log('Column Index for analysis: ' + colIndex);
  Logger.log('Column Index for admission date: ' + colDataRicovero);
  Logger.log('Total rows to analyze: ' + datiColonna.length);

  let validDateCount = 0;
  let inRangeCount = 0;
  let dataCount = 0;

  for (let i = 0; i < datiColonna.length; i++) {
    let d = dateRicovero[i][0];
    
    // Gestione migliore dei valori null/undefined/vuoti
    if (d === null || d === undefined || d === '') {
      if (i < 5) {
        Logger.log('Row ' + (i + 2) + ': Empty date value');
      }
      continue;
    }
    
    // Converti la data usando la funzione parseDate migliorata
    if (!(d instanceof Date)) {
      d = parseDate(d);
    }
    
    // Normalizza la data per il confronto
    if (d instanceof Date && !isNaN(d.getTime())) {
      validDateCount++;
      const dNorm = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      
      // Debug info per le prime 5 righe
      if (i < 5) {
        Logger.log('Row ' + (i + 2) + ':');
        Logger.log('  Raw date value: ' + dateRicovero[i][0]);
        Logger.log('  Processed date: ' + d);
        Logger.log('  Normalized date: ' + dNorm);
        Logger.log('  Is in range: ' + (dNorm >= startDateNorm && dNorm <= endDateNorm));
        Logger.log('  Column value: ' + datiColonna[i][0]);
      }

      if (dNorm >= startDateNorm && dNorm <= endDateNorm) {
        inRangeCount++;
        
        // Gestione migliore dei valori della colonna da analizzare
        const rawValue = datiColonna[i][0];
        if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
          const valore = String(rawValue).trim();
          
          // Non escludere valori che sono solo numeri o stringhe valide
          if (valore && valore.toLowerCase() !== 'null' && valore.toLowerCase() !== 'undefined') {
            dataCount++;
            const valoreKey = valore.toLowerCase();
            conteggi[valoreKey] = (conteggi[valoreKey] || 0) + 1;
            
            if (i < 5 || dataCount <= 10) {
              Logger.log('Added value: "' + valore + '" -> "' + valoreKey + '" (count: ' + conteggi[valoreKey] + ')');
            }
          }
        }
      }
    } else if (i < 5) {
      Logger.log('Row ' + (i + 2) + ': Invalid date - ' + dateRicovero[i][0]);
    }
  }

  Logger.log('Summary:');
  Logger.log('  Total rows processed: ' + datiColonna.length);
  Logger.log('  Valid dates found: ' + validDateCount);
  Logger.log('  Dates in range: ' + inRangeCount);
  Logger.log('  Data values counted: ' + dataCount);
  Logger.log('Final counts:');
  Logger.log(conteggi);

  return {
    etichette: Object.keys(conteggi),
    dati: Object.values(conteggi)
  };
}

/**
 * Inserisce il grafico in un nuovo foglio
 * @param {Object} datiAnalizzati - I dati analizzati dalla colonna
 * @param {String} titolo - Il titolo del grafico
 */
function inserisciGraficoInFoglio(datiAnalizzati, titolo) {
  try {
    Logger.log('Creazione nuovo foglio per il grafico');
    Logger.log('Dati ricevuti:', datiAnalizzati);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Genera un nome univoco per il foglio
    let nomeBase = 'Grafico ' + new Date().toLocaleDateString('it-IT');
    let nomeFoglio = nomeBase;
    let counter = 1;
    
    // Evita duplicati nei nomi dei fogli
    while (ss.getSheetByName(nomeFoglio)) {
      nomeFoglio = nomeBase + ' ' + counter;
      counter++;
    }
    
    const nuovoFoglio = ss.insertSheet(nomeFoglio);
    
    // Inserisce i dati nel foglio
    nuovoFoglio.getRange(1, 1).setValue("Categoria");
    nuovoFoglio.getRange(1, 2).setValue("Valore");
    
    const numRighe = datiAnalizzati.etichette.length;
    Logger.log('Numero di righe da inserire: ' + numRighe);
    
    // Inserisce le etichette e i dati
    if (datiAnalizzati.etichette && Array.isArray(datiAnalizzati.etichette)) {
      nuovoFoglio.getRange(2, 1, numRighe, 1).setValues(datiAnalizzati.etichette.map(e => [e]));
    }
    if (datiAnalizzati.dati && Array.isArray(datiAnalizzati.dati)) {
      nuovoFoglio.getRange(2, 2, numRighe, 1).setValues(datiAnalizzati.dati.map(d => [d]));
    }
    
    // Aggiusta le colonne
    nuovoFoglio.autoResizeColumns(1, 2);
    
    // Crea il grafico
    const range = nuovoFoglio.getRange(1, 1, numRighe + 1, 2);
    const chart = nuovoFoglio.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(range)
      .setPosition(4, 4, 0, 0)
      .setOption('title', titolo)
      .setOption('width', 600)
      .setOption('height', 400)
      .setOption('pieSliceText', 'percentage')
      .setOption('legend', {position: 'right'})
      .build();
    
    nuovoFoglio.insertChart(chart);
    
    // Attiva il foglio
    nuovoFoglio.activate();
    
    Logger.log('Foglio creato con successo: ' + nomeFoglio);
    return nomeFoglio;
    
  } catch (error) {
    Logger.log('Errore durante la creazione del foglio: ' + error.toString());
    throw error;
  }
}

/**
 * Mostra una finestra di dialogo avanzata per la selezione della colonna e filtro date opzionale
 * @param {Array} opzioni - Array delle opzioni disponibili (solo C, D, E, G)
 */
function mostraDialogoSelezioneColonnaAvanzata(opzioni) {
  // DEBUG: Conferma che questa funzione viene chiamata
  console.log('📋 mostraDialogoSelezioneColonnaAvanzata: INIZIO FUNZIONE');
  Logger.log('📋 mostraDialogoSelezioneColonnaAvanzata: Ricevute opzioni: ' + JSON.stringify(opzioni));
  
  // Carica il CSS completo dal DesignSystem ripristinato
  let graphCSS;
  try {
    console.log('🎨 RIPRISTINO MATERIAL DESIGN: Caricamento CSS DesignSystem...');
    Logger.log('🎨 RIPRISTINO MATERIAL DESIGN: Caricamento CSS DesignSystem...');
    
    // Usa il DesignSystem ripristinato dal commit funzionante
    graphCSS = DesignSystem.getUnifiedGraphCSS('selection');
    
    console.log(`✅ MATERIAL DESIGN RIPRISTINATO: CSS caricato (${graphCSS.length} caratteri)`);
    Logger.log(`✅ MATERIAL DESIGN RIPRISTINATO: CSS caricato (${graphCSS.length} caratteri)`);
  } catch (error) {
    console.log('❌ ERRORE CSS: ' + error.toString());
    Logger.log('❌ ERRORE CSS: ' + error.toString());
    
    // Fallback che usa direttamente il metodo specifico per i dialoghi grafici
    try {
      graphCSS = DesignSystem.getMainCSS() + DesignSystem.getGraphDialogCSS();
      console.log('✅ FALLBACK CSS FUNZIONANTE');
    } catch (fallbackError) {
      console.log('❌ FALLBACK FALLITO: ' + fallbackError.toString());
      // CSS minimale solo in caso di emergenza
      graphCSS = `
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; }
        .container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
        .header { background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%); color: white; padding: 24px; text-align: center; }
        .content { padding: 20px; flex: 1; overflow-y: auto; }
        .option-card { border: 2px solid #dadce0; padding: 16px 12px; margin: 8px 0; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; }
        .option-card:hover { border-color: #1a73e8; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(32, 33, 36, 0.28); }
        .btn { padding: 12px 24px; margin: 8px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; }
        .btn-primary { background: #1a73e8; color: white; }
      `;
    }
  }
  
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        <base target="_top">
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
          ${graphCSS}
          </style>
      </head>
      <body class="graph-dialog">
        <div class="container">
          <div class="header">
            <h2><i class="material-icons">pie_chart</i> Crea Grafico</h2>
          </div>
          
          <div class="content">
            <!-- Selezione Colonna -->
            <div class="section">
              <h3 class="section-title"><i class="material-icons">track_changes</i> Selezione Colonna</h3>
              <p class="section-description">Scegli la colonna da analizzare per generare il grafico a torta</p>
              <div class="options-grid" id="columnOptions">
                ${opzioni && Array.isArray(opzioni) ? opzioni.map(opzione => {
                  const col = opzione.split(':')[0];
                  const name = opzione.split(':')[1].trim();
                  return `<div class="option-card" onclick="selectColumn('${col}')">
                    <div class="option-name">${htmlEscape(name)}</div>
                  </div>`;
                }).join('') : '<p>Nessuna opzione disponibile</p>'}
              </div>
            </div>

            <!-- Filtro Date -->
            <div class="section">
              <h3 class="section-title"><i class="material-icons">date_range</i> Filtro Temporale</h3>
              <p class="section-description">Applica un filtro per analizzare solo i dati in un periodo specifico</p>
              
              <div class="filter-toggle">
                <button class="filter-option selected" onclick="selectFilterOption('no')" id="filterNo">
                  <i class="material-icons">all_inclusive</i> Tutti i dati
                </button>
                <button class="filter-option" onclick="selectFilterOption('yes')" id="filterYes">
                  <i class="material-icons">date_range</i> Filtro date
                </button>
              </div>
              
              <div class="date-inputs" id="dateInputs">
                <div class="date-row">
                  <div class="date-group">
                    <label class="date-label"><i class="material-icons">event</i> Data Inizio</label>
                    <input type="date" class="date-input" id="startDate">
                  </div>
                  <div class="date-group">
                    <label class="date-label"><i class="material-icons">event_busy</i> Data Fine</label>
                    <input type="date" class="date-input" id="endDate">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-secondary" onclick="google.script.host.close()">
              <i class="material-icons">close</i> Annulla
            </button>
            <button class="btn btn-primary" id="createButton" onclick="createChart()" disabled>
              <i class="material-icons">pie_chart</i> Crea Grafico
            </button>
          </div>
        </div>
        
        <script>
          let selectedColumn = '';
          let useFilter = false;
          
          function selectColumn(column) {
            selectedColumn = column;
            
            // Aggiorna visualizzazione selezione
            document.querySelectorAll('.option-card').forEach(card => {
              card.classList.remove('selected');
            });
            event.target.closest('.option-card').classList.add('selected');
            
            updateCreateButton();
          }
          
          function selectFilterOption(option) {
            useFilter = (option === 'yes');
            
            // Aggiorna visualizzazione toggle
            document.getElementById('filterNo').classList.toggle('selected', !useFilter);
            document.getElementById('filterYes').classList.toggle('selected', useFilter);
            
            // Mostra/nascondi input date con animazione
            const dateInputs = document.getElementById('dateInputs');
            if (useFilter) {
              dateInputs.classList.add('show');
            } else {
              dateInputs.classList.remove('show');
              document.getElementById('startDate').value = '';
              document.getElementById('endDate').value = '';
            }
            
            updateCreateButton();
          }
          
          function updateCreateButton() {
            const createButton = document.getElementById('createButton');
            let canCreate = selectedColumn !== '';
            
            if (useFilter) {
              const startDate = document.getElementById('startDate').value.trim();
              const endDate = document.getElementById('endDate').value.trim();
              canCreate = canCreate && startDate && endDate;
            }
            
            createButton.disabled = !canCreate;
          }
          
          // Event listeners per le date
          document.getElementById('startDate').addEventListener('input', updateCreateButton);
          document.getElementById('endDate').addEventListener('input', updateCreateButton);
          
          function createChart() {
            if (!selectedColumn) return;
            
            const createButton = document.getElementById('createButton');
            createButton.disabled = true;
            createButton.innerHTML = '<i class="material-icons">hourglass_empty</i> Creazione...';
            
            const params = {
              column: selectedColumn,
              useFilter: useFilter
            };
            
            if (useFilter) {
              params.startDate = document.getElementById('startDate').value.trim();
              params.endDate = document.getElementById('endDate').value.trim();
              
              if (!params.startDate || !params.endDate) {
                alert('Inserisci entrambe le date per il filtro');
                createButton.disabled = false;
                createButton.innerHTML = '<i class="material-icons">pie_chart</i> Crea Grafico';
                return;
              }
            }
            
            google.script.run
              .withSuccessHandler(function() {
                google.script.host.close();
              })
              .withFailureHandler(function(error) {
                console.error('Errore:', error);
                alert('Errore: ' + error.message);
                createButton.disabled = false;
                createButton.textContent = 'Crea Grafico';
              })
              .handleGraficoAvanzato(params);
          }
        </script>
      </body>
    </html>
  `)
    .setWidth(Math.min((typeof window !== 'undefined' && window.innerWidth) || 800, 600))
    .setHeight(Math.min((typeof window !== 'undefined' && window.innerHeight) || 720, 850))
    .setTitle('Crea Grafico Avanzato');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Crea Grafico Avanzato');
}

/**
 * FUNZIONE RIMOSSA - Causava conflitto con il filtro pazienti
 * La funzione mostraDialogoSelezioneColonna() è stata rimossa per evitare
 * conflitti con la nuova implementazione del filtro pazienti.
 * Utilizzare invece mostraDialogoSelezioneColonnaAvanzata() per i grafici.
 */

// Variabili globali per gestire la selezione
var selectedColumnGlobal = '';

/**
 * Funzione callback per gestire la creazione del grafico avanzato
 * @param {Object} params - Parametri dalla finestra di dialogo
 */
function handleGraficoAvanzato(params) {
  const foglio = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);
  
  if (!foglio) {
    mostraErrore("Foglio non trovato", `Foglio '${SHEET_NAMES.ELENCO_PAZIENTI}' non trovato!`);
    return;
  }
  
  // Recupera le intestazioni salvate
  const intestazioniStr = PropertiesService.getScriptProperties().getProperty('intestazioni');
  const intestazioni = JSON.parse(intestazioniStr);
  
  const selectedColumn = params.column.toUpperCase();
  
  // Converte la lettera della colonna in un indice numerico
  const colIndex = selectedColumn.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
  
  // Verifica che la colonna sia tra quelle consentite (C, D, E, G)
  const COLONNE_CONSENTITE = CONFIG.COLONNE_ANALISI;
  if (!COLONNE_CONSENTITE.includes(selectedColumn)) {
    mostraErrore("Colonna non consentita", "Colonna non consentita! Seleziona solo tra le colonne disponibili.");
    return;
  }
  
  // Ottieni il titolo della colonna dalla prima riga
  let columnTitle = intestazioni[colIndex] || `Dati colonna ${selectedColumn}`;
  
  let datiAnalizzati;
  let titolo = columnTitle;
  
  if (params.useFilter) {
    // Applica filtro date
    const startDate = parseDate(params.startDate);
    const endDate = parseDate(params.endDate);
    
    if (!startDate || !endDate) {
      mostraErrore('Formato date non valido', 'Formato date non valido. Usa GG/MM/AAAA.');
      return;
    }
    
    if (endDate < startDate) {
      mostraErrore('Date non valide', 'La data di fine deve essere successiva a quella di inizio.');
      return;
    }
    
    // Colonna F (1-based) contenente la data di ricovero  
    const COL_DATA_RICOVERO = COLUMNS.DATA_INGRESSO;
    datiAnalizzati = analizzaDatiColonnaConFiltroDate(foglio, colIndex, COL_DATA_RICOVERO - 1, startDate, endDate);
    titolo = `${columnTitle} (${formattaData(startDate)} - ${formattaData(endDate)})`;
    
    if (datiAnalizzati.etichette.length === 0) {
      mostraAvviso('Nessun dato', 'Nessun dato trovato nell\'intervallo di date specificato.');
      return;
    }
  } else {
    // Nessun filtro, analizza tutti i dati
    datiAnalizzati = analizzaDatiColonna(foglio, colIndex);
    
    if (datiAnalizzati.etichette.length === 0) {
      mostraAvviso('Nessun dato', 'Nessun dato trovato nella colonna selezionata.');
      return;
    }
  }
  
  // Pulisci le proprietà
  PropertiesService.getScriptProperties().deleteProperty('intestazioni');
  
  // Crea il grafico
  creaGrafico(datiAnalizzati, titolo);
}

/**
 * Crea il grafico a torta utilizzando Chart.js
 * @param {Object} datiAnalizzati - I dati analizzati dalla colonna
 * @param {String} titolo - Il titolo del grafico
 */
function creaGrafico(datiAnalizzati, titolo) {
  // Verifica che ci siano dati da visualizzare
  if (!datiAnalizzati || !datiAnalizzati.etichette || datiAnalizzati.etichette.length === 0) {
    mostraAvviso('Nessun dato', 'Nessun dato da visualizzare nel grafico.');
    return;
  }

  // Costanti per il calcolo responsive (allineate agli altri dialoghi)
  const MARGINE_GOOGLE_SHEETS = 120;  // Header + footer + padding
  const ALTEZZA_CONTROLLI = 100;      // Spazio per i pulsanti in fondo
  const MARGINE_SICUREZZA = 20;       // Margine aggiuntivo
  const LARGHEZZA_MASSIMA = 900;      // Larghezza massima del dialogo
  const ALTEZZA_MINIMA_GRAFICO = 400; // Altezza minima per usabilità grafico

  // Calcolo viewport disponibile
  // Nota: window.innerHeight e window.innerWidth non sono direttamente disponibili in HtmlService server-side.
  // Questi valori verranno usati client-side se disponibili, altrimenti verranno usati dei default.
  // I valori di default sono scelti per essere ragionevoli.
  const viewportHeight = 600; // Valore di default
  const viewportWidth = 800;  // Valore di default

  // Dimensioni ottimizzate
  const altezzaDisponibilePerGrafico = viewportHeight - MARGINE_GOOGLE_SHEETS - ALTEZZA_CONTROLLI - MARGINE_SICUREZZA;
  const larghezzaDialogo = Math.min(viewportWidth - 40, LARGHEZZA_MASSIMA);
  const altezzaGrafico = Math.max(altezzaDisponibilePerGrafico, ALTEZZA_MINIMA_GRAFICO);
  
  // Crea un foglio HTML per il grafico
  const htmlOutput = HtmlService
    .createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_top">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
          ${DesignSystem.getUnifiedGraphCSS_v2('display')}
          </style>
        </head>
        <body class="chart-display">
          <div class="container">
            <div class="chart-container">
              <canvas id="myChart"></canvas>
            </div>
            <div id="message"></div>
            <div class="controls">
              <button class="btn btn-secondary" onclick="downloadChart()">
                <i class="material-icons">download</i> Scarica Immagine
              </button>
              <button class="btn btn-primary" onclick="insertInSheet()">
                <i class="material-icons">insert_chart</i> Inserisci in Foglio
              </button>
              <button class="btn btn-secondary" onclick="google.script.host.close()">
                <i class="material-icons">close</i> Chiudi
              </button>
            </div>
          </div>
          
          <script>
            // Dati per il grafico
            const etichette = ${JSON.stringify(datiAnalizzati.etichette)};
            const dati = ${JSON.stringify(datiAnalizzati.dati)};
            
            // Palette di colori predefinita per il tema
            function generaColoriTema(n) {
              const coloriBase = [
                '#1A73E8', '#34A853', '#FBBC04', '#EA4335', '#9C27B0',
                '#FF9800', '#795548', '#607D8B', '#E91E63', '#009688'
              ];
              
              const colori = [];
              for (let i = 0; i < n; i++) {
                if (i < coloriBase.length) {
                  colori.push(coloriBase[i]);
                } else {
                  // Genera colori casuali per elementi aggiuntivi
                  const hue = (i * 137.508) % 360; // Golden angle
                  colori.push('hsl(' + hue + ', 70%, 60%)');
                }
              }
              return colori;
            }
            
            // Mostra un messaggio con animazione
            function showMessage(text, isError = false) {
              const messageEl = document.getElementById('message');
              messageEl.className = isError ? 'message-error' : 'message-success';
              messageEl.textContent = text;
              messageEl.style.opacity = '1';
              
              setTimeout(() => {
                messageEl.style.opacity = '0';
                setTimeout(() => {
                  messageEl.textContent = '';
                  messageEl.className = '';
                }, 300);
              }, 3000);
            }
            
            // Variabile per tenere traccia dell'istanza del grafico
            let myChart = null;
            
            // Funzione per distruggere il grafico esistente se presente
            function destroyExistingChart() {
              // Ottieni tutti i canvas nel documento
              const allCanvases = document.getElementsByTagName('canvas');
              for (let i = 0; i < allCanvases.length; i++) {
                const canvas = allCanvases[i];
                // Controlla se il canvas ha un'istanza di Chart associata
                const chartInstance = Chart.getChart(canvas);
                if (chartInstance) {
                  // Distruggi l'istanza esistente
                  chartInstance.destroy();
                  console.log('Istanza grafico esistente distrutta');
                }
              }
            }
            
            // Assicurati che non ci siano istanze precedenti attive
            destroyExistingChart();
            
            // Crea il grafico con stile migliorato
            const ctx = document.getElementById('myChart').getContext('2d');
            myChart = new Chart(ctx, {
              type: 'pie',
              data: {
                labels: etichette,
                datasets: [{
                  data: dati,
                  backgroundColor: generaColoriTema(etichette.length),
                  borderWidth: 2,
                  borderColor: getComputedStyle(document.documentElement).getPropertyValue('--dialog-bg'),
                  hoverBorderWidth: 3,
                  hoverOffset: 4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  animateRotate: true,
                  animateScale: true,
                  duration: 1000,
                  easing: 'easeOutQuart'
                },
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      padding: 20,
                      font: {
                        size: 12
                      },
                      color: getComputedStyle(document.documentElement).getPropertyValue('--dialog-text')
                    }
                  },
                  title: {
                    display: true,
                    text: '${htmlEscape(titolo)}',
                    font: {
                      size: 16,
                      weight: '500'
                    },
                    color: getComputedStyle(document.documentElement).getPropertyValue('--dialog-text'),
                    padding: {
                      top: 10,
                      bottom: 20
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const dataArray = context.dataset.data;
                        const total = dataArray && Array.isArray(dataArray) ? dataArray.reduce((a, b) => a + b, 0) : 0;
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return label + ': ' + value + ' (' + percentage + '%)';
                      }
                    }
                  }
                }
              }
            });
            
            // Funzione per scaricare il grafico come immagine
            function downloadChart() {
              try {
                const button = event.target;
                button.disabled = true;
                button.innerHTML = '<i class="material-icons">hourglass_empty</i> Download...';
                
                setTimeout(() => {
                  const canvas = document.getElementById('myChart');
                  const image = canvas.toDataURL('image/png');
                  const link = document.createElement('a');
                  link.download = 'grafico_${titolo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png';
                  link.href = image;
                  link.click();
                  
                  button.disabled = false;
                  button.innerHTML = '<i class="material-icons">download</i> Scarica Immagine';
                  showMessage('<i class="material-icons">check_circle</i> Immagine scaricata con successo');
                }, 500);
                
              } catch (error) {
                button.disabled = false;
                button.innerHTML = '<i class="material-icons">download</i> Scarica Immagine';
                showMessage('<i class="material-icons">error</i> Errore durante il download: ' + error.message, true);
              }
            }

            // Funzione per inserire il grafico in un nuovo foglio
            function insertInSheet() {
              const button = event.target;
              button.disabled = true;
              button.innerHTML = '<i class="material-icons">hourglass_empty</i> Creazione...';
              
              google.script.run
                .withSuccessHandler(function(sheetName) {
                  button.disabled = false;
                  button.innerHTML = '<i class="material-icons">insert_chart</i> Inserisci in Foglio';
                  showMessage('<i class="material-icons">check_circle</i> Grafico inserito nel foglio: ' + sheetName);
                })
                .withFailureHandler(function(error) {
                  button.disabled = false;
                  button.innerHTML = '<i class="material-icons">insert_chart</i> Inserisci in Foglio';
                  showMessage('<i class="material-icons">error</i> Errore: ' + error.message, true);
                })
                .inserisciGraficoInFoglio(
                  { etichette: etichette, dati: dati },
                  '${titolo}'
                );
            }
          </script>
        </body>      
      </html>
    `)
    // Applica le dimensioni calcolate per il dialogo
    // Usiamo i valori calcolati per larghezzaDialogo e altezzaGrafico + ALTEZZA_CONTROLLI + MARGINE_SICUREZZA
    // per l'altezza totale del dialogo.
    // Il client-side (JavaScript nel dialogo HTML) non può ridimensionare la finestra modale di Apps Script,
    // quindi dobbiamo impostare le dimensioni qui.
    // Usiamo i valori di default se window non è disponibile, ma il CSS flex farà il grosso del lavoro.
    .setWidth(larghezzaDialogo)
    .setHeight(altezzaGrafico + ALTEZZA_CONTROLLI + MARGINE_GOOGLE_SHEETS); // Altezza totale stimata del dialogo

  
  // Mostra il grafico in una finestra di dialogo modale
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Grafico a Torta - ' + titolo);
}
