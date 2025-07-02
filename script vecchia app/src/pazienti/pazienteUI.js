/**
 * Interfaccia utente per la gestione pazienti
 * Contiene tutti i dialoghi e le interfacce per ricerca e dimissione pazienti
 * 
 * @requires designSystem.js: DesignSystem
 * @requires pazienti/pazienteService.js: PazienteService
 * @requires errorHandler.js: mostraErrore, mostraSuccesso, logAvanzato
 * 
 * @version 1.0.0
 * @since 2025-06-24
 */

/**
 * Servizio UI per la gestione pazienti
 * Fornisce dialoghi e interfacce utente standardizzate
 */
const PazienteUI = {

  /**
   * Mostra una finestra di dialogo personalizzata per input singolo
   * @param {string} titolo - Il titolo della finestra
   * @param {string} messaggio - Il messaggio da mostrare
   * @param {string} placeholder - Il testo placeholder per l'input
   * @param {string} callbackName - Nome della funzione di callback
   * @param {Object} options - Opzioni aggiuntive per il dialogo
   */
  mostraDialogoInput(titolo, messaggio, placeholder, callbackName, options = {}) {
    const dialogWidth = options.width || 580;
    const dialogHeight = options.height || 450;
    const inputType = options.inputType || 'text';
    const icon = options.icon || 'person_search';

    const htmlOutput = HtmlService
      .createHtmlOutput(`
        <!DOCTYPE html>
        <html>
          <head>
            <base target="_top">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <style>
              ${DesignSystem.getMainCSS()}
            </style>
          </head>
          <body>
            <div class="dialog-container" role="dialog" aria-labelledby="dialogTitle">
              <div class="dialog-header">
                <h2 id="dialogTitle">
                  <span class="material-icons" aria-hidden="true">${icon}</span>
                  ${titolo}
                </h2>
              </div>
              
              <div class="dialog-content">
                <div class="form-group">
                  <label for="userInput" class="form-label">${messaggio}</label>
                  <input type="${inputType}" 
                    class="form-input" 
                    id="userInput" 
                    placeholder="${placeholder}"
                    autocomplete="off"
                    aria-required="true">
                </div>
              </div>

              <div class="btn-group right">
                <button class="btn btn-secondary" onclick="google.script.host.close()">
                  <span class="material-icons">close</span>
                  Annulla
                </button>
                <button class="btn btn-primary" onclick="submitInput()">
                  <span class="material-icons">check</span>
                  OK
                </button>
              </div>
            </div>
            
            <script>
              // Focus sull'input al caricamento
              setTimeout(() => document.getElementById('userInput').focus(), 300);
              
              // Gestione invio con Enter
              document.getElementById('userInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitInput();
                }
              });
              
              function submitInput() {
                const input = document.getElementById('userInput');
                const submitBtn = document.querySelector('.btn-primary');
                const value = input.value.trim();
                
                if (!value) {
                  input.focus();
                  return;
                }
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Attendi...';
                
                google.script.run
                  .withSuccessHandler(function() {
                    google.script.host.close();
                  })
                  .withFailureHandler(function(error) {
                    console.error('Errore:', error);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span class="material-icons">check</span> OK';
                    input.focus();
                  })
                  .${callbackName}(value);
              }
            </script>
          </body>
        </html>
      `)
      .setWidth(dialogWidth)
      .setHeight(dialogHeight);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, titolo);
  },

  /**
   * Mostra una finestra di dialogo per la ricerca paziente con due campi
   * @param {string} callbackName - Nome della funzione di callback per gestire la risposta
   */
  mostraDialogoRicercaPaziente(callbackName) {
    const htmlOutput = HtmlService
      .createHtmlOutput(`
        <!DOCTYPE html>
        <html>
          <head>
            <base target="_top">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <style>
              ${DesignSystem.getMainCSS()}
            </style>
          </head>
          <body>
            <div class="dialog-container" role="dialog" aria-labelledby="dialogTitle">
              <div class="dialog-header">
                <h2 id="dialogTitle">
                  <span class="material-icons" aria-hidden="true">person_search</span>
                  Ricerca Paziente
                </h2>
              </div>
              
              <div class="dialog-content">
                <div class="form-group">
                  <label for="inputNome" class="form-label">Nome</label>
                  <input type="text" class="form-input" id="inputNome" 
                    placeholder="Nome" autocomplete="off" aria-required="true">
                </div>
                <div class="form-group">
                  <label for="inputCognome" class="form-label">Cognome</label>
                  <input type="text" class="form-input" id="inputCognome" 
                    placeholder="Cognome" autocomplete="off" aria-required="true">
                </div>
              </div>
              
              <div class="btn-group right">
                <button class="btn btn-secondary" onclick="google.script.host.close()">
                  <span class="material-icons">close</span>
                  Annulla
                </button>
                <button class="btn btn-primary" onclick="submitInput()">
                  <span class="material-icons">search</span>
                  Cerca
                </button>
              </div>
            </div>
            
            <script>
              setTimeout(() => document.getElementById('inputNome').focus(), 300);
              
              // Navigazione con Enter
              document.getElementById('inputNome').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  document.getElementById('inputCognome').focus();
                }
              });
              
              document.getElementById('inputCognome').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitInput();
                }
              });
              
              function submitInput() {
                const nome = document.getElementById('inputNome').value.trim();
                const cognome = document.getElementById('inputCognome').value.trim();
                const submitBtn = document.querySelector('.btn-primary');
                
                if (!nome || !cognome) {
                  if (!nome) document.getElementById('inputNome').focus();
                  else document.getElementById('inputCognome').focus();
                  return;
                }
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Ricerca...';
                
                google.script.run
                  .withSuccessHandler(function() { 
                    google.script.host.close(); 
                  })
                  .withFailureHandler(function(error) {
                    console.error('Errore:', error);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span class="material-icons">search</span> Cerca';
                  })
                  .${callbackName}(nome, cognome);
              }
            </script>
          </body>
        </html>
      `)
      .setWidth(580)
      .setHeight(500);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Ricerca Paziente');
  },

  /**
   * Mostra un dialogo per la selezione tra pazienti omonimi
   * @param {Array} pazienti - Array di pazienti tra cui scegliere
   * @param {string} callbackName - Nome della funzione di callback
   */
  mostraDialogoSelezioneOmonimo(pazienti, callbackName) {
    if (!pazienti || !Array.isArray(pazienti) || pazienti.length === 0) {
      mostraErrore('Errore', 'Nessun paziente da selezionare.');
      return;
    }
    
    const htmlOutput = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_top">
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
          <style>
            ${DesignSystem.getMainCSS()}
            
            /* Stili specifici per la selezione pazienti */
            .pazienti-list {
              display: flex;
              flex-direction: column;
              gap: 12px;
              margin-bottom: 24px;
            }

            .paziente-card {
              padding: 16px;
              border: 2px solid var(--border-color);
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s ease;
              background-color: var(--dialog-bg);
              position: relative;
              overflow: hidden;
            }

            .paziente-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(26, 115, 232, 0.1), transparent);
              transition: left 0.5s;
            }

            .paziente-card:hover::before {
              left: 100%;
            }

            .paziente-card:hover {
              border-color: var(--primary-btn-bg);
              transform: translateY(-2px);
              box-shadow: var(--shadow-4dp);
            }

            .paziente-card.selected {
              border-color: var(--primary-btn-bg);
              background-color: rgba(26, 115, 232, 0.05);
            }

            .paziente-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
            }

            .paziente-nome {
              font-weight: 500;
              color: var(--dialog-text);
              font-size: 1rem;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .paziente-data {
              color: var(--dialog-text);
              opacity: 0.7;
              font-size: 0.9rem;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .description {
              color: var(--dialog-text);
              opacity: 0.8;
              margin-bottom: 20px;
              font-size: 0.95rem;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="dialog-container" role="dialog" aria-labelledby="dialogTitle">
            <div class="dialog-header">
              <h2 id="dialogTitle">
                <span class="material-icons" aria-hidden="true">people</span>
                Seleziona Paziente
              </h2>
            </div>
            
            <div class="dialog-content">
              <p class="description">
                Sono stati trovati più pazienti con lo stesso nome. Seleziona quello corretto in base alla data di ingresso:
              </p>
              <div class="pazienti-list">
                ${pazienti.map((p, index) => `
                  <div class="paziente-card" 
                    onclick="selezionaPaziente(${p.riga}, this)" 
                    role="button" 
                    tabindex="0"
                    data-riga="${p.riga}">
                    <div class="paziente-info">
                      <span class="paziente-nome">
                        <span class="material-icons" aria-hidden="true">person</span>
                        ${p.cognome} ${p.nome}
                      </span>
                      <span class="paziente-data">
                        <span class="material-icons" aria-hidden="true">calendar_today</span>
                        ${p.dataIngressoStr}
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="btn-group right">
              <button class="btn btn-secondary" onclick="google.script.host.close()">
                <span class="material-icons">close</span>
                Annulla
              </button>
              <button class="btn btn-primary" id="btnSeleziona" onclick="confermaSelezione()" disabled>
                <span class="material-icons">check_circle</span>
                Seleziona
              </button>
            </div>
          </div>
          
          <script>
            let rigaSelezionata = null;

            function selezionaPaziente(riga, card) {
              rigaSelezionata = riga;
              const allCards = document.querySelectorAll('.paziente-card');
              const btnSeleziona = document.getElementById('btnSeleziona');
              
              // Feedback visivo
              allCards.forEach(c => {
                c.classList.remove('selected');
              });
              card.classList.add('selected');
              
              // Abilita il bottone Seleziona
              btnSeleziona.disabled = false;
            }

            function confermaSelezione() {
              if (!rigaSelezionata) return;

              const btnSeleziona = document.getElementById('btnSeleziona');
              btnSeleziona.disabled = true;
              btnSeleziona.innerHTML = '<span class="material-icons">hourglass_empty</span> Attendi...';
              
              google.script.run
                .withSuccessHandler(function() {
                  google.script.host.close();
                })
                .withFailureHandler(function(error) {
                  console.error('Errore:', error);
                  btnSeleziona.disabled = false;
                  btnSeleziona.innerHTML = '<span class="material-icons">check_circle</span> Seleziona';
                  rigaSelezionata = null;
                  document.querySelector('.paziente-card.selected')?.classList.remove('selected');
                })
                .${callbackName}(rigaSelezionata);
            }

            // Gestione tastiera per accessibilità
            document.querySelectorAll('.paziente-card').forEach(card => {
              card.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const riga = parseInt(this.dataset.riga);
                  selezionaPaziente(riga, this);
                }
              });
            });

            // Gestione scorciatoie da tastiera
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Enter' && !e.target.classList.contains('paziente-card')) {
                const btnSeleziona = document.getElementById('btnSeleziona');
                if (!btnSeleziona.disabled) {
                  confermaSelezione();
                }
              } else if (e.key === 'Escape') {
                google.script.host.close();
              }
            });
          </script>
        </body>
      </html>
    `)
    .setWidth(600)
    .setHeight(650);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Seleziona Paziente');
  },

  /**
   * Mostra un dialogo di conferma per operazioni critiche
   * @param {string} titolo - Titolo del dialogo
   * @param {string} messaggio - Messaggio di conferma
   * @param {string} callbackName - Nome della funzione di callback
   * @param {Object} options - Opzioni aggiuntive
   */
  mostraDialogoConferma(titolo, messaggio, callbackName, options = {}) {
    const icon = options.icon || 'help';
    const confirmText = options.confirmText || 'Conferma';
    const cancelText = options.cancelText || 'Annulla';
    const type = options.type || 'warning'; // warning, info, error

    const htmlOutput = HtmlService
      .createHtmlOutput(`
        <!DOCTYPE html>
        <html>
          <head>
            <base target="_top">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <style>
              ${DesignSystem.getMainCSS()}
            </style>
          </head>
          <body>
            <div class="dialog-container small" role="dialog" aria-labelledby="dialogTitle">
              <div class="dialog-header">
                <h2 id="dialogTitle">
                  <span class="material-icons icon-${type}" aria-hidden="true">${icon}</span>
                  ${titolo}
                </h2>
              </div>
              
              <div class="dialog-content text-center">
                <div class="message message-${type}">
                  <span class="material-icons">${icon}</span>
                  ${messaggio}
                </div>
              </div>

              <div class="btn-group right">
                <button class="btn btn-secondary" onclick="google.script.host.close()">
                  <span class="material-icons">close</span>
                  ${cancelText}
                </button>
                <button class="btn btn-${type === 'error' ? 'danger' : 'primary'}" onclick="conferma()">
                  <span class="material-icons">check</span>
                  ${confirmText}
                </button>
              </div>
            </div>
            
            <script>
              function conferma() {
                const confirmBtn = document.querySelector('.btn-primary, .btn-danger');
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Attendi...';
                
                google.script.run
                  .withSuccessHandler(function() {
                    google.script.host.close();
                  })
                  .withFailureHandler(function(error) {
                    console.error('Errore:', error);
                    google.script.host.close();
                  })
                  .${callbackName}();
              }

              // Gestione tasti
              document.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                  conferma();
                } else if (e.key === 'Escape') {
                  google.script.host.close();
                }
              });
            </script>
          </body>
        </html>
      `)
      .setWidth(450)
      .setHeight(350);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, titolo);
  },

  /**
   * Verifica disponibilità del servizio
   * @returns {boolean} True se il servizio è disponibile
   */
  isAvailable() {
    return typeof HtmlService !== 'undefined' && 
           typeof DesignSystem !== 'undefined' && 
           typeof SpreadsheetApp !== 'undefined';
  }
};

// Log del caricamento del modulo
if (typeof logAvanzato === 'function') {
  logAvanzato('PazienteUI caricato correttamente', 'INFO');
} else {
  console.log('✓ PazienteUI caricato');
}
