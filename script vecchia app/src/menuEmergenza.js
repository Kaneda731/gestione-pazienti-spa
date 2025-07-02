/**
 * MENU SEMPLICE E FUNZIONANTE
 * Questo è un menu minimalista che dovrebbe funzionare sempre
 */

function menuSemplice() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    ui.createMenu('🏥 Pazienti')
      .addItem('➕ Dimetti Paziente', 'inserisciDataDimissione')
      .addItem('📋 Filtro Pazienti', 'avviaFiltroInterattivo')
      .addItem('🌈 Colori Alternati', 'applicaColoriAlternatiStandalone')
      .addItem('📊 Grafico Torta', 'creaGraficoAvanzato')
      .addSeparator()
      .addItem('🔧 Menu Completo', 'onOpen')
      .addToUi();
    
    console.log('✅ Menu semplice creato');
    
  } catch (error) {
    console.error('❌ Errore menu semplice:', error);
    // Fallback estremo
    SpreadsheetApp.getUi().alert('Errore Menu', 'Errore: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Funzione di test per inserisciDataDimissione
 */
function testDimettiPaziente() {
  try {
    inserisciDataDimissione();
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'Errore Test', 
      'Errore nella funzione inserisciDataDimissione: ' + error.message + '\n\nStack: ' + error.stack, 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Menu di emergenza assoluto - Solo funzioni base
 */
function menuEmergenzaAssoluto() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    ui.createMenu('🚨 Emergenza')
      .addItem('Test Dimetti', 'testDimettiPaziente')
      .addItem('Menu Base', 'menuSemplice')
      .addToUi();
    
    SpreadsheetApp.getUi().alert('Menu Emergenza', 'Menu di emergenza creato. Prova "Test Dimetti" per verificare la funzione.', SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (error) {
    console.error('Errore menu emergenza assoluto:', error);
  }
}
