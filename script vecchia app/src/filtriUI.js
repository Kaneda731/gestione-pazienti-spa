/**
 * FILTRI UI - Interfaccia utente per gestione filtri pazienti
 * Modulo estratto da aggiornaFoglioFiltroSuAttivazione.js
 * 
 * === RESPONSABILITÀ ===
 * - Dialoghi di selezione colonna
 * - Dialoghi di selezione valore
 * - Interfacce di successo/errore
 * - Gestione interazione utente
 * 
 * === DIPENDENZE ===
 * @requires designSystem.js - DesignSystem
 * @requires filtriCore.js - FiltriService
 * @requires constants.js - COLUMNS, CONFIG
 * @requires utils.js - htmlEscape, logAvanzato
 * @requires errorHandler.js - mostraSuccesso, mostraErrore
 */

/**
 * Funzione per ottenere le colonne disponibili per il filtro con intestazioni dinamiche
 * Solo le colonne C, D, E, G sono filtrabili come richiesto
 * @returns {Array} Array di oggetti configurazione colonne
 */
function getColonneFiltro() {
  try {
    // Legge le intestazioni reali dal foglio
    const foglio = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);
    if (!foglio) {
      throw new Error('Foglio ElencoPazienti non trovato');
    }
    
    const intestazioni = foglio.getRange(1, 1, 1, Math.max(7, foglio.getLastColumn())).getValues()[0];
    
    return [
      { 
        indice: 2, 
        nome: intestazioni[2] || 'Tipo di ricovero', 
        lettera: 'C', 
        descrizione: `Filtra pazienti per ${intestazioni[2] || 'tipo di ricovero'}` 
      },
      { 
        indice: 3, 
        nome: intestazioni[3] || 'Diagnosi', 
        lettera: 'D', 
        descrizione: `Filtra pazienti per ${intestazioni[3] || 'diagnosi'}` 
      },
      { 
        indice: 4, 
        nome: intestazioni[4] || 'Reparto', 
        lettera: 'E', 
        descrizione: `Filtra pazienti per ${intestazioni[4] || 'reparto'}` 
      },
      { 
        indice: 6, 
        nome: intestazioni[6] || 'Stato', 
        lettera: 'G', 
        descrizione: `Filtra pazienti per ${intestazioni[6] || 'stato'}` 
      }
    ];
  } catch (error) {
    // Fallback con nomi predefiniti se c'è un errore
    logAvanzato('Errore lettura intestazioni, usando fallback', 'WARN', { error: error.message });
    return [
      { indice: 2, nome: 'Tipo di ricovero', lettera: 'C', descrizione: 'Filtra pazienti per tipo di ricovero' },
      { indice: 3, nome: 'Diagnosi', lettera: 'D', descrizione: 'Filtra pazienti per diagnosi' },
      { indice: 4, nome: 'Reparto', lettera: 'E', descrizione: 'Filtra pazienti per reparto' },
      { indice: 6, nome: 'Stato', lettera: 'G', descrizione: 'Filtra pazienti per stato' }
    ];
  }
}

/**
 * Servizio UI per gestione interfacce filtri
 */
const FiltriUI = {

  /**
   * Mostra dialogo per selezione colonna da filtrare
   * Uniforme allo stile di GraficoTortaDinamicoInterattivo.js
   * @returns {void}
   */
  mostraDialogoSelezioneColonna() {
    try {
      // Ottiene le colonne dinamicamente ogni volta che viene chiamato
      const colonneFiltro = getColonneFiltro();
      
      // Crea le opzioni nello stesso formato del grafico
      const opzioni = colonneFiltro.map(col => `${col.lettera}: ${col.nome}`);
      
      // Crea HTML identico al grafico
      const html = HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
          <head>
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <base target="_top">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
              :root {
                --dialog-bg: #FFFFFF;
                --dialog-text: #202124;
                --primary-btn-bg: #1A73E8;
                --primary-btn-text: #FFFFFF;
                --secondary-btn-bg: #F8F9FA;
                --secondary-btn-text: #202124;
                --border-color: #DADCE0;
                --success: #34a853;
                --error: #EA4335;
                --warning: #FBBC04;
                --shadow-1dp: 0 1px 1px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
                --shadow-2dp: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
                --shadow-4dp: 0 4px 6px rgba(32, 33, 36, 0.28);
                --shadow-8dp: 0 8px 10px 1px rgba(60,64,67,.3), 0 3px 14px 2px rgba(60,64,67,.15);
              }

              .material-icons {
                font-family: 'Material Icons';
                font-weight: normal;
                font-style: normal;
                font-size: 18px;
                line-height: 1;
                letter-spacing: normal;
                text-transform: none;
                display: inline-block;
                white-space: nowrap;
                word-wrap: normal;
                direction: ltr;
                vertical-align: middle;
                margin-right: 8px;
                color: #5f6368;
                -webkit-font-feature-settings: 'liga';
                -webkit-font-smoothing: antialiased;
              }

              @media (prefers-color-scheme: dark) {
                :root {
                  --dialog-bg: #2B2B2B;
                  --dialog-text: #E8EAED;
                  --primary-btn-bg: #8AB4F8;
                  --primary-btn-text: #202124;
                  --secondary-btn-bg: #3C4043;
                  --secondary-btn-text: #E8EAED;
                  --border-color: #3C4043;
                  --success: #81C995;
                  --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                }
              }

              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }

              body {
                font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: var(--dialog-bg);
                color: var(--dialog-text);
                margin: 0;
                padding: 0;
                overflow: hidden;
                height: 100vh;
                width: 100vw;
              }

              .container {
                width: 100vw;
                height: 100vh;
                background-color: var(--dialog-bg);
                display: flex;
                flex-direction: column;
                animation: slideUp 0.4s ease-out;
              }

              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              .header {
                background: linear-gradient(135deg, var(--primary-btn-bg) 0%, #4285f4 100%);
                color: white;
                padding: 24px;
                text-align: center;
              }

              .header h2 {
                font-size: 1.5rem;
                font-weight: 500;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
              }

              .content {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
              }

              .section {
                margin-bottom: 24px;
              }

              .section:last-of-type {
                margin-bottom: 0;
              }

              .section-title {
                font-size: 1.1rem;
                font-weight: 500;
                color: var(--dialog-text);
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .section-description {
                font-size: 0.9rem;
                color: var(--dialog-text);
                opacity: 0.8;
                margin-bottom: 16px;
                line-height: 1.4;
              }

              .options-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-bottom: 16px;
              }

              .option-card {
                padding: 16px 12px;
                border: 2px solid var(--border-color);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                background-color: var(--dialog-bg);
                position: relative;
                overflow: hidden;
              }

              .option-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(26, 115, 232, 0.1), transparent);
                transition: left 0.5s;
              }

              .option-card:hover::before {
                left: 100%;
              }

              .option-card:hover {
                border-color: var(--primary-btn-bg);
                transform: translateY(-2px);
                box-shadow: var(--shadow-4dp);
              }

              .option-card.selected {
                border-color: var(--primary-btn-bg);
                background: linear-gradient(135deg, #e8f0fe 0%, #f1f8ff 100%);
                color: var(--primary-btn-bg);
                transform: translateY(-2px);
                box-shadow: var(--shadow-4dp);
              }

              .option-card .option-name {
                font-weight: 600;
                font-size: 0.95rem;
                position: relative;
                z-index: 1;
              }

              .actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 20px;
                background-color: var(--secondary-btn-bg);
                border-top: 1px solid var(--border-color);
                flex-shrink: 0;
              }

              .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
              }

              .btn:active::before {
                width: 300px;
                height: 300px;
              }

              .btn-secondary {
                background-color: var(--secondary-btn-bg);
                color: var(--secondary-btn-text);
                border: 1px solid var(--border-color);
              }

              .btn-secondary:hover {
                transform: translateY(-1px);
              }

              .btn-primary {
                background-color: var(--primary-btn-bg);
                color: var(--primary-btn-text);
              }

              .btn-primary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(26, 115, 232, 0.4);
              }

              .btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
              }

              @media (max-width: 480px) {
                .options-grid {
                  grid-template-columns: 1fr;
                }
                
                .actions {
                  flex-direction: column;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2><i class="material-icons">filter_list</i> Filtro Pazienti</h2>
              </div>
              
              <div class="content">
                <!-- Selezione Colonna -->
                <div class="section">
                  <h3 class="section-title"><i class="material-icons">track_changes</i> Selezione Colonna</h3>
                  <p class="section-description">Scegli la colonna da utilizzare per filtrare l'elenco pazienti</p>
                  <div class="options-grid" id="columnOptions">
                    ${opzioni && Array.isArray(opzioni) ? opzioni.map((opzione, index) => {
                      const col = opzione.split(':')[0];
                      const name = opzione.split(':')[1].trim();
                      return `<div class="option-card" data-column="${col}" onclick="selectColumnByIndex(${index}, this)">
                        <div class="option-name">${name}</div>
                      </div>`;
                    }).join('') : '<p>Nessuna opzione disponibile</p>'}
                  </div>
                </div>
              </div>

              <div class="actions">
                <button class="btn btn-secondary" onclick="google.script.host.close()">
                  <i class="material-icons">close</i> Annulla
                </button>
                <button class="btn btn-primary" id="continueButton" onclick="continueFilter()" disabled>
                  <i class="material-icons">arrow_forward</i> Continua
                </button>
              </div>
            </div>
            
            <script>
              let selectedColumn = '';
              const opzioniDisponibili = ${JSON.stringify(opzioni)};
              
              // Usa htmlEscape da utils.js (importata globalmente)
              
              function selectColumnByIndex(index, element) {
                if (index >= 0 && index < opzioniDisponibili.length) {
                  const opzione = opzioniDisponibili[index];
                  selectedColumn = opzione.split(':')[0];
                  
                  // Aggiorna visualizzazione selezione
                  document.querySelectorAll('.option-card').forEach(card => {
                    card.classList.remove('selected');
                  });
                  element.classList.add('selected');
                  
                  updateContinueButton();
                }
              }
              
              function selectColumn(column, element) {
                selectedColumn = column;
                
                // Aggiorna visualizzazione selezione
                document.querySelectorAll('.option-card').forEach(card => {
                  card.classList.remove('selected');
                });
                element.classList.add('selected');
                
                updateContinueButton();
              }
              
              function updateContinueButton() {
                const continueButton = document.getElementById('continueButton');
                continueButton.disabled = !selectedColumn;
              }
              
              function continueFilter() {
                if (!selectedColumn) return;
                
                const continueButton = document.getElementById('continueButton');
                continueButton.disabled = true;
                continueButton.innerHTML = '<i class="material-icons">hourglass_empty</i> Caricamento...';
                
                // Converte la lettera della colonna in indice numerico
                const colIndex = selectedColumn.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
                
                google.script.run
                  .withSuccessHandler(function() {
                    google.script.host.close();
                  })
                  .withFailureHandler(function(error) {
                    console.error('Errore:', error);
                    alert('Errore: ' + error.message);
                    continueButton.disabled = false;
                    continueButton.innerHTML = '<i class="material-icons">arrow_forward</i> Continua';
                  })
                  .FILTRO_PAZIENTI_SELEZIONA_COLONNA_UNICO_2024(colIndex);
              }
            </script>
          </body>
        </html>
      `)
        .setWidth(Math.min((typeof window !== 'undefined' && window.innerWidth) || 800, 600))
        .setHeight(Math.min((typeof window !== 'undefined' && window.innerHeight) || 600, 500))
        .setTitle('Filtro Pazienti - Selezione Colonna');
      
      SpreadsheetApp.getUi().showModalDialog(html, 'Filtro Pazienti');
      
      logAvanzato('Mostrato dialogo selezione colonna uniformato', 'INFO');
    } catch (error) {
      gestisciErrore(error, 'mostraDialogoSelezioneColonna', true);
    }
  },

  /**
   * Mostra dialogo per selezione valore specifico
   * @param {Array} valori - Array di valori disponibili
   * @param {number} colIndex - Indice colonna selezionata
   * @returns {void}
   */
  mostraDialogoSelezioneValore(valori, colIndex) {
    try {
      if (!valori || valori.length === 0) {
        mostraErrore(
          'Nessun Valore Disponibile',
          'Non sono stati trovati valori per la colonna selezionata.',
          'Verifica che il foglio contenga dati nella colonna scelta.'
        );
        return;
      }

      const colonnaInfo = getColonneFiltro().find(col => col.indice === colIndex);
      const nomeColonna = colonnaInfo?.nome || `Colonna ${colIndex + 1}`;
      const letteraColonna = colonnaInfo?.lettera || String.fromCharCode(65 + colIndex);
      
      // RIPRISTINO SISTEMA DINAMICO ORIGINALE con escaping robusto
      // Mantiene il nuovo design uniforme ma ripristina la logica elegante pre-uniformazione
      
      // Usa htmlEscape da utils.js (importata globalmente)
      
      // Funzione escaping specifica per attributi onclick
      function escapeForOnclick(str) {
        if (typeof str !== 'string') return str;
        return str
          .replace(/\\/g, '\\\\')    // Escape backslashes
          .replace(/'/g, "\\'")      // Escape single quotes
          .replace(/"/g, '\\"')      // Escape double quotes
          .replace(/\r/g, '\\r')     // Escape carriage returns
          .replace(/\n/g, '\\n')     // Escape newlines
          .replace(/\t/g, '\\t');    // Escape tabs
      }
      
      // Salva colonna per uso nel callback (sistema semplificato)
      PropertiesService.getScriptProperties().setProperty('filtro_colonna_selezionata', colIndex.toString());
      
      // Genera HTML dinamico con onclick originale
      const valoriHTML = valori.map((valore, index) => {
        const valoreDisplay = htmlEscape(valore);
        const valoreForOnclick = escapeForOnclick(valore);
        return `<div class="option-card" 
                     onclick="selezionaValore('${valoreForOnclick}', this)"
                     data-valore="${htmlEscape(valore)}"
                     role="button"
                     tabindex="0">
          <div class="option-name">${valoreDisplay}</div>
        </div>`;
      }).join('');
      
      // HTML completamente statico
      const html = HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
          <head>
            <base target="_top">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <style>
              :root {
                --primary-btn-bg: #1a73e8;
                --primary-btn-text: #ffffff;
                --secondary-btn-bg: #f8f9fa;
                --secondary-btn-text: #5f6368;
                --dialog-bg: #ffffff;
                --text-primary: #202124;
                --text-secondary: #5f6368;
                --border-color: #e8eaed;
                --shadow-4dp: 0 4px 8px rgba(0,0,0,0.12);
              }

              @media (prefers-color-scheme: dark) {
                :root {
                  --dialog-bg: #2B2B2B;
                  --text-primary: #E8EAED;
                  --text-secondary: #9AA0A6;
                  --primary-btn-bg: #8AB4F8;
                  --primary-btn-text: #202124;
                  --secondary-btn-bg: #3C4043;
                  --secondary-btn-text: #E8EAED;
                  --border-color: #3C4043;
                  --shadow-4dp: 0 4px 6px rgba(0, 0, 0, 0.3);
                }
              }

              * { margin: 0; padding: 0; box-sizing: border-box; }

              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: var(--dialog-bg);
                color: var(--text-primary);
                line-height: 1.5;
                overflow-x: hidden;
              }

              .container {
                display: flex;
                flex-direction: column;
                height: 100vh;
                max-height: 90vh;
                position: relative;
              }

              .header {
                background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
                color: white;
                padding: 20px;
                text-align: center;
                box-shadow: var(--shadow-4dp);
                flex-shrink: 0;
              }

              .header h2 {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              }

              .content {
                flex: 1;
                padding: 24px;
                overflow-y: auto;
                min-height: 0;
                padding-bottom: 100px; /* Spazio per la barra pulsanti fissa */
              }

              .info-banner {
                background: linear-gradient(135deg, #e8f0fe 0%, #f1f8ff 100%);
                border: 1px solid #1a73e8;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                gap: 12px;
              }

              .info-banner .material-icons {
                color: var(--primary-btn-bg);
                font-size: 1.5rem;
              }

              .options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 16px;
                margin-bottom: 16px;
              }

              .option-card {
                padding: 16px 12px;
                border: 2px solid var(--border-color);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                background-color: var(--dialog-bg);
              }

              .option-card:hover {
                border-color: var(--primary-btn-bg);
                transform: translateY(-2px);
                box-shadow: var(--shadow-4dp);
              }

              .option-card.selected {
                border-color: var(--primary-btn-bg);
                background: linear-gradient(135deg, #e8f0fe 0%, #f1f8ff 100%);
                color: var(--primary-btn-bg);
                transform: translateY(-2px);
                box-shadow: var(--shadow-4dp);
              }

              .option-card .option-name {
                font-weight: 600;
                font-size: 0.95rem;
                word-break: break-word;
              }

              .actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 20px;
                background-color: var(--secondary-btn-bg);
                border-top: 1px solid var(--border-color);
                flex-shrink: 0;
              }

              .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .btn-secondary {
                background-color: var(--secondary-btn-bg);
                color: var(--secondary-btn-text);
                border: 1px solid var(--border-color);
              }

              .btn-primary {
                background-color: var(--primary-btn-bg);
                color: var(--primary-btn-text);
              }

              .btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }

              .actions {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 20px;
                background-color: var(--secondary-btn-bg);
                border-top: 1px solid var(--border-color);
                z-index: 1000;
                box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2><i class="material-icons">filter_list</i> Filtro Pazienti - Selezione Valore</h2>
              </div>
              
              <div class="content">
                <div class="options-grid">
                  ${valoriHTML}
                </div>
              </div>

              <div class="actions">
                <button class="btn btn-secondary" onclick="google.script.host.close()">
                  <i class="material-icons">close</i> Annulla
                </button>
                <button class="btn btn-primary" id="applyButton" onclick="applyFilter()" disabled>
                  <i class="material-icons">check</i> Applica Filtro
                </button>
              </div>
            </div>
            
            <script>
              let valoreSelezionato = null;
              
              // Sistema dinamico originale ripristinato
              function selezionaValore(valore, card) {
                valoreSelezionato = valore;
                console.log('Selezionato valore:', valore);
                
                // Aggiorna UI come nell'originale
                document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                document.getElementById('applyButton').disabled = false;
              }
              
              function applyFilter() {
                if (!valoreSelezionato) return;
                
                console.log('Applicando filtro per valore:', valoreSelezionato);
                
                const btn = document.getElementById('applyButton');
                btn.disabled = true;
                btn.innerHTML = '<i class="material-icons">hourglass_empty</i> Applicando...';
                
                // Chiamata diretta al sistema originale
                google.script.run
                  .withSuccessHandler(() => google.script.host.close())
                  .withFailureHandler((error) => {
                    alert('Errore: ' + error.message);
                    btn.disabled = false;
                    btn.innerHTML = '<i class="material-icons">check</i> Applica Filtro';
                  })
                  .processoSelezioneValoreDiretto(valoreSelezionato);
              }
            </script>
          </body>
        </html>
      `)
        .setWidth(700)
        .setHeight(550)
        .setTitle('Filtro Pazienti - Selezione Valore');

      SpreadsheetApp.getUi().showModalDialog(html, 'Filtro Pazienti - Selezione Valore');
      
      logAvanzato('Mostrato dialogo selezione valore semplificato', 'INFO', { 
        colIndex, 
        nomeColonna, 
        valoriCount: valori.length 
      });
    } catch (error) {
      gestisciErrore(error, 'mostraDialogoSelezioneValore', true);
    }
  },

  /**
   * Mostra dialogo di successo con statistiche
   * @param {string} messaggio - Messaggio principale
   * @param {Object} statistiche - Oggetto con statistiche filtro
   * @returns {void}
   */
  mostraDialogoSuccesso(messaggio, statistiche = {}) {
    try {
      const { righeFiltrate = 0, righeOriginali = 0, nomeColonna = '', valoreFiltro = '' } = statistiche;
      
      let dettagli = '';
      if (righeFiltrate > 0) {
        const percentuale = ((righeFiltrate / righeOriginali) * 100).toFixed(1);
        dettagli = `Statistiche filtro:
• Righe originali: ${righeOriginali}
• Righe filtrate: ${righeFiltrate}
• Percentuale: ${percentuale}%
• Colonna: ${nomeColonna}
• Valore: ${valoreFiltro}`;
      }

      mostraSuccesso('Filtro Applicato', messaggio, dettagli);
      
      logAvanzato('Mostrato dialogo successo filtro', 'INFO', statistiche);
    } catch (error) {
      gestisciErrore(error, 'mostraDialogoSuccesso', true);
    }
  },

  /**
   * Mostra dialogo di errore con dettagli
   * @param {string} messaggio - Messaggio di errore
   * @param {string} dettagli - Dettagli aggiuntivi
   * @returns {void}
   */
  mostraDialogoErrore(messaggio, dettagli = '') {
    try {
      mostraErrore('Errore Filtro', messaggio, dettagli);
      logAvanzato('Mostrato dialogo errore filtro', 'WARN', { messaggio, dettagli });
    } catch (error) {
      // Fallback se anche il sistema di errori fallisce
      SpreadsheetApp.getUi().alert(
        'Errore',
        `Si è verificato un errore durante il filtro: ${messaggio}`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
  },

  /**
   * Crea dialogo base per i filtri usando il design system
   * @param {string} titolo - Titolo del dialogo
   * @param {string} contenuto - Contenuto HTML
   * @param {Object} opzioni - Opzioni aggiuntive
   * @returns {HtmlOutput} Output HTML configurato
   */
  creaDialogoFiltri(titolo, contenuto, opzioni = {}) {
    try {
      const html = DesignSystem.createDialog(titolo, contenuto, opzioni);
      
      return HtmlService.createHtmlOutput(html)
        .setWidth(opzioni.size === 'large' ? 700 : 580)
        .setHeight(opzioni.size === 'small' ? 350 : 450);
    } catch (error) {
      // Fallback se design system non disponibile
      logAvanzato('Usando fallback per dialogo filtri', 'WARN', { error: error.message });
      
      const htmlFallback = `
        <!DOCTYPE html>
        <html>
          <head>
            <base target="_top">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .option-item { padding: 10px; border: 1px solid #ccc; margin: 5px 0; cursor: pointer; }
              .option-item:hover { background: #f0f0f0; }
            </style>
          </head>
          <body>
            <h2>${htmlEscape(titolo)}</h2>
            ${contenuto}
          </body>
        </html>
      `;
      
      return HtmlService.createHtmlOutput(htmlFallback)
        .setWidth(580)
        .setHeight(450);
    }
  },

  /**
   * Avvia il processo interattivo di filtro
   * @returns {void}
   */
  avviaFiltroInterattivo() {
    try {
      logAvanzato('Avvio processo filtro interattivo', 'INFO');
      
      // Verifica esistenza foglio origine
      const foglioOrigine = getFoglioSicuro(FILTRI_CONFIG.NOME_FOGLIO_ORIGINE);
      if (!foglioOrigine.successo) {
        this.mostraDialogoErrore(
          'Foglio origine non trovato',
          `Il foglio "${FILTRI_CONFIG.NOME_FOGLIO_ORIGINE}" non esiste. Assicurati che il foglio sia presente nel documento.`
        );
        return;
      }

      // Verifica presenza dati
      const lastRow = foglioOrigine.foglio.getLastRow();
      if (lastRow < 2) {
        this.mostraDialogoErrore(
          'Nessun dato disponibile',
          'Il foglio origine non contiene dati da filtrare.'
        );
        return;
      }

      // Mostra dialogo selezione colonna
      this.mostraDialogoSelezioneColonna();
    } catch (error) {
      gestisciErrore(error, 'avviaFiltroInterattivo', true);
    }
  },

  /**
   * Gestisce la selezione della colonna da parte dell'utente
   * @param {number} colIndex - Indice colonna selezionata
   * @returns {void}
   */
  processoSelezioneColonna(colIndex) {
    try {
      logAvanzato('Processando selezione colonna', 'INFO', { colIndex });
      
      // Ottiene valori unici dalla colonna
      const valori = FiltriService.getValoriUnici(colIndex);
      
      if (valori.length === 0) {
        this.mostraDialogoErrore(
          'Nessun valore trovato',
          'La colonna selezionata non contiene valori validi per il filtro.'
        );
        return;
      }

      // Salva l'indice colonna per uso successivo
      PropertiesService.getScriptProperties().setProperty('filtro_colonna_selezionata', colIndex.toString());
      
      // Mostra dialogo selezione valore
      this.mostraDialogoSelezioneValore(valori, colIndex);
    } catch (error) {
      gestisciErrore(error, 'processoSelezioneColonna', true);
    }
  },

  /**
   * Gestisce la selezione del valore da parte dell'utente
   * @param {string} valore - Valore selezionato per il filtro
   * @returns {void}
   */
  processoSelezioneValore(valore) {
    try {
      logAvanzato('Processando selezione valore', 'INFO', { valore });
      
      // Recupera colonna selezionata
      const colIndexStr = PropertiesService.getScriptProperties().getProperty('filtro_colonna_selezionata');
      if (!colIndexStr) {
        this.mostraDialogoErrore(
          'Errore interno',
          'Impossibile recuperare la colonna selezionata. Riprova il processo.'
        );
        return;
      }

      const colIndex = parseInt(colIndexStr, 10);
      const nomeColonna = getColonneFiltro().find(col => col.indice === colIndex)?.nome || `Colonna ${colIndex + 1}`;
      
      // Crea nome foglio destinazione usando solo il valore selezionato
      const nomeFoglioDestinazione = valore.replace(/[^\w\s]/g, '').substring(0, 30);
      
      // Prepara foglio destinazione
      const foglioDest = FiltriService.preparaFoglioDestinazione(nomeFoglioDestinazione);
      if (!foglioDest) {
        this.mostraDialogoErrore(
          'Errore creazione foglio',
          'Impossibile creare il foglio destinazione per i risultati filtrati.'
        );
        return;
      }

      // Esegue il filtro
      const risultato = FiltriService.eseguiFiltro(colIndex, valore, foglioDest);
      
      if (risultato.successo) {
        // Registra criteri filtro
        FiltriService.registraCriteriFiltro(nomeFoglioDestinazione, colIndex, valore);
        
        // Mostra successo
        this.mostraDialogoSuccesso(risultato.messaggio, {
          righeFiltrate: risultato.righeFiltrate,
          righeOriginali: risultato.righeOriginali,
          nomeColonna,
          valoreFiltro: valore
        });
        
        // Attiva il foglio creato
        SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(foglioDest);
        
        // Applica automaticamente la formattazione con colori alternati
        try {
          applicaColoriAlternatiStandalone();
          logAvanzato('Formattazione colori alternati applicata automaticamente', 'INFO', { nomeFoglio: nomeFoglioDestinazione });
        } catch (errorFormat) {
          logAvanzato('Errore applicazione colori alternati', 'WARN', { error: errorFormat.message });
        }
      } else {
        this.mostraDialogoErrore(risultato.messaggio);
      }
      
      // Pulisce property temporanea
      PropertiesService.getScriptProperties().deleteProperty('filtro_colonna_selezionata');
    } catch (error) {
      gestisciErrore(error, 'processoSelezioneValore', true);
    }
  }
};

// WORKAROUND FUNCTION - Mantenuta per compatibilità
// Funzione globale per applicare il filtro basato sull'indice selezionato
// Chiamata dal dialogo HTML semplificato (sistema con indici statici)
/**
 * WORKAROUND: Funzione per applicare filtro con indici statici
 * Mantenuta per compatibilità o fallback se il sistema dinamico fallisce
 * @param {number} selectedIndex - Indice del valore selezionato
 */
function applicaFiltroByIndex(selectedIndex) {
  try {
    // Recupera i valori dalle properties
    const valoriStr = PropertiesService.getScriptProperties().getProperty('valori_filtro_temp');
    const colIndexStr = PropertiesService.getScriptProperties().getProperty('colonna_filtro_temp');
    
    if (!valoriStr || !colIndexStr) {
      throw new Error('Dati del filtro non trovati nelle properties');
    }
    
    const valori = JSON.parse(valoriStr);
    const colIndex = parseInt(colIndexStr, 10);
    
    if (selectedIndex < 0 || selectedIndex >= valori.length) {
      throw new Error(`Indice non valido: ${selectedIndex} (disponibili: 0-${valori.length-1})`);
    }
    
    const valoreSelezionato = valori[selectedIndex];
    
    logAvanzato('Applicando filtro by index', 'INFO', { 
      selectedIndex, 
      valoreSelezionato, 
      colIndex,
      totalValues: valori.length 
    });
    
    // Applica il filtro direttamente senza dipendere da processoSelezioneValore
    const nomeColonna = getColonneFiltro().find(col => col.indice === colIndex)?.nome || `Colonna ${colIndex + 1}`;
    
    // Crea nome foglio destinazione usando solo il valore selezionato
    const nomeFoglioDestinazione = valoreSelezionato.replace(/[^\w\s]/g, '').substring(0, 30);
    
    // Prepara foglio destinazione
    const foglioDest = FiltriService.preparaFoglioDestinazione(nomeFoglioDestinazione);
    if (!foglioDest) {
      FiltriUI.mostraDialogoErrore(
        'Errore creazione foglio',
        'Impossibile creare il foglio destinazione per i risultati filtrati.'
      );
      return;
    }

    // Esegue il filtro
    const risultato = FiltriService.eseguiFiltro(colIndex, valoreSelezionato, foglioDest);
    
    if (risultato.successo) {
      // Registra criteri filtro
      FiltriService.registraCriteriFiltro(nomeFoglioDestinazione, colIndex, valoreSelezionato);
      
      // Mostra successo
      FiltriUI.mostraDialogoSuccesso(risultato.messaggio, {
        righeFiltrate: risultato.righeFiltrate,
        righeOriginali: risultato.righeOriginali,
        nomeColonna,
        valoreFiltro: valoreSelezionato
      });
      
      // Attiva il foglio creato
      SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(foglioDest);
      
      // Applica automaticamente la formattazione con colori alternati
      try {
        applicaColoriAlternatiStandalone();
        logAvanzato('Formattazione colori alternati applicata automaticamente', 'INFO', { nomeFoglio: nomeFoglioDestinazione });
      } catch (errorFormat) {
        logAvanzato('Errore applicazione colori alternati', 'WARN', { error: errorFormat.message });
      }
    } else {
      FiltriUI.mostraDialogoErrore(risultato.messaggio);
    }
    
    return risultato;
    
  } catch (error) {
    logAvanzato('Errore in applicaFiltroByIndex', 'ERROR', { error: error.message, selectedIndex });
    throw error;
  } finally {
    // Pulisce le properties temporanee
    PropertiesService.getScriptProperties().deleteProperty('valori_filtro_temp');
    PropertiesService.getScriptProperties().deleteProperty('colonna_filtro_temp');
  }
}

// Export per compatibilità
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FiltriUI, getColonneFiltro };
}

/**
 * Funzione diretta per processare selezione valore dal sistema dinamico ripristinato
 * Questa funzione usa la colonna già salvata in properties dal dialogo di selezione
 * @param {string} valore - Valore selezionato per il filtro
 */
function processoSelezioneValoreDiretto(valore) {
  try {
    logAvanzato('Processando selezione valore dinamica', 'INFO', { valore });
    
    // La colonna è già stata salvata da processoSelezioneColonna
    const colIndexStr = PropertiesService.getScriptProperties().getProperty('filtro_colonna_selezionata');
    if (!colIndexStr) {
      FiltriUI.mostraDialogoErrore(
        'Errore interno',
        'Impossibile recuperare la colonna selezionata. Riprova il processo.'
      );
      return;
    }

    const colIndex = parseInt(colIndexStr, 10);
    
    // Usa direttamente processoSelezioneValore del sistema originale
    return FiltriUI.processoSelezioneValore(valore);
    
  } catch (error) {
    logAvanzato('Errore in processoSelezioneValoreDiretto', 'ERROR', { error: error.message, valore });
    throw error;
  }
}

/**
 * Metodo di compatibilità per i test - restituisce CSS del design system
 * @returns {string} CSS completo per i dialoghi
 * @deprecated Usare DesignSystem.getMainCSS() + DesignSystem.getSelectionDialogCSS()
 */
FiltriUI.getCSSTemplate = function() {
  return DesignSystem.getMainCSS() + '\n' + DesignSystem.getSelectionDialogCSS();
};

/**
 * Crea un dialogo base utilizzando il design system
 * @param {string} titolo - Titolo del dialogo
 * @param {string} contenuto - Contenuto HTML del dialogo
 * @param {number} larghezza - Larghezza del dialogo (default: 450)
 * @param {number} altezza - Altezza del dialogo (default: 300)
 * @returns {Object} Oggetto HtmlOutput per Google Apps Script
 * @deprecated Usare DesignSystem.creaDialogo()
 */
FiltriUI.creaDialogoBase = function(titolo, contenuto, larghezza = 450, altezza = 300) {
  const htmlCompleto = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${htmlEscape(titolo)}</title>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${DesignSystem.getMainCSS()}
        ${DesignSystem.getSelectionDialogCSS()}
      </style>
    </head>
    <body>
      ${contenuto}
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(htmlCompleto)
    .setWidth(larghezza)
    .setHeight(altezza);
};
