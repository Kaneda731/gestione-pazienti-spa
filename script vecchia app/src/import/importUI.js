/**
 * @fileoverview Modulo per le interfacce utente dell'importazione CSV
 * @author Sistema ScriptPazienti
 * @version 1.0.0
 * @requires designSystem.js - Per il CSS centralizzato
 */

// ============================
// ESPONE FUNZIONI GLOBALMENTE
// ============================
this.import_importUI = this.import_importUI || {};

/**
 * Funzione per mostrare l'interfaccia di caricamento del file locale
 */
function showLocalFileUploader() {
  const ui = SpreadsheetApp.getUi();
  
  // Crea un'interfaccia HTML per il caricamento del file
  const htmlOutput = HtmlService.createHtmlOutput(getLocalFileUploaderHTML())
    .setWidth(550)
    .setHeight(450)
    .setTitle('Importa CSV locale');
  
  ui.showModalDialog(htmlOutput, 'Importa CSV locale');
}

/**
 * Genera l'HTML per l'interfaccia di caricamento file locale
 * @return {string} HTML dell'interfaccia
 */
function getLocalFileUploaderHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${getImportUICSS()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h3>
            <span class="material-icons">cloud_upload</span>
            Importa file CSV locale
          </h3>
        </div>
        
        <div class="content">
          <div class="instructions">
            <h4>
              <span class="material-icons">info</span>
              Istruzioni:
            </h4>
            <ol>
              <li>Seleziona un file CSV dal tuo computer</li>
              <li>Clicca su "Carica File"</li>
              <li>Attendi il completamento dell'importazione</li>
              <li>Chiudi questa finestra quando l'operazione è completata</li>
            </ol>
          </div>
          
          <div class="form-group">
            <label for="csvFile">
              <span class="material-icons">attach_file</span>
              Seleziona un file CSV dal tuo computer:
            </label>
            <input type="file" id="csvFile" class="file-input" accept=".csv">
          </div>
          
          <button class="btn" onclick="uploadFile()">
            <span class="material-icons">cloud_upload</span>
            Carica File
          </button>
          
          <div id="status" class="status" style="display: none;"></div>
        </div>
      </div>
      
      <script>
        ${getLocalFileUploaderScript()}
      </script>
    </body>
    </html>
  `;
}

/**
 * Genera il JavaScript per l'interfaccia di caricamento file locale
 * @return {string} JavaScript dell'interfaccia
 */
function getLocalFileUploaderScript() {
  return `
    function uploadFile() {
      var fileInput = document.getElementById("csvFile");
      var statusDiv = document.getElementById("status");
      var btn = document.querySelector('.btn');
      
      if (!fileInput.files.length) {
        showStatus('error', 'Seleziona un file prima di procedere.');
        return;
      }
      
      var file = fileInput.files[0];
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        showStatus('error', 'Il file selezionato non è un CSV valido.');
        return;
      }
      
      btn.disabled = true;
      btn.innerHTML = '<span class="material-icons">hourglass_empty</span> Caricamento...';
      showStatus('info', 'Caricamento e processamento in corso...');
      
      var reader = new FileReader();
      reader.onload = function(e) {
        var content = e.target.result;
        google.script.run
          .withSuccessHandler(function(result) {
            if (result.success) {
              showStatus('success', 'Importazione completata con successo!<br>' + 
                'Righe processate: ' + result.righeProcessate + '<br>' +
                'Puoi chiudere questa finestra.');
            } else {
              showStatus('warning', 'Importazione completata con avvisi:<br>' + result.message);
            }
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons">cloud_upload</span> Carica File';
          })
          .withFailureHandler(function(error) {
            showStatus('error', 'Errore durante l\\'importazione: ' + error);
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons">cloud_upload</span> Carica File';
          })
          .processLocalCsvFile(content);
      };
      
      reader.onerror = function() {
        showStatus('error', 'Errore nella lettura del file.');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons">cloud_upload</span> Carica File';
      };
      
      reader.readAsText(file);
    }
    
    function showStatus(type, message) {
      var statusDiv = document.getElementById("status");
      statusDiv.style.display = 'block';
      statusDiv.className = 'status ' + type;
      statusDiv.innerHTML = message;
    }
  `;
}

/**
 * Genera l'HTML per la selezione di file da Google Drive
 * @param {Array} fileOptions - Array dei nomi dei file
 * @param {Array} fileIds - Array degli ID dei file
 * @return {string} HTML dell'interfaccia
 */
function getFileSelectionHTML(fileOptions, fileIds) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${getImportUICSS()}
      </style>
    </head>
    <body>
      <div class="container">
        <h3>Seleziona file CSV</h3>
        <select id="fileSelect">
          ${fileOptions.map(function(name, i) {
            return '<option value="' + i + '">' + name + '</option>';
          }).join('')}
        </select>
        <div class="actions">
          <button class="btn btn-secondary" onclick="google.script.host.close()">
            <span class="material-icons">close</span> Annulla
          </button>
          <button class="btn btn-primary" onclick="selectFile()">
            <span class="material-icons">check</span> Seleziona
          </button>
        </div>
      </div>
      <script>
        function selectFile() {
          const fileIndex = document.getElementById("fileSelect").value;
          google.script.run
            .withSuccessHandler(function(id) {
              google.script.host.close();
            })
            .selectFile(fileIndex);
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Mostra la finestra di selezione file CSV da Google Drive
 * @param {Array} fileOptions - Array dei nomi dei file
 * @param {Array} fileIds - Array degli ID dei file
 */
function showFileSelectionDialog(fileOptions, fileIds) {
  const ui = SpreadsheetApp.getUi();
  
  const fileListHtml = HtmlService.createHtmlOutput(
    getFileSelectionHTML(fileOptions, fileIds)
  )
  .setWidth(300)
  .setHeight(100);
  
  ui.showModalDialog(fileListHtml, 'Seleziona un file CSV');
}

/**
 * Mostra una finestra moderna di selezione origine per il file CSV
 * Sostituisce il vecchio ui.alert con una interfaccia più chiara
 */
function showCsvSourceSelector() {
  const ui = SpreadsheetApp.getUi();
  
  const htmlOutput = HtmlService.createHtmlOutput(getCsvSourceSelectorHTML())
    .setWidth(550)
    .setHeight(400)
    .setTitle('Importa CSV - Seleziona Origine');
  
  ui.showModalDialog(htmlOutput, 'Importa CSV - Seleziona Origine');
}

/**
 * Genera l'HTML per la finestra di selezione origine CSV
 * @return {string} HTML dell'interfaccia
 */
function getCsvSourceSelectorHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${getImportUICSS()}
        
        /* Stili specifici per la selezione origine */
        .source-options {
          margin: 24px 0;
        }
        
        .source-option {
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: var(--dialog-bg);
          display: flex;
          align-items: center;
          gap: 16px;
          user-select: none;
          -webkit-user-select: none;
          position: relative;
        }
        
        .source-option:hover {
          border-color: var(--primary-btn-bg);
          box-shadow: 0 2px 8px rgba(26, 115, 232, 0.2);
          transform: translateY(-2px);
        }
        
        .source-option.selected {
          border-color: var(--primary-btn-bg);
          background: rgba(26, 115, 232, 0.1);
          box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
        }
        
        .source-option:active {
          transform: translateY(0);
          box-shadow: 0 1px 4px rgba(26, 115, 232, 0.3);
        }
        
        .source-icon {
          font-size: 48px;
          color: var(--primary-btn-bg);
          min-width: 60px;
        }
        
        .source-content {
          flex: 1;
        }
        
        .source-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--dialog-text);
        }
        
        .source-description {
          color: var(--dialog-text);
          opacity: 0.8;
          line-height: 1.4;
        }
        
        .source-advantages {
          margin-top: 8px;
          font-size: 0.9rem;
          color: var(--success-color);
        }
        
        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          gap: 12px;
        }
        
        .btn-large {
          padding: 12px 24px;
          font-size: 1rem;
          min-width: 120px;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
        }
        
        .btn-large:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-large:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .btn-large:not(:disabled):active {
          transform: translateY(0);
        }
        
        input[type="radio"] {
          display: none;
        }
        
        .help-text {
          background: rgba(66, 133, 244, 0.1);
          border-left: 4px solid var(--info-color);
          padding: 16px;
          margin-bottom: 20px;
          border-radius: 8px;
          font-size: 0.95rem;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h3>
            <span class="material-icons">cloud_upload</span>
            Importa dati CSV
          </h3>
        </div>
        
        <div class="content">
          <div class="help-text">
            <strong>Seleziona da dove importare il file CSV:</strong><br>
            Scegli l'opzione più adatta alle tue esigenze. Puoi importare da Google Drive se il file è già caricato, oppure direttamente dal tuo computer.
          </div>
          
          <div class="source-options">
            <div class="source-option" data-source="drive" id="driveOption">
              <div class="source-icon">
                <span class="material-icons">cloud</span>
              </div>
              <div class="source-content">
                <div class="source-title">Google Drive</div>
                <div class="source-description">
                  Importa un file CSV già presente nel tuo Google Drive
                </div>
                <div class="source-advantages">
                  ✓ Accesso rapido ai file esistenti ✓ Sincronizzazione automatica
                </div>
              </div>
            </div>
            
            <div class="source-option" data-source="local" id="localOption">
              <div class="source-icon">
                <span class="material-icons">computer</span>
              </div>
              <div class="source-content">
                <div class="source-title">Computer Locale</div>
                <div class="source-description">
                  Carica un file CSV direttamente dal tuo computer
                </div>
                <div class="source-advantages">
                  ✓ File freschi dal computer ✓ Controllo completo sui dati
                </div>
              </div>
            </div>
          </div>
          
          <div class="actions">
            <button class="btn btn-secondary btn-large" id="cancelBtn">
              <span class="material-icons">close</span>
              Annulla
            </button>
            <button class="btn btn-primary btn-large" id="continueBtn" disabled>
              <span class="material-icons">arrow_forward</span>
              Continua
            </button>
          </div>
        </div>
      </div>
      
      <script>
        (function() {
          console.log('🚀 Inizializzazione CSV Selector...');
          
          let selectedSource = null;
          
          // Elementi
          const driveOption = document.getElementById('driveOption');
          const localOption = document.getElementById('localOption');
          const continueBtn = document.getElementById('continueBtn');
          const cancelBtn = document.getElementById('cancelBtn');
          
          // Funzione per selezionare una fonte
          function selectSource(source) {
            console.log('✅ Fonte selezionata:', source);
            
            selectedSource = source;
            
            // Rimuovi selezioni precedenti
            document.querySelectorAll('.source-option').forEach(option => {
              option.classList.remove('selected');
            });
            
            // Seleziona la nuova fonte
            if (source === 'drive') {
              driveOption.classList.add('selected');
            } else if (source === 'local') {
              localOption.classList.add('selected');
            }
            
            // Abilita il pulsante continua
            continueBtn.disabled = false;
            continueBtn.innerHTML = '<span class="material-icons">arrow_forward</span> Continua';
            continueBtn.style.opacity = '1';
            
            console.log('✅ Pulsante continua abilitato per:', source);
          }
          
          // Funzione per continuare
          function continueImport() {
            console.log('🚀 Continuando con:', selectedSource);
            
            if (!selectedSource) {
              alert('⚠️ Seleziona prima una fonte!');
              return;
            }
            
            // Disabilita pulsante
            continueBtn.disabled = true;
            continueBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Elaborazione...';
            continueBtn.style.opacity = '0.6';
            
            try {
              if (selectedSource === 'drive') {
                console.log('📁 Avvio import da Google Drive...');
                google.script.run
                  .withSuccessHandler(function() {
                    console.log('✅ Google Drive import completato');
                    setTimeout(() => google.script.host.close(), 1000);
                  })
                  .withFailureHandler(function(error) {
                    console.error('❌ Errore Google Drive:', error);
                    alert('Errore Google Drive: ' + (error.message || error));
                    resetButton();
                  })
                  .continueWithGoogleDrive();
              } else if (selectedSource === 'local') {
                console.log('💻 Avvio import da file locale...');
                google.script.run
                  .withSuccessHandler(function() {
                    console.log('✅ File locale import avviato');
                    setTimeout(() => google.script.host.close(), 1000);
                  })
                  .withFailureHandler(function(error) {
                    console.error('❌ Errore file locale:', error);
                    alert('Errore file locale: ' + (error.message || error));
                    resetButton();
                  })
                  .continueWithLocalFile();
              }
            } catch (error) {
              console.error('❌ Errore generale:', error);
              alert('Errore: ' + (error.message || error));
              resetButton();
            }
          }
          
          // Funzione per resettare il pulsante
          function resetButton() {
            continueBtn.disabled = false;
            continueBtn.innerHTML = '<span class="material-icons">arrow_forward</span> Continua';
            continueBtn.style.opacity = '1';
          }
          
          // Event listeners
          driveOption.addEventListener('click', function() {
            selectSource('drive');
          });
          
          localOption.addEventListener('click', function() {
            selectSource('local');
          });
          
          continueBtn.addEventListener('click', function() {
            continueImport();
          });
          
          cancelBtn.addEventListener('click', function() {
            console.log('❌ Annullamento import');
            google.script.host.close();
          });
          
          // Supporto tastiera
          document.addEventListener('keydown', function(e) {
            if (e.key === '1' || e.key === 'd' || e.key === 'D') {
              e.preventDefault();
              selectSource('drive');
            } else if (e.key === '2' || e.key === 'l' || e.key === 'L') {
              e.preventDefault();
              selectSource('local');
            } else if (e.key === 'Enter' && selectedSource) {
              e.preventDefault();
              continueImport();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              google.script.host.close();
            }
          });
          
          console.log('✅ CSV Selector inizializzato correttamente');
        })();
      </script>
    </body>
    </html>
  `;
}

/**
 * Funzione chiamata quando l'utente sceglie di continuare con Google Drive
 */
function continueWithGoogleDrive() {
  try {
    console.log('✅ Apertura file picker Google Drive...');
    showDriveFilePicker();
  } catch (error) {
    console.error('Errore durante l\'apertura Google Drive:', error);
    throw error;
  }
}

/**
 * Funzione chiamata quando l'utente sceglie di continuare con file locale
 */
function continueWithLocalFile() {
  try {
    showLocalFileUploader();
    console.log('Finestra caricamento file locale aperta.');
  } catch (error) {
    console.error('Errore durante l\'apertura file locale:', error);
    throw error;
  }
}

/**
 * Genera il CSS per le interfacce di importazione
 * Versione locale senza dipendenze esterne
 */
function getImportUICSS() {
  return `
    /* Design System Variables */
    :root {
      --primary-color: #1a73e8;
      --primary-hover: #1557b0;
      --secondary-color: #5f6368;
      --success-color: #34a853;
      --error-color: #ea4335;
      --warning-color: #fbbc04;
      --info-color: #4285f4;
      
      --bg-primary: #ffffff;
      --bg-secondary: #f8f9fa;
      --bg-hover: #f1f3f4;
      
      --text-primary: #202124;
      --text-secondary: #5f6368;
      --text-inverse: #ffffff;
      
      --border-light: #e8eaed;
      --border-medium: #dadce0;
      --border-strong: #5f6368;
      
      --shadow-light: 0 1px 3px rgba(60, 64, 67, 0.1);
      --shadow-medium: 0 2px 8px rgba(60, 64, 67, 0.15);
      --shadow-strong: 0 4px 16px rgba(60, 64, 67, 0.2);
      
      --radius-small: 4px;
      --radius-medium: 8px;
      --radius-large: 12px;
      
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
      --spacing-xl: 32px;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-primary: #202124;
        --bg-secondary: #303134;
        --bg-hover: #3c4043;
        
        --text-primary: #e8eaed;
        --text-secondary: #9aa0a6;
        
        --border-light: #3c4043;
        --border-medium: #5f6368;
        --border-strong: #9aa0a6;
        
        --shadow-light: 0 1px 3px rgba(0, 0, 0, 0.3);
        --shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.4);
        --shadow-strong: 0 4px 16px rgba(0, 0, 0, 0.5);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Google Sans', Roboto, Arial, sans-serif;
      background: var(--bg-secondary);
      color: var(--text-primary);
      line-height: 1.5;
      padding: var(--spacing-md);
    }

    .container {
      max-width: 520px;
      margin: 0 auto;
      background: var(--bg-primary);
      border-radius: var(--radius-large);
      box-shadow: var(--shadow-strong);
      overflow: hidden;
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header {
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--border-light);
      text-align: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, #4285F4 100%);
      color: var(--text-inverse);
    }

    .header h3 {
      font-size: 1.25rem;
      font-weight: 500;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
    }

    .content {
      padding: var(--spacing-lg);
    }

    .instructions {
      background: rgba(66, 133, 244, 0.1);
      border-left: 4px solid var(--info-color);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      border-radius: var(--radius-small);
    }

    .instructions h4 {
      color: var(--info-color);
      margin-bottom: var(--spacing-sm);
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .instructions ol {
      margin-left: var(--spacing-md);
      color: var(--text-secondary);
    }

    .form-group {
      margin-bottom: var(--spacing-lg);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--spacing-sm);
      color: var(--text-primary);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .file-input {
      width: 100%;
      padding: var(--spacing-sm);
      border: 2px solid var(--border-medium);
      border-radius: var(--radius-small);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .file-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--radius-small);
      background: var(--primary-color);
      color: var(--text-inverse);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 120px;
      justify-content: center;
    }

    .btn:hover:not(:disabled) {
      background: var(--primary-hover);
      box-shadow: var(--shadow-light);
      transform: translateY(-1px);
    }

    .btn:disabled {
      background: var(--border-medium);
      color: var(--text-secondary);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-secondary {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-medium);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--bg-hover);
      border-color: var(--border-strong);
    }

    .btn-primary {
      background: var(--primary-color);
      color: var(--text-inverse);
    }

    .actions {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: flex-end;
      margin-top: var(--spacing-lg);
    }

    .status {
      margin-top: var(--spacing-md);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-small);
      font-size: 0.875rem;
      border-left: 4px solid var(--info-color);
      background: rgba(66, 133, 244, 0.1);
      color: var(--info-color);
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .status.success {
      border-left-color: var(--success-color);
      color: var(--success-color);
      background: rgba(52, 168, 83, 0.1);
    }

    .status.error {
      border-left-color: var(--error-color);
      color: var(--error-color);
      background: rgba(234, 67, 53, 0.1);
    }

    .status.warning {
      border-left-color: var(--warning-color);
      color: var(--warning-color);
      background: rgba(251, 188, 4, 0.1);
    }

    .status.info {
      border-left-color: var(--info-color);
      color: var(--info-color);
      background: rgba(66, 133, 244, 0.1);
    }

    /* Responsive */
    @media (max-width: 600px) {
      body { padding: var(--spacing-sm); }
      .container { max-width: 100%; }
      .header { padding: var(--spacing-md); }
      .content { padding: var(--spacing-md); }
      .actions { flex-direction: column; }
      .btn { width: 100%; }
    }
  `;
}

// ============================
// GOOGLE DRIVE FILE PICKER
// ============================

/**
 * Mostra il file picker per Google Drive
 * @param {string|null} folderId - ID della cartella iniziale (null per root)
 */
function showDriveFilePicker(folderId = null) {
  const ui = SpreadsheetApp.getUi();
  
  const htmlOutput = HtmlService.createHtmlOutput(getDriveFilePickerHTML(folderId))
    .setWidth(800)
    .setHeight(600)
    .setTitle('Seleziona file CSV da Google Drive');
  
  ui.showModalDialog(htmlOutput, 'Seleziona file CSV da Google Drive');
}

/**
 * Genera l'HTML per il file picker Google Drive
 * @param {string|null} folderId - ID della cartella
 * @return {string} HTML dell'interfaccia
 */
function getDriveFilePickerHTML(folderId = null) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${getImportUICSS()}
        
        /* Stili specifici per il file picker */
        .file-picker-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-height: 580px;
        }
        
        .breadcrumb {
          background: var(--secondary-btn-bg);
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
        }
        
        .breadcrumb-item {
          color: var(--primary-btn-bg);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .breadcrumb-item:hover {
          background: rgba(26, 115, 232, 0.1);
        }
        
        .breadcrumb-separator {
          color: var(--dialog-text);
          opacity: 0.6;
        }
        
        .file-list-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        
        .file-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--dialog-bg);
        }
        
        .file-item:hover {
          border-color: var(--primary-btn-bg);
          box-shadow: 0 2px 8px rgba(26, 115, 232, 0.15);
          transform: translateY(-1px);
        }
        
        .file-item.selected {
          border-color: var(--primary-btn-bg);
          background: rgba(26, 115, 232, 0.05);
          box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
        }
        
        .file-icon {
          font-size: 32px;
          margin-right: 16px;
          min-width: 40px;
        }
        
        .folder-icon {
          color: #FBBC04;
        }
        
        .csv-icon {
          color: #34A853;
        }
        
        .file-info {
          flex: 1;
        }
        
        .file-name {
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--dialog-text);
        }
        
        .file-details {
          font-size: 0.85rem;
          color: var(--dialog-text);
          opacity: 0.7;
        }
        
        .picker-actions {
          padding: 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--secondary-btn-bg);
        }
        
        .selected-info {
          font-size: 0.9rem;
          color: var(--dialog-text);
        }
        
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--primary-btn-bg);
        }
        
        .no-files {
          text-align: center;
          padding: 40px;
          color: var(--dialog-text);
          opacity: 0.7;
        }
        
        .error-message {
          background: #FEE;
          border: 1px solid #F5C6CB;
          color: #721C24;
          padding: 12px;
          border-radius: 4px;
          margin: 16px;
        }
      </style>
    </head>
    <body>
      <div class="file-picker-container">
        <!-- Breadcrumb -->
        <div class="breadcrumb" id="breadcrumb">
          <span class="loading-spinner">
            <span class="material-icons">hourglass_empty</span>
            Caricamento...
          </span>
        </div>
        
        <!-- Lista file -->
        <div class="file-list-container" id="fileListContainer">
          <div class="loading-spinner">
            <span class="material-icons">hourglass_empty</span>
            Caricamento contenuti...
          </div>
        </div>
        
        <!-- Azioni -->
        <div class="picker-actions">
          <div class="selected-info" id="selectedInfo">
            Nessun file selezionato
          </div>
          <div>
            <button class="btn btn-secondary" id="cancelBtn">
              <span class="material-icons">close</span>
              Annulla
            </button>
            <button class="btn btn-primary" id="selectBtn" disabled>
              <span class="material-icons">check</span>
              Seleziona
            </button>
          </div>
        </div>
      </div>
      
      <script>
        (function() {
          console.log('🚀 Inizializzazione Drive File Picker...');
          
          let currentFolderId = ${folderId ? `'${folderId}'` : 'null'};
          let selectedFileId = null;
          let selectedFileName = null;
          
          // Elementi DOM
          const breadcrumb = document.getElementById('breadcrumb');
          const fileListContainer = document.getElementById('fileListContainer');
          const selectedInfo = document.getElementById('selectedInfo');
          const selectBtn = document.getElementById('selectBtn');
          const cancelBtn = document.getElementById('cancelBtn');
          
          // Carica il contenuto iniziale
          loadFolderContents(currentFolderId);
          
          /**
           * Carica il contenuto di una cartella
           */
          function loadFolderContents(folderId) {
            console.log('📂 Caricamento cartella:', folderId);
            showLoading();
            
            // Timeout per evitare blocchi infiniti
            const timeoutId = setTimeout(function() {
              console.log('⏰ Timeout raggiunto per caricamento cartella');
              showError('Timeout durante il caricamento. Verifica la connessione e riprova.');
            }, 10000); // 10 secondi
            
            google.script.run
              .withSuccessHandler(function(result) {
                console.log('✅ Risposta ricevuta:', result);
                clearTimeout(timeoutId);
                
                if (result.success) {
                  displayFolderContents(result);
                  updateBreadcrumb(folderId);
                } else {
                  showError('Errore nel caricamento: ' + result.error);
                }
              })
              .withFailureHandler(function(error) {
                console.log('❌ Errore google.script.run:', error);
                clearTimeout(timeoutId);
                showError('Errore di comunicazione: ' + error);
              })
              .getDriveFolderContents(folderId);
          }
          
          /**
           * Mostra lo stato di caricamento
           */
          function showLoading() {
            fileListContainer.innerHTML = \`
              <div class="loading-spinner">
                <span class="material-icons">hourglass_empty</span>
                Caricamento contenuti...
              </div>
            \`;
          }
          
          /**
           * Mostra un messaggio di errore
           */
          function showError(message) {
            fileListContainer.innerHTML = \`
              <div class="error-message">
                <strong>Errore:</strong> \${message}
                <br><br>
                <button onclick="loadFolderContents(currentFolderId)" class="btn btn-primary">
                  <span class="material-icons">refresh</span>
                  Riprova
                </button>
                <button onclick="loadFolderContents(null)" class="btn btn-secondary">
                  <span class="material-icons">home</span>
                  Torna alla Root
                </button>
              </div>
            \`;
          }
          
          /**
           * Visualizza il contenuto della cartella
           */
          function displayFolderContents(contents) {
            let html = '';
            
            // Cartelle
            contents.folders.forEach(folder => {
              html += \`
                <div class="file-item folder-item" data-type="folder" data-id="\${folder.id}">
                  <span class="material-icons file-icon folder-icon">folder</span>
                  <div class="file-info">
                    <div class="file-name">\${folder.name}</div>
                    <div class="file-details">Cartella • Modificata: \${formatDate(folder.modifiedDate)}</div>
                  </div>
                </div>
              \`;
            });
            
            // File CSV
            contents.files.forEach(file => {
              html += \`
                <div class="file-item csv-item" data-type="file" data-id="\${file.id}" data-name="\${file.name}">
                  <span class="material-icons file-icon csv-icon">description</span>
                  <div class="file-info">
                    <div class="file-name">\${file.name}</div>
                    <div class="file-details">CSV • \${formatBytes(file.size)} • Modificato: \${formatDate(file.modifiedDate)}</div>
                  </div>
                </div>
              \`;
            });
            
            if (html === '') {
              html = \`
                <div class="no-files">
                  <span class="material-icons" style="font-size: 48px; opacity: 0.3;">folder_off</span>
                  <p>Nessun file CSV trovato in questa cartella</p>
                </div>
              \`;
            }
            
            fileListContainer.innerHTML = html;
            
            // Aggiungi event listeners
            document.querySelectorAll('.folder-item').forEach(item => {
              item.addEventListener('click', function() {
                const folderId = this.dataset.id;
                currentFolderId = folderId;
                loadFolderContents(folderId);
              });
            });
            
            document.querySelectorAll('.csv-item').forEach(item => {
              item.addEventListener('click', function() {
                // Rimuovi selezione precedente
                document.querySelectorAll('.file-item.selected').forEach(selected => {
                  selected.classList.remove('selected');
                });
                
                // Seleziona questo elemento
                this.classList.add('selected');
                selectedFileId = this.dataset.id;
                selectedFileName = this.dataset.name;
                
                updateSelectedInfo();
              });
            });
          }
          
          /**
           * Aggiorna il breadcrumb
           */
          function updateBreadcrumb(folderId) {
            console.log('🧭 Aggiornamento breadcrumb per:', folderId);
            
            google.script.run
              .withSuccessHandler(function(breadcrumbData) {
                console.log('✅ Breadcrumb ricevuto:', breadcrumbData);
                let html = '';
                
                breadcrumbData.forEach((item, index) => {
                  if (index > 0) {
                    html += '<span class="breadcrumb-separator">›</span>';
                  }
                  
                  html += \`<span class="breadcrumb-item" data-id="\${item.id}">\${item.name}</span>\`;
                });
                
                breadcrumb.innerHTML = html;
                
                // Aggiungi event listeners al breadcrumb
                document.querySelectorAll('.breadcrumb-item').forEach(item => {
                  item.addEventListener('click', function() {
                    const folderId = this.dataset.id === 'null' ? null : this.dataset.id;
                    currentFolderId = folderId;
                    loadFolderContents(folderId);
                  });
                });
              })
              .withFailureHandler(function(error) {
                console.log('❌ Errore breadcrumb:', error);
                breadcrumb.innerHTML = '<span class="breadcrumb-item">Errore breadcrumb: ' + error + '</span>';
              })
              .getDriveBreadcrumb(folderId);
          }
          
          /**
           * Aggiorna le informazioni del file selezionato
           */
          function updateSelectedInfo() {
            if (selectedFileId) {
              selectedInfo.textContent = \`File selezionato: \${selectedFileName}\`;
              selectBtn.disabled = false;
            } else {
              selectedInfo.textContent = 'Nessun file selezionato';
              selectBtn.disabled = true;
            }
          }
          
          /**
           * Formatta una data
           */
          function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          
          /**
           * Formatta dimensioni in bytes
           */
          function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
          }
          
          // Event listeners per i pulsanti
          selectBtn.addEventListener('click', function() {
            if (selectedFileId) {
              console.log('✅ File selezionato:', selectedFileName);
              
              // Chiama la funzione di importazione
              google.script.run
                .withSuccessHandler(function(result) {
                  if (result.success) {
                    alert('Importazione completata con successo!\\nRighe processate: ' + result.righeProcessate);
                  } else {
                    alert('Errore durante l\\'importazione: ' + result.message);
                  }
                  google.script.host.close();
                })
                .withFailureHandler(function(error) {
                  alert('Errore: ' + error);
                  google.script.host.close();
                })
                .importaDaGoogleDriveById(selectedFileId);
            }
          });
          
          cancelBtn.addEventListener('click', function() {
            console.log('❌ Annullamento selezione file');
            google.script.host.close();
          });
          
          // Supporto tastiera
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && selectedFileId) {
              e.preventDefault();
              selectBtn.click();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancelBtn.click();
            }
          });
          
          console.log('✅ Drive File Picker inizializzato correttamente');
        })();
      </script>
    </body>
    </html>
  `;
}

// ============================
// ESPOSIZIONE GLOBALE MODULO
// ============================

// Espone le funzioni nel namespace globale
this.import_importUI = {
  showLocalFileUploader: showLocalFileUploader,
  getLocalFileUploaderHTML: getLocalFileUploaderHTML,
  showCsvSourceSelector: showCsvSourceSelector,
  getCsvSourceSelectorHTML: getCsvSourceSelectorHTML,
  continueWithGoogleDrive: continueWithGoogleDrive,
  continueWithLocalFile: continueWithLocalFile,
  showDriveFilePicker: showDriveFilePicker,
  getDriveFilePickerHTML: getDriveFilePickerHTML
};

// Espone anche individualmente per retrocompatibilità
this.showLocalFileUploader = showLocalFileUploader;
this.getLocalFileUploaderHTML = getLocalFileUploaderHTML;
this.showCsvSourceSelector = showCsvSourceSelector;
this.getCsvSourceSelectorHTML = getCsvSourceSelectorHTML;
this.continueWithGoogleDrive = continueWithGoogleDrive;
this.continueWithLocalFile = continueWithLocalFile;
this.showDriveFilePicker = showDriveFilePicker;
this.getDriveFilePickerHTML = getDriveFilePickerHTML;
