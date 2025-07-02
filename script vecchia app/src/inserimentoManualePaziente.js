/**
 * Sistema per l'inserimento manuale di pazienti direttamente in ElencoPazienti
 * Integrato con il Design System esistente e l'architettura modulare
 * Utilizza valori validati per i campi select
 * 
 * @author ScriptPazienti
 * @version 1.1.0
 */

/**
 * Struttura del foglio ElencoPazienti basata sulla specifica del modulo
 * Inserimento diretto nella prima riga vuota con valori validati
 */
const STRUTTURA_DATI_PAZIENTI = [
  { 
    nome: 'Nome', 
    tipo: 'text', 
    obbligatorio: true,
    colonna: 'A',
    indice: 1,
    placeholder: 'Inserisci il nome del paziente',
    validazione: 'nome'
  },
  { 
    nome: 'Cognome', 
    tipo: 'text', 
    obbligatorio: true,
    colonna: 'B',
    indice: 2,
    placeholder: 'Inserisci il cognome del paziente',
    validazione: 'nome'
  },
  { 
    nome: 'Reparto Appartenenza', 
    tipo: 'select',
    opzioni: ['Ortopedia', 'Chirurgia Arti', 'Plastica'],
    obbligatorio: true,
    colonna: 'C',
    indice: 3,
    placeholder: 'Seleziona il reparto di appartenenza'
  },
  { 
    nome: 'Diagnosi', 
    tipo: 'select',
    opzioni: ['Politrauma', 'Frattura_Femore', 'Frattura_Gamba', 'Gonartrosi', 'Frattura_Bacino', 'Frattura_Spalla', 'NeoFormazione Cute', 'Frattura_Mano', 'Frattura_Polso', 'Ulcera', 'Deiescenza_Ferita', 'Artrosi_Spalla', 'Lesione_Tendinea', 'Frattura_Periprotesica', 'FLC', 'Protesi_Mammaria'],
    obbligatorio: true,
    colonna: 'D',
    indice: 4,
    placeholder: 'Seleziona la diagnosi'
  },
  { 
    nome: 'Reparto Provenienza', 
    tipo: 'select',
    opzioni: ['AR', 'PO', 'CO', 'CR', 'PS'],
    obbligatorio: false,
    colonna: 'E',
    indice: 5,
    placeholder: 'Seleziona il reparto di provenienza'
  },
  { 
    nome: 'Data di Ricovero', 
    tipo: 'date', 
    obbligatorio: true,
    colonna: 'F',
    indice: 6,
    placeholder: 'dd/mm/aaaa',
    validazione: 'data'
  },
  { 
    nome: 'Livello Assistenza', 
    tipo: 'select',
    opzioni: ['Bassa', 'Media', 'Alta'],
    obbligatorio: true,
    colonna: 'G',
    indice: 7,
    placeholder: 'Seleziona il livello di assistenza'
  }
];

/**
 * Mostra la finestra di dialogo per l'inserimento manuale di un nuovo paziente
 */
function mostraDialogInserimentoPaziente() {
  try {
    console.log('=== INIZIO DEBUG DIALOG ===');
    
    // Verifica che i fogli esistano
    verificaEsistenzaFogli();
    
    // Legge la struttura predefinita
    console.log('1. Caricamento struttura predefinita...');
    const struttura = getStrutturaFoglioDinamica();
    console.log('2. Struttura ottenuta:', struttura.length, 'campi');
    
    // Debug: verifica le opzioni per ogni campo select
    struttura.forEach((campo, index) => {
      if (campo.tipo === 'select') {
        console.log('3. Campo select "' + campo.nome + '": ' + 
                   (campo.opzioni ? campo.opzioni.length : 0) + ' opzioni -', 
                   campo.opzioni);
      }
    });
    
    console.log('4. Generazione HTML...');
    const html = generaHTMLInserimentoPaziente(struttura);
    console.log('5. HTML generato, lunghezza:', html.length);
    
    const css = DesignSystem.getMainCSS() + getInserimentoPazienteCSS();
    
    const htmlOutput = HtmlService
      .createHtmlOutput(html + `<style>${css}</style>`)
      .setWidth(UI_CONFIG.DIALOG_WIDTH_LARGE || 700)
      .setHeight(UI_CONFIG.DIALOG_HEIGHT_LARGE || 600);
      
    console.log('6. Apertura dialog...');
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📝 Inserimento Nuovo Paziente');
    console.log('=== FINE DEBUG DIALOG ===');
    
  } catch (error) {
    console.error('Errore in mostraDialogInserimentoPaziente:', error);
    SpreadsheetApp.getUi().alert(
      'Errore',
      `Impossibile aprire il dialogo di inserimento: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Verifica che il foglio ElencoPazienti esista nel documento
 */
function verificaEsistenzaFogli() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const foglio = ss.getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);
  
  if (!foglio) {
    throw new Error(`Il foglio '${SHEET_NAMES.ELENCO_PAZIENTI}' non esiste nel documento corrente.`);
  }
}

/**
 * Legge la struttura dinamica del foglio ElencoPazienti se esiste
 * @returns {Array} Struttura dei campi
 */
function getStrutturaFoglioDinamica() {
  // Ritorna direttamente la struttura predefinita con i primi 7 campi per ElencoPazienti
  return STRUTTURA_DATI_PAZIENTI.slice(0, 7);
}

/**
 * Genera l'HTML per la finestra di inserimento paziente
 * @param {Array} struttura - Struttura dei campi
 * @returns {string} HTML della finestra
 */
function generaHTMLInserimentoPaziente(struttura) {
  const campiHTML = generaCampiForm(struttura);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    </head>
    <body>
      <div class="dialog-container">
        <!-- Header uniforme al design system -->
        <div class="dialog-header">
          <h2>
            <span class="material-icons">person_add</span>
            Inserimento Nuovo Paziente
          </h2>
          <p class="subtitle">Compila i campi per aggiungere un nuovo paziente al sistema</p>
        </div>
        
        <!-- Content con stile progetto -->
        <div class="dialog-content">
          <form id="pazienteForm">
            ${campiHTML}
            
            <!-- Actions uniforme al design system -->
            <div class="btn-group">
              <button type="button" class="btn btn-secondary" onclick="google.script.host.close()">
                <span class="material-icons">close</span>
                Annulla
              </button>
              <button type="submit" class="btn btn-primary">
                <span class="material-icons">save</span>
                Salva Paziente
              </button>
            </div>
          </form>
        </div>
        
        <!-- Loading overlay -->
        <div id="loadingOverlay" class="loading-overlay" style="display: none;">
          <div class="loading">
            <div class="spinner"></div>
            <span>Salvando paziente...</span>
          </div>
        </div>
        
        <!-- Status container per notifiche -->
        <div id="statusContainer" class="status-container"></div>
      </div>

      <script>
        // Configurazione globale
        let validazioneAttiva = true;

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
          inizializzaForm();
        });

        document.getElementById('pazienteForm').addEventListener('submit', function(e) {
          e.preventDefault();
          salvaPaziente();
        });

        function inizializzaForm() {
          // DEBUG: Verifica opzioni nei select fields
          console.log('DEBUG: Inizializzazione form - Controllo opzioni select');
          document.querySelectorAll('select').forEach(select => {
            const nomeSelect = select.name || select.id;
            const opzioni = Array.from(select.options).map(opt => opt.value).filter(v => v);
            console.log('Select "' + nomeSelect + '": ' + opzioni.length + ' opzioni disponibili:', opzioni);
            
            if (opzioni.length === 0) {
              console.warn('ATTENZIONE: Select "' + nomeSelect + '" non ha opzioni!');
              // Aggiungi indicatore visivo di errore
              select.style.borderColor = 'red';
              select.style.backgroundColor = '#ffe6e6';
            }
          });
          
          // Aggiungi validazione real-time sui campi obbligatori
          document.querySelectorAll('input[required], select[required], textarea[required]').forEach(campo => {
            campo.addEventListener('blur', function() {
              validaCampo(this);
            });
            
            campo.addEventListener('input', function() {
              rimuoviErrore(this);
            });
          });

          // Gestione tasti speciali
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              google.script.host.close();
            }
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault();
              document.getElementById('pazienteForm').dispatchEvent(new Event('submit'));
            }
          });

          // Focus sul primo campo
          const primoInput = document.querySelector('input:not([readonly]):not([disabled])');
          if (primoInput) {
            primoInput.focus();
          }
        }

        /**
         * Valida un singolo campo
         */
        function validaCampo(campo) {
          const valore = campo.value.trim();
          const required = campo.hasAttribute('required');
          
          rimuoviErrore(campo);
          
          if (required && !valore) {
            mostraErroreCampo(campo, 'Questo campo è obbligatorio');
            return false;
          }
          
          // Validazioni specifiche per tipo
          const tipo = campo.type;
          switch (tipo) {
            case 'email':
              if (valore && !validaEmail(valore)) {
                mostraErroreCampo(campo, 'Formato email non valido');
                return false;
              }
              break;
              
            case 'tel':
              if (valore && !validaTelefono(valore)) {
                mostraErroreCampo(campo, 'Formato telefono non valido');
                return false;
              }
              break;
              
            case 'date':
              if (valore && !validaData(valore)) {
                mostraErroreCampo(campo, 'Data non valida');
                return false;
              }
              break;
              
            case 'number':
              const min = campo.getAttribute('min');
              const max = campo.getAttribute('max');
              const numero = parseInt(valore);
              
              if (valore && (isNaN(numero) || 
                  (min && numero < parseInt(min)) || 
                  (max && numero > parseInt(max)))) {
                mostraErroreCampo(campo, 'Valore deve essere tra ' + (min || 0) + ' e ' + (max || 999));
                return false;
              }
              break;
          }
          
          // Validazione pattern
          const pattern = campo.getAttribute('pattern');
          if (valore && pattern && !new RegExp(pattern).test(valore)) {
            mostraErroreCampo(campo, 'Formato non valido');
            return false;
          }
          
          return true;
        }

        /**
         * Mostra errore su un campo
         */
        function mostraErroreCampo(campo, messaggio) {
          campo.classList.add('error');
          const gruppo = campo.closest('.campo-gruppo');
          if (gruppo) {
            let errorDiv = gruppo.querySelector('.error-message');
            if (!errorDiv) {
              errorDiv = document.createElement('div');
              errorDiv.className = 'error-message';
              gruppo.appendChild(errorDiv);
            }
            errorDiv.textContent = messaggio;
          }
        }

        /**
         * Rimuove errore da un campo
         */
        function rimuoviErrore(campo) {
          campo.classList.remove('error');
          const gruppo = campo.closest('.campo-gruppo');
          if (gruppo) {
            const errorDiv = gruppo.querySelector('.error-message');
            if (errorDiv) {
              errorDiv.remove();
            }
          }
        }

        /**
         * Validazioni helper
         */
        function validaEmail(email) {
          return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
        }

        function validaTelefono(tel) {
          return /^[\\+]?[0-9\\s\\-\\(\\)]{8,}$/.test(tel);
        }

        function validaData(data) {
          const date = new Date(data);
          return date instanceof Date && !isNaN(date);
        }

        /**
         * Raccoglie e valida tutti i dati del form
         */
        function salvaPaziente() {
          const formData = new FormData(document.getElementById('pazienteForm'));
          const paziente = {};
          let hasErrors = false;
          
          // Valida tutti i campi
          document.querySelectorAll('input, select, textarea').forEach(campo => {
            if (!validaCampo(campo)) {
              hasErrors = true;
            }
          });
          
          if (hasErrors) {
            showStatus('error', 'Correggi gli errori evidenziati prima di salvare');
            return;
          }
          
          // Raccogli i dati
          for (let [key, value] of formData.entries()) {
            // Converti valori vuoti in null per consistenza
            paziente[key] = value.trim() || null;
          }
          
          // Mostra loading
          const submitBtn = document.querySelector('button[type="submit"]');
          const loadingOverlay = document.getElementById('loadingOverlay');
          
          if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
          }
          
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Salvando...';
          }
          
          // Invia i dati al server
          google.script.run
            .withSuccessHandler(onSalvataggioSuccess)
            .withFailureHandler(onSalvataggioError)
            .salvaNuovoPaziente(paziente);
        }

        /**
         * Gestisce il successo del salvataggio
         */
        function onSalvataggioSuccess(risultato) {
          const loadingOverlay = document.getElementById('loadingOverlay');
          if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
          }
          
          if (risultato.success) {
            showStatus('success', 'Paziente salvato con successo! Riga: ' + (risultato.riga || ''));
            
            // Disabilita il form
            const form = document.getElementById('pazienteForm');
            const inputs = form.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => input.disabled = true);
            
            // Chiude la finestra dopo un breve delay
            setTimeout(() => {
              google.script.host.close();
            }, 2000);
          } else {
            onSalvataggioError(new Error(risultato.message || 'Errore sconosciuto'));
          }
        }

        /**
         * Gestisce gli errori di salvataggio
         */
        function onSalvataggioError(error) {
          console.error('Errore salvataggio:', error);
          
          const loadingOverlay = document.getElementById('loadingOverlay');
          if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
          }
          
          showStatus('error', 'Errore nel salvataggio: ' + error.message);
          
          // Ripristina il bottone
          const submitBtn = document.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.innerHTML = '<span class="material-icons">save</span> Salva Paziente';
            submitBtn.disabled = false;
          }
        }

        /**
         * Mostra notifiche con stile design system
         */
        function showStatus(type, message) {
          const container = document.getElementById('statusContainer');
          if (!container) return;
          
          const status = document.createElement('div');
          status.className = 'status ' + type;
          status.innerHTML = 
            '<span class="material-icons">' +
              (type === 'success' ? 'check_circle' : 
               type === 'error' ? 'error' : 'info') +
            '</span>' + message;
          
          container.appendChild(status);
          
          // Auto-rimozione
          setTimeout(() => {
            if (status.parentNode) {
              status.remove();
            }
          }, type === 'error' ? 8000 : 5000);
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Genera i campi del form in sezioni organizzate
 * @param {Array} struttura - Struttura dei campi
 * @returns {string} HTML dei campi
 */
function generaCampiForm(struttura) {
  // Organizza i campi in sezioni logiche
  const sezioni = {
    'Dati Anagrafici': [],
    'Ricovero': [],
    'Altro': []
  };
  
  struttura.forEach(campo => {
    const nome = campo.nome.toLowerCase();
    if (nome.includes('nome') || nome.includes('cognome')) {
      sezioni['Dati Anagrafici'].push(campo);
    } else if (nome.includes('data') || nome.includes('diagnosi') || nome.includes('reparto') || nome.includes('livello')) {
      sezioni['Ricovero'].push(campo);
    } else {
      sezioni['Altro'].push(campo);
    }
  });
  
  let html = '';
  
  Object.keys(sezioni).forEach(nomeSezione => {
    const campiSezione = sezioni[nomeSezione];
    if (campiSezione.length > 0) {
      html += `
        <div class="form-section">
          <h3 class="section-title">
            <span class="material-icons">${getSectionIcon(nomeSezione)}</span>
            ${nomeSezione}
          </h3>
          <div class="fields-grid">
            ${campiSezione.map(campo => generaCampoHTML(campo)).join('')}
          </div>
        </div>
      `;
    }
  });
  
  return html;
}

/**
 * Restituisce l'icona appropriata per la sezione
 * @param {string} nomeSezione - Nome della sezione
 * @returns {string} Nome dell'icona Material
 */
function getSectionIcon(nomeSezione) {
  switch (nomeSezione) {
    case 'Dati Anagrafici': return 'person';
    case 'Ricovero': return 'local_hospital';
    default: return 'folder';
  }
}

/**
 * Genera l'HTML per un singolo campo
 * @param {Object} campo - Definizione del campo
 * @returns {string} HTML del campo
 */
function generaCampoHTML(campo) {
  const required = campo.obbligatorio ? 'required' : '';
  const fieldId = `campo_${campo.indice}`;
  const asterisco = campo.obbligatorio ? ' *' : '';
  
  let inputHTML = '';
  
  switch (campo.tipo) {
    case 'select':
      const opzioni = campo.opzioni || [];
      inputHTML = `
        <select id="${fieldId}" 
                name="${campo.nome}" 
                class="form-select" 
                ${required}>
          <option value="">${campo.placeholder || 'Seleziona...'}</option>
          ${opzioni.map(opzione => `<option value="${opzione}">${opzione}</option>`).join('')}
        </select>
      `;
      break;
      
    case 'textarea':
      inputHTML = `
        <textarea id="${fieldId}" 
                  name="${campo.nome}" 
                  class="form-input" 
                  rows="3" 
                  placeholder="${campo.placeholder || ''}"
                  ${required}></textarea>
      `;
      break;
      
    default:
      const extraAttrs = [];
      if (campo.min !== undefined) extraAttrs.push(`min="${campo.min}"`);
      if (campo.max !== undefined) extraAttrs.push(`max="${campo.max}"`);
      if (campo.pattern) extraAttrs.push(`pattern="${campo.pattern}"`);
      
      inputHTML = `
        <input type="${campo.tipo}" 
               id="${fieldId}" 
               name="${campo.nome}" 
               class="form-input" 
               placeholder="${campo.placeholder || ''}"
               ${extraAttrs.join(' ')}
               ${required} />
      `;
      break;
  }
  
  return `
    <div class="form-group">
      <label class="form-label" for="${fieldId}">
        ${campo.nome}${asterisco}
        ${campo.colonna ? `<span class="field-hint">(Colonna ${campo.colonna})</span>` : ''}
      </label>
      ${inputHTML}
    </div>
  `;
}

/**
 * Salva il nuovo paziente direttamente nel foglio ElencoPazienti
 * @param {Object} datiPaziente - Dati del paziente da salvare
 * @returns {Object} Risultato dell'operazione
 */
function salvaNuovoPaziente(datiPaziente) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const foglioElenco = ss.getSheetByName(SHEET_NAMES.ELENCO_PAZIENTI);
    
    if (!foglioElenco) {
      throw new Error('Foglio ElencoPazienti non trovato.');
    }
    
    // Salva direttamente in ElencoPazienti
    const rigaInserita = salvaDatiInElencoPazienti(foglioElenco, datiPaziente);
    
    // Applica formattazione se disponibile
    try {
      if (typeof applicaColoriAlternati === 'function') {
        applicaColoriAlternati(foglioElenco);
      }
    } catch (formatError) {
      console.warn('Errore nell\'applicazione dei colori alternati:', formatError.message);
    }
    
    // Log dell'operazione
    console.log(`Nuovo paziente inserito in ElencoPazienti: ${datiPaziente.Nome} ${datiPaziente.Cognome} (riga ${rigaInserita})`);
    
    return { 
      success: true, 
      riga: rigaInserita,
      message: 'Paziente salvato con successo'
    };
    
  } catch (error) {
    console.error('Errore in salvaNuovoPaziente:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Salva i dati direttamente nel foglio ElencoPazienti
 * @param {Object} foglio - Foglio ElencoPazienti
 * @param {Object} datiPaziente - Dati del paziente
 * @returns {number} Numero della riga inserita
 */
function salvaDatiInElencoPazienti(foglio, datiPaziente) {
  // Trova la prima riga vuota in ElencoPazienti
  const destValues = foglio.getRange('A1:A').getValues();
  let rigaInserimento = destValues.findIndex(row => row[0] === '');
  if (rigaInserimento === -1) {
    rigaInserimento = destValues.length;
  }
  rigaInserimento += 1; // Converti a 1-based
  
  // Mappa i dati alle colonne di ElencoPazienti (fino a colonna G)
  const valori = new Array(7).fill('');
  
  // Mapping specifico per ElencoPazienti basato sulla nuova struttura
  if (datiPaziente['Nome']) {
    valori[0] = datiPaziente['Nome']; // Colonna A
  }
  if (datiPaziente['Cognome']) {
    valori[1] = datiPaziente['Cognome']; // Colonna B
  }
  if (datiPaziente['Reparto Appartenenza']) {
    valori[2] = datiPaziente['Reparto Appartenenza']; // Colonna C
  }
  if (datiPaziente['Diagnosi']) {
    valori[3] = datiPaziente['Diagnosi']; // Colonna D
  }
  if (datiPaziente['Reparto Provenienza']) {
    valori[4] = datiPaziente['Reparto Provenienza']; // Colonna E
  }
  if (datiPaziente['Data di Ricovero']) {
    try {
      valori[5] = new Date(datiPaziente['Data di Ricovero']); // Colonna F
    } catch (dateError) {
      console.warn('Errore parsing data di ricovero:', dateError.message);
      valori[5] = datiPaziente['Data di Ricovero'];
    }
  }
  if (datiPaziente['Livello Assistenza']) {
    valori[6] = datiPaziente['Livello Assistenza']; // Colonna G
  }
  
  // Imposta i valori nel foglio (colonne A-G)
  foglio.getRange(rigaInserimento, 1, 1, 7).setValues([valori]);
  
  // Applica formattazione data
  if (datiPaziente['Data di Ricovero']) {
    try {
      foglio.getRange(rigaInserimento, 6).setNumberFormat('dd/mm/yyyy'); // Colonna F
    } catch (formatError) {
      console.warn('Errore formattazione data di ricovero:', formatError.message);
    }
  }
  
  // Applica formattazione standard (bordi e altezza riga)
  const range = foglio.getRange(rigaInserimento, 1, 1, 7);
  range.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  foglio.setRowHeight(rigaInserimento, 28);
  
  return rigaInserimento;
}

/**
 * CSS minimal per il dialogo inserimento paziente
 * @returns {string} CSS essenziale
 */
function getInserimentoPazienteCSS() {
  return `
    /* CSS Variables essenziali */
    :root {
      --primary-blue: #1A73E8;
      --success-green: #34A853;
      --error-red: #EA4335;
      --border-gray: #DADCE0;
      --bg-light: #F8F9FA;
    }

    /* Layout base */
    body {
      font-family: 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #fff;
    }

    .dialog-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    /* Header */
    .dialog-header {
      background: linear-gradient(135deg, var(--primary-blue), #4285f4);
      color: white;
      padding: 20px;
      text-align: center;
    }

    .dialog-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .subtitle {
      margin-top: 8px;
      opacity: 0.9;
      font-size: 0.9rem;
    }

    /* Content */
    .dialog-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    /* Form sections */
    .form-section {
      background: white;
      border: 1px solid var(--border-gray);
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .section-title {
      background: var(--bg-light);
      padding: 16px 20px;
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: var(--primary-blue);
      border-bottom: 1px solid var(--border-gray);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .fields-grid {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    /* Form elements */
    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
      color: #333;
    }

    .field-hint {
      font-size: 0.75rem;
      color: #666;
      font-weight: normal;
      margin-left: 8px;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-gray);
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
    }

    .form-input[required], .form-select[required] {
      border-left: 3px solid var(--primary-blue);
    }

    .form-input.error, .form-select.error {
      border-color: var(--error-red);
      background-color: rgba(234, 67, 53, 0.05);
    }

    /* Buttons */
    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border-gray);
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      min-width: 120px;
      justify-content: center;
    }

    .btn-primary {
      background: var(--primary-blue);
      color: white;
    }

    .btn-primary:hover {
      background: #1557b0;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: var(--bg-light);
      color: #333;
      border: 1px solid var(--border-gray);
    }

    .btn-secondary:hover {
      background: #e8eaed;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Loading overlay */
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border-gray);
      border-top: 3px solid var(--primary-blue);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Status messages */
    .status {
      padding: 16px;
      border-radius: 6px;
      margin: 16px 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
    }

    .status.success {
      background: rgba(52, 168, 83, 0.1);
      border: 1px solid var(--success-green);
      color: var(--success-green);
    }

    .status.error {
      background: rgba(234, 67, 53, 0.1);
      border: 1px solid var(--error-red);
      color: var(--error-red);
    }

    /* Error messages */
    .error-message {
      color: var(--error-red);
      font-size: 12px;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .fields-grid {
        grid-template-columns: 1fr;
        padding: 16px;
      }
      
      .dialog-content {
        padding: 16px;
      }
      
      .btn-group {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
      }
    }

    /* Material Icons */
    .material-icons {
      font-family: 'Material Icons';
      font-weight: normal;
      font-style: normal;
      font-size: 18px;
      line-height: 1;
      text-transform: none;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-feature-settings: 'liga';
    }
  `;
}

/**
 * Test semplice per verificare il funzionamento del sistema
 */
function testInserimentoPaziente() {
  try {
    console.log('🧪 Test inserimento paziente...');
    
    // Test struttura
    const struttura = getStrutturaFoglioDinamica();
    console.log('✅ Struttura caricata:', struttura.length, 'campi');
    
    // Test campi select
    const campiSelect = struttura.filter(c => c.tipo === 'select');
    console.log('✅ Campi select:', campiSelect.length);
    
    campiSelect.forEach(campo => {
      const numOpzioni = campo.opzioni ? campo.opzioni.length : 0;
      console.log(`  ${campo.nome}: ${numOpzioni} opzioni`);
    });
    
    console.log('✅ Test completato con successo');
    return true;
    
  } catch (error) {
    console.error('❌ Errore nel test:', error);
    return false;
  }
}
