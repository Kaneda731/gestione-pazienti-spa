function doGet(e) {
  Logger.log('doGet chiamata con parametri: ' + JSON.stringify(e));
  let page = 'index'; // Default to main menu
  if (e && e.parameter && e.parameter.page) {
    page = e.parameter.page;
    Logger.log('Parametro page ricevuto: ' + page);
  } else {
    Logger.log('Nessun parametro page ricevuto, default a: ' + page);
  }

  Logger.log('Caricamento pagina: ' + page);
  let output;
  switch (page) {
    case 'inserimento':
      output = HtmlService.createTemplateFromFile('inserimentoPazienteSupabase.html').evaluate()
        .setTitle('Inserimento Nuovo Paziente');
      break;
    case 'dimissione':
      output = HtmlService.createTemplateFromFile('dimissionePaziente.html').evaluate()
        .setTitle('Dimissione Paziente');
      break;
    case 'grafico':
      output = HtmlService.createTemplateFromFile('grafico.html').evaluate()
        .setTitle('Grafico Diagnosi');
      break;
    case 'login':
      output = HtmlService.createHtmlOutputFromFile('login.html')
        .setTitle('Login');
      break;
    case 'index':
    default:
      output = HtmlService.createTemplateFromFile('index.html').evaluate()
        .setTitle('Menu Principale');
      break;
  }

  Logger.log('Output creato per pagina: ' + page);
  // Imposta la modalità sandbox e le opzioni X-Frame per tutti gli output
  return output
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Aggiunge una nuova riga al foglio "Dati".
 * Modifica il nome del foglio se necessario.
 *
 * @param {string} nome - Il nome inserito dall'utente
 * @param {number} quantita - La quantità inserita dall'utente
 */
function aggiungiRiga(nome, quantita) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("ElencoPazienti");
  if (!sheet) {
    throw new Error('Foglio "ElencoPazienti" non trovato!');
  }
  sheet.appendRow([nome, quantita, new Date()]);
}

function elencaFogli() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var nomi = sheets.map(function(sh) { return sh.getName(); });
  Logger.log(nomi);
}

/**
 * Restituisce l'URL della Web App corrente.
 * @returns {string} L'URL della Web App.
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Server-side function to get the current user session.
 * Called by client-side JavaScript via google.script.run.
 * @returns {object|null} The user session object or null.
 */
function getServerSession() {
  if (typeof authService === 'undefined' || authService === null) {
    Logger.log("authService is not defined or null in getServerSession.");
    return null;
  }
  // authService.getSession() returns a Promise, but Apps Script server-side functions
  // can directly return Promises, and google.script.run handles their resolution.
  return authService.getSession().then(result => result.session);
}

/**
 * Server-side function to log out the current user.
 * Called by client-side JavaScript via google.script.run.
 * @returns {boolean} True if logout was successful, false otherwise.
 */
function serverLogout() {
  if (typeof authService === 'undefined' || authService === null) {
    Logger.log("authService is not defined or null in serverLogout.");
    return false;
  }
  return authService.logout().then(result => !result.error);
}

/**
 * Server-side function to handle user login.
 * Called by client-side JavaScript via google.script.run.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<{session: object|null, error: object|null}>} The session data or an error.
 */
function serverLogin(email, password) {
  if (typeof authService === 'undefined' || authService === null) {
    Logger.log("authService is not defined or null in serverLogin.");
    return { session: null, error: { message: "Auth service not initialized." } };
  }
  return authService.login(email, password);
}

/**
 * Server-side function to get the URL for a specific HTML page.
 * Called by client-side JavaScript via google.script.run.
 * @param {string} pageName - The name of the HTML file (e.g., 'login', 'inserimento').
 * @returns {string} The full URL to the specified HTML page.
 */
function getHtmlPageUrl(pageName) {
  const baseUrl = ScriptApp.getService().getUrl();
  let pageFile = '';
  switch (pageName) {
    case 'inserimento':
      pageFile = 'inserimentoPazienteSupabase.html';
      break;
    case 'dimissione':
      pageFile = 'dimissionePaziente.html';
      break;
    case 'grafico':
      pageFile = 'grafico.html';
      break;
    case 'login':
      pageFile = 'login.html';
      break;
    case 'index':
    default:
      pageFile = 'index.html';
      break;
  }
  // Append a query parameter to indicate the page to load
  return `${baseUrl}?page=${pageName}`;
}