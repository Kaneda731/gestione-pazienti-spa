/**
 * Gestione dei modal per i grafici
 */
class ChartModals {
  /**
   * Inizializza il gestore dei modal
   */
  constructor() {
    this._ensureStylesLoaded();
  }

  /**
   * Assicura che gli stili CSS siano caricati
   * @private
   */
  _ensureStylesLoaded() {
    if (!document.getElementById('chart-modals-styles')) {
      const link = document.createElement('link');
      link.id = 'chart-modals-styles';
      link.rel = 'stylesheet';
      link.href = '/src/features/charts/styles/chart-modals.css';
      document.head.appendChild(link);
    }
  }

  /**
   * Mostra un modal con dettagli per dispositivi mobile
   * @param {Object} data - I dati da mostrare nel modal
   * @returns {HTMLElement} - L'elemento modal creato
   */
  showMobileDetailModal(data) {
    // Rimuovi modal esistente se presente
    const existingModal = document.getElementById('mobile-chart-detail-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    const percentage = ((data.value / data.total) * 100).toFixed(1);
    
    // Crea il modal
    const modal = document.createElement('div');
    modal.id = 'mobile-chart-detail-modal';
    modal.className = 'chart-modal mobile-chart-modal';
    modal.innerHTML = this._getMobileModalTemplate(data, percentage);
    
    // Aggiungi il modal al DOM
    document.body.appendChild(modal);
    
    // Aggiungi gli event listener
    const closeBtn = modal.querySelector('.chart-modal-close');
    const okBtn = modal.querySelector('.chart-modal-ok');
    
    const closeModal = () => {
      modal.style.animation = 'modalSlideOut 0.2s ease-in forwards';
      setTimeout(() => {
        if (modal.parentNode) {
          modal.remove();
        }
      }, 200);
    };
    
    closeBtn.addEventListener('click', closeModal);
    okBtn.addEventListener('click', closeModal);
    
    // Chiudi il modal cliccando fuori
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Supporto per il tasto ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    return modal;
  }

  /**
   * Mostra un pannello dettagli per desktop
   * @param {Object} data - I dati da mostrare nel pannello
   * @returns {HTMLElement} - L'elemento pannello creato
   */
  showDesktopDetailPanel(data) {
    // Rimuovi pannello esistente se presente
    const existingPanel = document.getElementById('desktop-chart-detail-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // Crea il pannello
    const panel = document.createElement('div');
    panel.id = 'desktop-chart-detail-panel';
    panel.className = 'desktop-chart-panel';
    panel.innerHTML = this._getDesktopPanelTemplate(data);
    
    // Aggiungi il pannello al container del grafico
    if (data.chart && data.chart.canvas && data.chart.canvas.parentNode) {
      const container = data.chart.canvas.parentNode;
      container.style.position = 'relative';
      container.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }
    
    // Aggiungi gli event listener
    const closeBtn = panel.querySelector('.chart-modal-close');
    
    const closePanel = () => {
      panel.style.animation = 'panelSlideOut 0.2s ease-in forwards';
      setTimeout(() => {
        if (panel.parentNode) {
          panel.remove();
        }
      }, 200);
    };
    
    closeBtn.addEventListener('click', closePanel);
    
    // Supporto per il tasto ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closePanel();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    return panel;
  }

  /**
   * Ottiene il template HTML per il modal mobile
   * @param {Object} data - I dati da mostrare
   * @param {string} percentage - La percentuale formattata
   * @returns {string} - Il template HTML
   * @private
   */
  _getMobileModalTemplate(data, percentage) {
    return `
      <div class="chart-modal-content">
        <div class="chart-modal-header">
          <h3>Dettagli Sezione</h3>
          <button class="chart-modal-close" aria-label="Chiudi">&times;</button>
        </div>
        <div class="chart-modal-body">
          <div class="chart-detail-item">
            <div class="chart-detail-color" style="background-color: ${data.color}"></div>
            <div class="chart-detail-info">
              <h4>${data.label}</h4>
              <p class="chart-detail-value">${data.value} pazienti</p>
              <p class="chart-detail-percentage">${percentage}% del totale</p>
            </div>
          </div>
        </div>
        <div class="chart-modal-footer">
          <button class="btn btn-primary chart-modal-ok">OK</button>
        </div>
      </div>
    `;
  }

  /**
   * Ottiene il template HTML per il pannello desktop
   * @param {Object} data - I dati da mostrare
   * @returns {string} - Il template HTML
   * @private
   */
  _getDesktopPanelTemplate(data) {
    return `
      <div class="chart-modal-header">
        <h3>Dettagli Grafico</h3>
        <button class="chart-modal-close" aria-label="Chiudi">&times;</button>
      </div>
      <div class="chart-modal-body">
        <div class="chart-detail-item">
          <div class="chart-detail-color" style="background-color: ${data.color}"></div>
          <div class="chart-detail-info">
            <h4>${data.label}</h4>
            <p class="chart-detail-value">${data.value} pazienti</p>
            <p class="chart-detail-percentage">${data.percentage}% del totale</p>
          </div>
        </div>
        <div class="chart-detail-additional">
          <h5>Informazioni aggiuntive</h5>
          <p>Totale complessivo: ${data.total} pazienti</p>
          <p>Selezionato: ${data.label}</p>
        </div>
      </div>
    `;
  }
}

export default ChartModals;