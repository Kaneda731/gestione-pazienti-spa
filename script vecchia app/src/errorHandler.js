/**
 * Sistema unificato di gestione errori e notifiche
 * Centralizza tutti i tipi di dialog e messaggi utente
 * Utilizza il design system centralizzato per uniformità visiva
 */

/**
 * Mostra un dialogo di errore standardizzato
 * @param {string} titolo - Titolo del dialogo
 * @param {string} messaggio - Messaggio principale
 * @param {string} dettagli - Dettagli aggiuntivi (opzionale)
 */
function mostraErrore(titolo, messaggio, dettagli = '') {
  const htmlContent = `
    <div class="dialog-container">
      <div class="message-dialog error">
        <div class="dialog-icon">
          <span class="material-icons">error</span>
        </div>
        <div class="dialog-content">
          <h3 class="dialog-title">${escapeHtml(titolo)}</h3>
          <p class="dialog-message">${escapeHtml(messaggio)}</p>
          ${dettagli ? `<div class="dialog-details">${escapeHtml(dettagli)}</div>` : ''}
        </div>
        <div class="dialog-buttons">
          <button class="btn btn-primary" onclick="google.script.host.close()">
            <span class="material-icons">check</span>
            OK
          </button>
        </div>
      </div>
    </div>
  `;

  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Errore</title>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${DesignSystem.getMainCSS()}
        ${DesignSystem.getSelectionDialogCSS()}
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `).setWidth(450).setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Errore');
  
  // Log dell'errore
  logAvanzato(`ERRORE - ${titolo}: ${messaggio}`, 'ERROR', { dettagli });
}

/**
 * Mostra un dialogo di successo standardizzato
 * @param {string} titolo - Titolo del dialogo
 * @param {string} messaggio - Messaggio principale
 * @param {string} dettagli - Dettagli aggiuntivi (opzionale)
 */
function mostraSuccesso(titolo, messaggio, dettagli = '') {
  const htmlContent = `
    <div class="dialog-container">
      <div class="message-dialog success">
        <div class="dialog-icon">
          <span class="material-icons">check_circle</span>
        </div>
        <div class="dialog-content">
          <h3 class="dialog-title">${escapeHtml(titolo)}</h3>
          <p class="dialog-message">${escapeHtml(messaggio)}</p>
          ${dettagli ? `<div class="dialog-details">${escapeHtml(dettagli)}</div>` : ''}
        </div>
        <div class="dialog-buttons">
          <button class="btn btn-primary" onclick="google.script.host.close()">
            <span class="material-icons">check</span>
            OK
          </button>
        </div>
      </div>
    </div>
  `;

  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Operazione Completata</title>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${DesignSystem.getMainCSS()}
        ${DesignSystem.getSelectionDialogCSS()}
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `).setWidth(450).setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Operazione Completata');
  
  // Log del successo
  logAvanzato(`SUCCESSO - ${titolo}: ${messaggio}`, 'INFO', { dettagli });
}

/**
 * Mostra un dialogo di avviso/warning
 * @param {string} titolo - Titolo del dialogo
 * @param {string} messaggio - Messaggio principale
 * @param {string} dettagli - Dettagli aggiuntivi (opzionale)
 */
function mostraAvviso(titolo, messaggio, dettagli = '') {
  const htmlContent = `
    <div class="dialog-container">
      <div class="message-dialog warning">
        <div class="dialog-icon">
          <span class="material-icons">warning</span>
        </div>
        <div class="dialog-content">
          <h3 class="dialog-title">${escapeHtml(titolo)}</h3>
          <p class="dialog-message">${escapeHtml(messaggio)}</p>
          ${dettagli ? `<div class="dialog-details">${escapeHtml(dettagli)}</div>` : ''}
        </div>
        <div class="dialog-buttons">
          <button class="btn btn-primary" onclick="google.script.host.close()">
            <span class="material-icons">check</span>
            OK
          </button>
        </div>
      </div>
    </div>
  `;

  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Attenzione</title>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${DesignSystem.getMainCSS()}
        ${DesignSystem.getSelectionDialogCSS()}
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `).setWidth(450).setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Attenzione');
  
  // Log dell'avviso
  logAvanzato(`AVVISO - ${titolo}: ${messaggio}`, 'WARN', { dettagli });
}

/**
 * Mostra un dialogo di conferma con due opzioni
 * @param {string} titolo - Titolo del dialogo
 * @param {string} messaggio - Messaggio principale
 * @param {Function} onConfirm - Callback per conferma
 * @param {Function} onCancel - Callback per annullamento (opzionale)
 */
function mostraConferma(titolo, messaggio, onConfirm, onCancel = null) {
  const htmlContent = `
    <div class="dialog-container">
      <div class="message-dialog confirm">
        <div class="dialog-icon">
          <span class="material-icons">help</span>
        </div>
        <div class="dialog-content">
          <h3 class="dialog-title">${escapeHtml(titolo)}</h3>
          <p class="dialog-message">${escapeHtml(messaggio)}</p>
        </div>
        <div class="dialog-buttons">
          <button class="btn btn-secondary" onclick="handleCancel()">
            <span class="material-icons">close</span>
            Annulla
          </button>
          <button class="btn btn-primary" onclick="handleConfirm()">
            <span class="material-icons">check</span>
            Conferma
          </button>
        </div>
      </div>
    </div>
    <script>
      function handleConfirm() {
        google.script.run
          .withSuccessHandler(() => google.script.host.close())
          .withFailureHandler((error) => {
            console.error('Errore:', error);
            google.script.host.close();
          })
          .${onConfirm.name}();
      }
      
      function handleCancel() {
        ${onCancel ? `
          google.script.run
            .withSuccessHandler(() => google.script.host.close())
            .withFailureHandler((error) => {
              console.error('Errore:', error);
              google.script.host.close();
            })
            .${onCancel.name}();
        ` : 'google.script.host.close();'}
      }
    </script>
  `;

  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Conferma Operazione</title>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        ${DesignSystem.getMainCSS()}
        ${DesignSystem.getSelectionDialogCSS()}
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `).setWidth(450).setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Conferma Operazione');
}

/**
 * Sistema di notifiche toast per feedback immediato
 * @param {string} messaggio - Messaggio da mostrare
 * @param {string} tipo - Tipo di notifica ('success', 'error', 'warning', 'info')
 * @param {number} durata - Durata in millisecondi (default: 3000)
 */
function mostraToast(messaggio, tipo = 'info', durata = 3000) {
  // Implementazione toast utilizzando il design system
  const toastHtml = `
    <div id="toast" class="toast ${tipo}">
      <span class="material-icons">${getToastIcon(tipo)}</span>
      <span class="toast-message">${escapeHtml(messaggio)}</span>
    </div>
    <script>
      setTimeout(() => {
        document.getElementById('toast').style.opacity = '0';
        setTimeout(() => google.script.host.close(), 300);
      }, ${durata});
    </script>
  `;

  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${DesignSystem.getMainCSS()}
        ${DesignSystem.getToastCSS()}
      </style>
    </head>
    <body>
      ${toastHtml}
    </body>
    </html>
  `).setWidth(300).setHeight(80);
  
  SpreadsheetApp.getUi().showModelessDialog(html, '');
  
  // Log del toast
  logAvanzato(`TOAST ${tipo.toUpperCase()}: ${messaggio}`, tipo.toUpperCase());
}

/**
 * Restituisce l'icona appropriata per il tipo di toast
 * @param {string} tipo - Tipo di toast
 * @returns {string} Nome dell'icona Material
 */
function getToastIcon(tipo) {
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  return icons[tipo] || 'info';
}

/**
 * Gestisce gli errori in modo robusto con fallback
 * @param {Error} error - Errore da gestire
 * @param {string} contesto - Contesto in cui è avvenuto l'errore
 * @param {boolean} mostraUtente - Se mostrare l'errore all'utente
 */
function gestisciErrore(error, contesto = '', mostraUtente = true) {
  const messaggioErrore = error.message || 'Errore sconosciuto';
  const dettagli = `Contesto: ${contesto}\nStack: ${error.stack || 'Non disponibile'}`;
  
  // Log sempre l'errore
  logAvanzato(`Errore in ${contesto}`, 'ERROR', {
    messaggio: messaggioErrore,
    stack: error.stack
  });
  
  // Mostra all'utente se richiesto
  if (mostraUtente) {
    try {
      mostraErrore(
        'Si è verificato un errore',
        messaggioErrore,
        contesto ? `Errore durante: ${contesto}` : ''
      );
    } catch (dialogError) {
      // Fallback se anche il dialogo fallisce
      SpreadsheetApp.getUi().alert(
        'Errore',
        `Si è verificato un errore: ${messaggioErrore}`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
  }
}

/**
 * Oggetto ErrorHandler per compatibilità con i test
 * Espone tutte le funzioni di gestione errori
 */
const ErrorHandler = {
  mostraErrore,
  mostraSuccesso,
  gestisciErrore,
  logAvanzato,
  
  // Metodi di utility
  getErrorDialogCSS: () => DesignSystem.getMainCSS() + DesignSystem.getSelectionDialogCSS(),
  
  // Verifica disponibilità funzioni
  isAvailable: () => true
};
