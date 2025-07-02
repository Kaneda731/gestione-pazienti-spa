/**
 * Aggiunge un menu personalizzato al foglio di calcolo
 * Menu principale del sistema ScriptPazienti
 */
function creaMenuPrincipale() {
  const ui = SpreadsheetApp.getUi();
  
  // Menu principale con sottomenu organizzati
  ui.createMenu('🏥 Gestione Pazienti')
    .addSubMenu(ui.createMenu('📈 Analisi e Grafici')
      .addItem('📊 Crea Grafico Avanzato', 'creaGraficoAvanzato')
      .addItem('⏱️ Tempo Medio Degenza', 'calcolaTempoMedioDegenza'))
    .addSubMenu(ui.createMenu('👤 Gestione Pazienti')
      .addItem('📝 Nuovo Paziente', 'mostraDialogInserimentoPaziente')
      .addItem('➕ Dimetti Paziente', 'inserisciDataDimissione')
      .addItem('🔄 Avvia Importazione CSV', 'importaDatiDaCSV'))
    .addSubMenu(ui.createMenu('📋 Filtri e Fogli')
      .addItem('📋 Crea Foglio Filtrato', 'avviaFiltroInterattivo')
      .addItem('🔄 Aggiorna Foglio Attivo', 'aggiornaFoglioFiltroSuAttivazione'))
    .addSubMenu(ui.createMenu('🎨 Formattazione')
      .addItem('✨ Applica Formattazione Standard', 'ApplicaFormattazioneStandard')
      .addItem('🌈 Applica Colori Alternati', 'applicaColoriAlternatiStandalone')
      .addItem('📋 Copia Senza Formattazione', 'CopiaIncollaSenzaTendine')) // <-- NUOVA RIGA AGGIUNTA QUI
    .addToUi();
}

/**
 * Funzione chiamata automaticamente all'apertura del foglio
 * Crea il menu principale del sistema
 */
function onOpen() {
  // Esegue la creazione di ogni menu in un blocco separato
  // per garantire che un errore in un menu non blocchi gli altri.
  try {
    creaMenuPrincipale();
  } catch (error) {
    console.error('Errore nella creazione del menu principale:', error.stack);
  }

  // Se hai un menu di diagnostica, è buona norma isolarlo.
  // Assicurati che la funzione `creaMenuDiagnostica` esista.
  try {
    if (typeof creaMenuDiagnostica === 'function') {
      creaMenuDiagnostica();
    }
  } catch (error) {
    console.error('Errore nella creazione del menu di diagnostica:', error.stack);
  }
}
