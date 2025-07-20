/**
 * Gestione dei modal per i grafici
 */
class ChartModals {
  /**
   * Inizializza il gestore dei modal
   */
  constructor() {
    // Styles are now integrated into the main SCSS system
    // No need to load separate CSS file
  }

  /**
   * Converte colore hex in RGB per CSS custom properties
   * @param {string} hex - Colore hex
   * @returns {string} - Valore RGB
   * @private
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '13, 110, 253';
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
    modal.className = 'chart-modal';
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
      <div class="chart-modal-content" style="border-top: 4px solid ${data.color};" >
        <div class="chart-modal-header">
          <h3>Dettagli</h3>
          <button class="chart-modal-close" aria-label="Chiudi">&times;</button>
        </div>
        <div class="chart-modal-body">
          <div class="chart-detail-card">
            <h4 class="diagnosis-name">${data.label}</h4>
            <div class="stats-container">
              <div class="stat-item">
                <span class="stat-value">${data.value}</span>
                <span class="stat-label">Pazienti</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${percentage}%</span>
                <span class="stat-label">Percentuale</span>
              </div>
            </div>
            <div class="additional-info">
              <div class="info-row">
                <span class="info-label">Totale complessivo</span>
                <span class="info-value">${data.total} pazienti</span>
              </div>
            </div>
          </div>
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
      <div class="chart-modal-content" style="border-top: 4px solid ${data.color};">
        <div class="chart-modal-header">
          <h3>Dettagli Grafico</h3>
          <button class="chart-modal-close" aria-label="Chiudi">&times;</button>
        </div>
        <div class="chart-modal-body">
          <div class="chart-detail-vertical">
            <div class="chart-detail-color" style="background-color: ${data.color}"></div>
            <div class="chart-detail-info">
              <h4>${data.label}</h4>
              <p class="chart-detail-value">${data.value} pazienti</p>
              <p class="chart-detail-percentage">${data.percentage}% del totale</p>
            </div>
          </div>
          <div class="chart-detail-additional">
            <p><strong>Totale complessivo:</strong> ${data.total} pazienti</p>
          </div>
        </div>
      </div>
    `;
  }
}

export default ChartModals;