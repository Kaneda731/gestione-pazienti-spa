// src/features/charts/components/ResponsiveChartAdapter.js

/**
 * Adatta i grafici a diverse dimensioni dello schermo
 */
class ResponsiveChartAdapter {
  /**
   * Inizializza l'adapter
   * @param {Object} breakpoints - I breakpoint per i diversi dispositivi
   */
  constructor(breakpoints = {
    mobile: 767,
    tablet: 991,
    desktop: 1199
  }) {
    this.breakpoints = breakpoints;
    this.currentDevice = this.detectDevice();
    this.resizeHandler = null;
    this.lastTouchEnd = 0;
  }
  
  /**
   * Rileva il tipo di dispositivo corrente
   * @returns {string} - Il tipo di dispositivo (mobile/tablet/desktop)
   */
  detectDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Considera anche l'orientamento e le caratteristiche del dispositivo
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isPortrait = height > width;
    
    if (width <= this.breakpoints.mobile) {
      return 'mobile';
    } else if (width <= this.breakpoints.tablet) {
      // Se è un dispositivo touch in modalità landscape, trattalo come mobile
      if (isTouchDevice && !isPortrait && width <= 1024) {
        return 'mobile';
      }
      return 'tablet';
    }
    
    return 'desktop';
  }
  
  /**
   * Adatta le opzioni del grafico al dispositivo corrente
   * @param {Object} options - Le opzioni originali del grafico
   * @returns {Object} - Le opzioni adattate
   */
  adaptOptions(options) {
    const device = this.detectDevice();
    
    // Safe deep clone without circular references
    let adaptedOptions;
    try {
      // Try to deep clone the options
      adaptedOptions = JSON.parse(JSON.stringify(options));
    } catch (error) {
      console.warn('Error cloning chart options, using shallow copy:', error);
      // Fallback to shallow copy if deep clone fails
      adaptedOptions = { ...options };
      
      // Ensure plugins and interaction objects exist
      if (options.plugins) {
        adaptedOptions.plugins = { ...options.plugins };
      }
      
      if (options.interaction) {
        adaptedOptions.interaction = { ...options.interaction };
      }
    }
    
    // Inizializza plugins se non esistono
    adaptedOptions.plugins = adaptedOptions.plugins || {};
    adaptedOptions.interaction = adaptedOptions.interaction || {};
    
    if (device === 'mobile') {
      // Configurazioni specifiche per mobile
      adaptedOptions.plugins.legend = {
        position: 'bottom',
        align: 'center',
        labels: {
          boxWidth: 15,
          font: { size: 12 },
          padding: 15,
          usePointStyle: true,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                // Gestisci diversi formati di backgroundColor (array, singolo colore, ecc.)
                let backgroundColor;
                if (Array.isArray(dataset.backgroundColor)) {
                  // Per grafici a torta/ciambella che hanno un array di colori
                  backgroundColor = dataset.backgroundColor[i] || dataset.borderColor || '#36A2EB';
                } else {
                  // Per grafici a linee che hanno un singolo colore
                  backgroundColor = dataset.backgroundColor || dataset.borderColor || '#36A2EB';
                }
                
                return {
                  text: label,
                  fillStyle: backgroundColor,
                  strokeStyle: backgroundColor,
                  lineWidth: 0,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        },
        onClick: (e, legendItem, legend) => {
          // Implementa toggle della visibilità per mobile
          const index = legendItem.index;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(0);
          
          meta.data[index].hidden = !meta.data[index].hidden;
          chart.update();
        }
      };
      
      adaptedOptions.plugins.title = {
        ...adaptedOptions.plugins?.title,
        font: { size: 16, weight: 'bold' },
        padding: 20
      };
      
      // Tooltip ottimizzati per touch
      adaptedOptions.plugins.tooltip = {
        ...adaptedOptions.plugins?.tooltip,
        enabled: true,
        mode: 'nearest',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 15,
        cornerRadius: 8,
        displayColors: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        caretPadding: 10,
        callbacks: {
          ...adaptedOptions.plugins?.tooltip?.callbacks,
          title: function(context) {
            return context[0].label || '';
          },
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed || context.raw;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return [`${label}: ${value}`, `Percentuale: ${percentage}%`];
          },
          afterLabel: function(context) {
            return 'Tocca per dettagli';
          }
        },
        animation: {
          duration: 300
        }
      };
      
      // Interazioni ottimizzate per touch
      adaptedOptions.interaction = {
        mode: 'nearest',
        intersect: false,
        includeInvisible: false
      };
      
      // Configurazioni specifiche per mobile
      adaptedOptions.maintainAspectRatio = false;
      adaptedOptions.responsive = true;
      adaptedOptions.devicePixelRatio = window.devicePixelRatio || 1;
      
      // Ottimizzazioni per performance su mobile
      adaptedOptions.animation = {
        duration: 800,
        easing: 'easeOutQuart'
      };
      
      // Eventi touch specifici
      adaptedOptions.onHover = (event, activeElements) => {
        if (activeElements.length > 0) {
          event.native.target.style.cursor = 'pointer';
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        } else {
          event.native.target.style.cursor = 'default';
        }
      };
      
            adaptedOptions.onClick = (event, activeElements) => {
        if (activeElements.length > 0) {
          if (navigator.vibrate) {
            navigator.vibrate(20);
          }
          
          const element = activeElements[0];
          const dataIndex = element.index;
          const chart = event.chart;
          const data = chart.data;
          const dataset = data.datasets[0];
          
          // Gestisci diversi formati di backgroundColor (array, singolo colore, ecc.)
          let color;
          if (Array.isArray(dataset.backgroundColor)) {
            color = dataset.backgroundColor[dataIndex] || dataset.borderColor || '#36A2EB';
          } else {
            color = dataset.backgroundColor || dataset.borderColor || '#36A2EB';
          }
          
          this.showMobileDetailModal({
            label: data.labels[dataIndex],
            value: dataset.data[dataIndex],
            color: color,
            total: dataset.data.reduce((sum, val) => sum + val, 0)
          });
        }
      };
      
    } else if (device === 'tablet') {
      // Configurazioni specifiche per tablet
      adaptedOptions.plugins.legend = {
        position: 'bottom',
        align: 'center',
        labels: {
          boxWidth: 18,
          font: { size: 14 },
          padding: 18,
          usePointStyle: true
        }
      };
      
      adaptedOptions.plugins.title = {
        ...adaptedOptions.plugins?.title,
        font: { size: 18, weight: 'bold' },
        padding: 25
      };
      
      adaptedOptions.plugins.tooltip = {
        ...adaptedOptions.plugins?.tooltip,
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 15, weight: 'bold' },
        bodyFont: { size: 14 },
        padding: 15,
        cornerRadius: 8
      };
      
      adaptedOptions.interaction = {
        mode: 'index',
        intersect: false
      };
      
    } else {
      // Configurazioni specifiche per desktop
      adaptedOptions.plugins.legend = {
        position: 'right',
        align: 'start',
        labels: {
          boxWidth: 20,
          font: { size: 14 },
          padding: 20,
          usePointStyle: true,
          // Funzione personalizzata per generare le etichette della legenda
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                // Gestisci diversi formati di backgroundColor (array, singolo colore, ecc.)
                let backgroundColor;
                if (Array.isArray(dataset.backgroundColor)) {
                  backgroundColor = dataset.backgroundColor[i] || dataset.borderColor || '#36A2EB';
                } else {
                  backgroundColor = dataset.backgroundColor || dataset.borderColor || '#36A2EB';
                }
                
                // Verifica se l'elemento è nascosto
                const meta = chart.getDatasetMeta(0);
                const hidden = meta.data[i] ? meta.data[i].hidden : false;
                
                return {
                  text: label,
                  fillStyle: backgroundColor,
                  strokeStyle: backgroundColor,
                  lineWidth: 0,
                  pointStyle: 'circle',
                  hidden: hidden,
                  index: i
                };
              });
            }
            return [];
          }
        },
        // Gestione del click sulla legenda per filtrare i dati
        onClick: (e, legendItem, legend) => {
          const index = legendItem.index;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(0);
          
          // Toggle della visibilità dell'elemento
          meta.data[index].hidden = !meta.data[index].hidden;
          
          // Aggiorna il grafico
          chart.update();
          
          // Feedback visivo
          const container = chart.canvas.parentNode;
          if (container) {
            const item = container.querySelector(`.chart-legend-item-${index}`);
            if (item) {
              item.classList.toggle('filtered');
            }
          }
        }
      };
      
      adaptedOptions.plugins.title = {
        ...adaptedOptions.plugins?.title,
        font: { size: 20, weight: 'bold' },
        padding: 30,
        display: true
      };
      
      // Tooltip avanzati per desktop
      adaptedOptions.plugins.tooltip = {
        ...adaptedOptions.plugins?.tooltip,
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: { size: 16, weight: 'bold' },
        bodyFont: { size: 14 },
        padding: 16,
        cornerRadius: 8,
        displayColors: true,
        // Callback personalizzati per tooltip dettagliati
        callbacks: {
          ...adaptedOptions.plugins?.tooltip?.callbacks,
          title: function(context) {
            return context[0].label || '';
          },
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed || context.raw;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return [`${label}: ${value}`, `Percentuale: ${percentage}%`];
          },
          // Aggiungi informazioni aggiuntive nel tooltip
          afterBody: function(context) {
            // Aggiungi informazioni sul totale
            const total = context[0].dataset.data.reduce((sum, val) => sum + val, 0);
            return [`Totale: ${total}`, 'Click per esplorare'];
          }
        },
        animation: {
          duration: 150
        }
      };
      
      // Interazioni avanzate per desktop
      adaptedOptions.interaction = {
        mode: 'index',
        intersect: false,
        includeInvisible: false
      };
      
      // Supporto per zoom con rotellina del mouse
      adaptedOptions.plugins.zoom = {
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1
          },
          pinch: {
            enabled: true
          },
          mode: 'xy',
          onZoom: function() {
            // Feedback visivo durante lo zoom
            const container = document.querySelector('.chart-container');
            if (container) {
              container.classList.add('zooming');
              setTimeout(() => {
                container.classList.remove('zooming');
              }, 300);
            }
          }
        },
        pan: {
          enabled: true,
          mode: 'xy',
          threshold: 10
        }
      };
      
      // Animazioni fluide per desktop
      adaptedOptions.animation = {
        duration: 1000,
        easing: 'easeOutQuart',
        delay: (context) => {
          // Aggiungi un leggero ritardo per creare un effetto a cascata
          return context.dataIndex * 50;
        }
      };
      
      // Eventi hover avanzati
      adaptedOptions.onHover = (event, activeElements, chart) => {
        if (event.native) {
          event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }

        if (activeElements.length > 0 && activeElements[0]) {
          if (chart && chart.canvas && chart.canvas.parentNode) {
            const dataIndex = activeElements[0].index;
            const legendItems = chart.canvas.parentNode.querySelectorAll('.chart-legend-item');
            if (legendItems && legendItems[dataIndex]) {
              legendItems.forEach(item => item.classList.remove('highlighted'));
              legendItems[dataIndex].classList.add('highlighted');
            }
          }
        }
      };

      // Eventi click avanzati
      adaptedOptions.onClick = (event, activeElements, chart) => {
        if (activeElements.length > 0 && activeElements[0]) {
          const element = activeElements[0];
          if (chart) {
            const dataIndex = element.index;
            const data = chart.data;
            const dataset = data.datasets[0];

            let color;
            if (Array.isArray(dataset.backgroundColor)) {
              color = dataset.backgroundColor[dataIndex] || dataset.borderColor || '#36A2EB';
            } else {
              color = dataset.backgroundColor || dataset.borderColor || '#36A2EB';
            }

            this.showDesktopDetailPanel({
              label: data.labels[dataIndex],
              value: dataset.data[dataIndex],
              color: color,
              total: dataset.data.reduce((sum, val) => sum + val, 0),
              percentage: ((dataset.data[dataIndex] / dataset.data.reduce((sum, val) => sum + val, 0)) * 100).toFixed(1),
              chart: chart
            });
          }
        }
      };
    }
    
    return adaptedOptions;
  }
  
  /**
   * Adatta il layout del grafico al dispositivo corrente
   * @param {HTMLElement} container - Il container del grafico
   */
  adaptLayout(container) {
    const device = this.detectDevice();
    
    // Rimuovi classi precedenti
    container.classList.remove('chart-mobile', 'chart-tablet', 'chart-desktop');
    
    // Aggiungi classe specifica per il dispositivo
    container.classList.add(`chart-${device}`);
    
    // Imposta altezza minima per garantire la leggibilità su mobile
    if (device === 'mobile') {
      container.style.minHeight = '300px';
      container.style.height = '60vh';
    } else if (device === 'tablet') {
      container.style.minHeight = '400px';
      container.style.height = '70vh';
    } else {
      container.style.minHeight = '500px';
      container.style.height = '80vh';
    }
  }
  
  /**
   * Gestisce il ridimensionamento della finestra
   * @param {Chart} chart - L'istanza del grafico
   * @param {Object} options - Le opzioni originali del grafico
   */
  handleResize(chart, options) {
    // Rimuovi handler precedente se esiste
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    
    // Crea un nuovo handler con throttling
    this.resizeHandler = this.throttle(() => {
      const newDevice = this.detectDevice();
      
      // Aggiorna solo se il tipo di dispositivo è cambiato
      if (newDevice !== this.currentDevice) {
        this.currentDevice = newDevice;
        
        // Adatta il container
        if (chart.canvas && chart.canvas.parentNode) {
          this.adaptLayout(chart.canvas.parentNode);
        }
        
        // Aggiorna le opzioni del grafico
        const adaptedOptions = this.adaptOptions(options);
        chart.options = { ...chart.options, ...adaptedOptions };
        chart.update();
      }
    }, 250);
    
    // Aggiungi il nuovo handler
    window.addEventListener('resize', this.resizeHandler);
  }
  
  /**
   * Funzione di throttling per limitare la frequenza di esecuzione
   * @param {Function} func - La funzione da eseguire
   * @param {number} limit - Il limite in millisecondi
   * @returns {Function} - La funzione con throttling
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  /**
   * Mostra un modal con dettagli per dispositivi mobile
   * @param {Object} data - I dati da mostrare nel modal
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
    modal.className = 'mobile-chart-modal';
    modal.innerHTML = `
      <div class="mobile-chart-modal-content">
        <div class="mobile-chart-modal-header">
          <h3>Dettagli Sezione</h3>
          <button class="mobile-chart-modal-close" aria-label="Chiudi">&times;</button>
        </div>
        <div class="mobile-chart-modal-body">
          <div class="chart-detail-item">
            <div class="chart-detail-color" style="background-color: ${data.color}"></div>
            <div class="chart-detail-info">
              <h4>${data.label}</h4>
              <p class="chart-detail-value">${data.value} pazienti</p>
              <p class="chart-detail-percentage">${percentage}% del totale</p>
            </div>
          </div>
        </div>
        <div class="mobile-chart-modal-footer">
          <button class="btn btn-primary mobile-chart-modal-ok">OK</button>
        </div>
      </div>
    `;
    
    // Aggiungi gli stili inline se non esistono già
    if (!document.getElementById('mobile-chart-modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'mobile-chart-modal-styles';
      styles.textContent = `
        .mobile-chart-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 1rem;
        }
        
        .mobile-chart-modal-content {
          background: var(--bs-body-bg, white);
          border-radius: 12px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease-out;
        }
        
        .mobile-chart-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--bs-border-color, #dee2e6);
        }
        
        .mobile-chart-modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--bs-body-color, #333);
        }
        
        .mobile-chart-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--bs-secondary, #6c757d);
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mobile-chart-modal-body {
          padding: 1.5rem;
        }
        
        .chart-detail-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .chart-detail-color {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          flex-shrink: 0;
        }
        
        .chart-detail-info h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--bs-body-color, #333);
        }
        
        .chart-detail-value {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 500;
          color: var(--bs-primary, #0d6efd);
        }
        
        .chart-detail-percentage {
          margin: 0;
          font-size: 0.9rem;
          color: var(--bs-secondary, #6c757d);
        }
        
        .mobile-chart-modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--bs-border-color, #dee2e6);
          text-align: right;
        }
        
        .mobile-chart-modal-ok {
          background: var(--bs-primary, #0d6efd);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          min-height: 44px;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes modalSlideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .mobile-chart-modal-content {
            background: #212529;
            color: #fff;
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Aggiungi il modal al DOM
    document.body.appendChild(modal);
    
    // Aggiungi gli event listener
    const closeBtn = modal.querySelector('.mobile-chart-modal-close');
    const okBtn = modal.querySelector('.mobile-chart-modal-ok');
    
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
  }
  
  /**
   * Implementa controlli touch-friendly per mobile
   * @param {HTMLElement} container - Il container del grafico
   */
  _setupMobileTouchControls(container) {
    if (this.detectDevice() !== 'mobile') return;
    
    // Aggiungi supporto per swipe gestures
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    const handleTouchStart = (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }
    };
    
    const handleTouchEnd = (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        this._handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY);
      }
    };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Previeni il comportamento di zoom su double-tap
    container.addEventListener('touchend', (e) => {
      const now = new Date().getTime();
      const timeSince = now - this.lastTouchEnd;
      
      if (timeSince < 300 && timeSince > 0) {
        e.preventDefault();
      }
      
      this.lastTouchEnd = now;
    });
    
    // Ottimizza il container per mobile
    this.optimizeMobileContainer(container);
  }
  
  /**
   * Gestisce il gesto di swipe per cambiare il tipo di grafico.
   * @param {number} touchStartX - Coordinata X iniziale del tocco.
   * @param {number} touchStartY - Coordinata Y iniziale del tocco.
   * @param {number} touchEndX - Coordinata X finale del tocco.
   * @param {number} touchEndY - Coordinata Y finale del tocco.
   */
  _handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY) {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 50;

    // Swipe orizzontale per cambiare tipo di grafico
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        this.triggerChartTypeChange('previous');
      } else {
        this.triggerChartTypeChange('next');
      }
    }
  }

  /**
   * Ottimizza il container del grafico per dispositivi mobile
   * @param {HTMLElement} container - Il container del grafico
   */
  optimizeMobileContainer(container) {
    if (this.detectDevice() !== 'mobile') return;
    
    // Aggiungi attributi per migliorare l'accessibilità touch
    container.style.touchAction = 'manipulation';
    container.style.userSelect = 'none';
    container.style.webkitUserSelect = 'none';
    container.style.webkitTouchCallout = 'none';
    
    // Ottimizza il rendering per dispositivi mobile
    container.style.willChange = 'transform';
    container.style.backfaceVisibility = 'hidden';
    
    // Aggiungi padding per evitare che il grafico tocchi i bordi
    container.style.padding = '0.5rem';
    
    // Assicurati che il container abbia l'altezza minima
    if (!container.style.minHeight) {
      container.style.minHeight = '300px';
    }
    
    // Aggiungi classe per styling CSS specifico
    container.classList.add('chart-mobile-optimized');
  }

  /**
   * Gestisce il gesto di swipe per cambiare il tipo di grafico.
   * @param {number} touchStartX - Coordinata X iniziale del tocco.
   * @param {number} touchStartY - Coordinata Y iniziale del tocco.
   * @param {number} touchEndX - Coordinata X finale del tocco.
   * @param {number} touchEndY - Coordinata Y finale del tocco.
   */
  _handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY) {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 50;

    // Swipe orizzontale per cambiare tipo di grafico
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        this.triggerChartTypeChange('previous');
      } else {
        this.triggerChartTypeChange('next');
      }
    }
  }
  
  /**
   * Mostra una notifica di feedback all'utente, adattandosi al dispositivo.
   * @param {string} message - Il messaggio da mostrare.
   * @param {string} type - Il tipo di notifica ('success', 'error', 'info').
   */
  showNotification(message, type = 'info') {
    const device = this.detectDevice();

    if (device === 'mobile') {
      this._showMobileToast(message, type);
    } else {
      this._showDesktopToast(message, type);
    }
  }

  /**
   * Mostra un toast di feedback per azioni su mobile (implementazione interna).
   * @param {string} message - Il messaggio da mostrare.
   * @param {string} type - Il tipo di notifica ('success', 'error', 'info').
   */
  showNotification(message, type = 'info') {
    const device = this.detectDevice();

    if (device === 'mobile') {
      this._showMobileToast(message, type);
    } else {
      this._showDesktopToast(message, type);
    }
  }

  /**
   * Mostra un toast di feedback per azioni su mobile (implementazione interna).
   * @param {string} message - Il messaggio da mostrare.
   * @param {string} type - Il tipo di notifica ('success', 'error', 'info').
   */
  _showMobileToast(message, type) {
    // Rimuovi toast esistente
    const existingToast = document.getElementById('mobile-chart-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Crea il toast
    const toast = document.createElement('div');
    toast.id = 'mobile-chart-toast';
    toast.className = `mobile-chart-toast mobile-chart-toast-${type}`;
    toast.textContent = message;
    
    // Aggiungi gli stili inline se non esistono già
    if (!document.getElementById('mobile-toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'mobile-toast-styles';
      styles.textContent = `
        .mobile-chart-toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 20px;
          border-radius: 25px;
          font-size: 14px;
          z-index: 1060;
          animation: toastSlideIn 0.3s ease-out;
        }
        .mobile-chart-toast-success { background-color: #28a745; }
        .mobile-chart-toast-error { background-color: #dc3545; }
        .mobile-chart-toast-info { background-color: #17a2b8; }
        
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes toastSlideOut {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Aggiungi il toast al DOM
    document.body.appendChild(toast);
    
    // Rimuovi il toast dopo 2 secondi
    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 2000);
  }

  /**
   * Mostra un toast di feedback per azioni su desktop (implementazione interna).
   * @param {string} message - Il messaggio da mostrare.
   * @param {string} type - Il tipo di notifica ('success', 'error', 'info').
   */
  _showDesktopToast(message, type) {
    // Rimuovi toast esistente
    const existingToast = document.getElementById('desktop-chart-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Crea il toast
    const toast = document.createElement('div');
    toast.id = 'desktop-chart-toast';
    toast.className = `desktop-chart-toast desktop-chart-toast-${type}`;
    toast.innerHTML = `<i class="fas fa-info-circle me-2"></i>${message}`;
    
    // Aggiungi gli stili inline se non esistono già
    if (!document.getElementById('desktop-toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'desktop-toast-styles';
      styles.textContent = `
        .desktop-chart-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 1060;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          animation: toastSlideInRight 0.3s ease-out;
        }
        .desktop-chart-toast-success { background-color: #28a745; }
        .desktop-chart-toast-error { background-color: #dc3545; }
        .desktop-chart-toast-info { background-color: #17a2b8; }
        
        @keyframes toastSlideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes toastSlideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(20px);
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Aggiungi il toast al DOM
    document.body.appendChild(toast);
    
    // Rimuovi il toast dopo 3 secondi
    setTimeout(() => {
      toast.style.animation = 'toastSlideOutRight 0.3s ease-in forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }
  
  /**
   * Setup del listener per i gesti di swipe su mobile
   */
  _setupMobileSwipeListener() {
    // Ascolta l'evento personalizzato per il cambio tipo di grafico via swipe
    document.addEventListener('chartTypeSwipe', async (event) => {
        const direction = event.detail.direction;
        
        try {
            const chartTypes = await getAvailableChartTypes();
            const currentIndex = chartTypes.findIndex(type => type.id === currentChartType);
            
            let newIndex;
            if (direction === 'next') {
                newIndex = (currentIndex + 1) % chartTypes.length;
            } else {
                newIndex = currentIndex === 0 ? chartTypes.length - 1 : currentIndex - 1;
            }
            
            const newChartType = chartTypes[newIndex].id;
            
            // Aggiorna il selettore se esiste
            if (dom.chartTypeSelector) {
                dom.chartTypeSelector.value = newChartType;
            }
            
            // Aggiorna il tipo corrente
            currentChartType = newChartType;
            
            // Ridisegna il grafico se esiste
            if (currentChart) {
                const filters = getFilters();
                await drawChartWithCurrentData(filters);
                
                // Mostra feedback all'utente
                if (this) {
                    this.showNotification(`Grafico cambiato: ${chartTypes[newIndex].name}`);
                }
            }
        } catch (error) {
            console.error('Errore nel cambio tipo di grafico via swipe:', error);
        }
    });
  }

  /**
   * Setup del listener per eventi di esportazione e condivisione da mobile
   */
  _setupMobileChartEventListeners() {
    // Listener per eventi di esportazione da mobile
    document.addEventListener('chartExportRequested', async (event) => {
        const chart = event.detail.chart;
        if (chart) {
            try {
                await downloadChartAsImage(chart, 'png', {
                    timestamp: new Date().toLocaleString('it-IT'),
                    filters: getFilters()
                });
                
                if (this) {
                    this.showNotification('Grafico esportato con successo!');
                }
            } catch (error) {
                console.error('Errore nell\'esportazione da mobile:', error);
                if (this) {
                    this.showNotification('Errore nell\'esportazione');
                }
            }
        }
    });
    
    // Listener per eventi di condivisione da mobile
    document.addEventListener('chartShareRequested', async (event) => {
        const chart = event.detail.chart;
        if (chart) {
            try {
                const shareableLink = await generateShareableLink(getFilters(), currentChartType);
                
                // Usa Web Share API se disponibile
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'Grafico Pazienti',
                            text: 'Visualizza questo grafico dei dati pazienti',
                            url: shareableLink
                        });
                        
                        if (this) {
                            this.showNotification('Condiviso con successo!');
                        }
                    } catch (shareError) {
                        // Fallback alla copia negli appunti
                        await navigator.clipboard.writeText(shareableLink);
                        if (this) {
                            this.showNotification('Link copiato negli appunti!');
                        }
                    }
                } else {
                    // Fallback per browser che non supportano Web Share API
                    await navigator.clipboard.writeText(shareableLink);
                    if (this) {
                        this.showNotification('Link copiato negli appunti!');
                    }
                }
            } catch (error) {
                console.error('Errore nella condivisione da mobile:', error);
                if (this) {
                    this.showNotification('Errore nella condivisione');
                }
            }
        }
    });
    
    // Listener per eventi personalizzati dal ResponsiveChartAdapter
    document.addEventListener('exportChart', () => {
        if (currentChart) {
            document.dispatchEvent(new CustomEvent('chartExportRequested', {
                detail: { chart: currentChart }
            }));
        }
    });
    
    document.addEventListener('shareChart', () => {
        if (currentChart) {
            document.dispatchEvent(new CustomEvent('chartShareRequested', {
                detail: { chart: currentChart }
            }));
        }
    });
    
    // Listener per il selettore del tipo di grafico da mobile
    document.addEventListener('showChartTypeSelector', () => {
        showMobileChartTypeSelector();
    });
  }

  /**
   * Setup del listener per il cambio di orientamento su mobile
   */
  _setupOrientationChangeListener() {
    if (!this) return;
    
    const handleOrientationChange = () => {
        setTimeout(() => {
            if (dom.chartContainer) {
                // Ottimizza per il nuovo orientamento
                this.optimizeForOrientation(dom.chartContainer);
                
                // Aggiorna il grafico se esiste
                if (currentChart) {
                    // Adatta le opzioni per il nuovo orientamento
                    const adaptedOptions = this.adaptOptions(currentChart.options);
                    currentChart.options = { ...currentChart.options, ...adaptedOptions };
                    
                    // Ridimensiona il grafico
                    currentChart.resize();
                    currentChart.update();
                }
                
                // Riposiziona la legenda se necessario
                if (currentChart && this.detectDevice() === 'mobile') {
                    this.positionLegendBelowChart(dom.chartContainer, currentChart);
                }
            }
        }, 150); // Delay per permettere al browser di aggiornare le dimensioni
    };
    
    // Ascolta i cambi di orientamento
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Ascolta anche i resize per dispositivi che non supportano orientationchange
    window.addEventListener('resize', this.throttle(handleOrientationChange, 300));
  }
  
  /**
   * Mostra un pannello dettagliato per desktop quando si fa clic su un elemento del grafico
   * @param {Object} data - I dati da mostrare nel pannello
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
    panel.innerHTML = `
      <div class="desktop-chart-panel-content">
        <div class="desktop-chart-panel-header">
          <h3>Dettagli Analitici</h3>
          <button class="desktop-chart-panel-close" aria-label="Chiudi">&times;</button>
        </div>
        <div class="desktop-chart-panel-body">
          <div class="chart-detail-item">
            <div class="chart-detail-color" style="background-color: ${data.color}"></div>
            <div class="chart-detail-info">
              <h4>${data.label}</h4>
              <div class="chart-detail-stats">
                <div class="stat-label">Valore</div>
                <div class="stat-value">${data.value}</div>
                <div class="stat-label">Percentuale</div>
                <div class="stat-value">${data.percentage}%</div>
                <div class="stat-label">Totale</div>
                <div class="stat-value">${data.total}</div>
              </div>
            </div>
          </div>
          <div class="chart-detail-actions">
            <button class="btn btn-sm btn-outline-primary chart-detail-action" data-action="highlight">
              <i class="fas fa-highlighter"></i> Evidenzia
            </button>
            <button class="btn btn-sm btn-outline-secondary chart-detail-action" data-action="isolate">
              <i class="fas fa-filter"></i> Isola
            </button>
            <button class="btn btn-sm btn-outline-info chart-detail-action" data-action="export">
              <i class="fas fa-download"></i> Esporta
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Aggiungi gli stili inline se non esistono già
    if (!document.getElementById('desktop-chart-panel-styles')) {
      const styles = document.createElement('style');
      styles.id = 'desktop-chart-panel-styles';
      styles.textContent = `
        .desktop-chart-panel {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 300px;
          background: var(--bs-body-bg, white);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
          animation: panelSlideIn 0.3s ease-out;
        }
        
        .desktop-chart-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--bs-border-color, #dee2e6);
          background: var(--bs-light, #f8f9fa);
        }
        
        .desktop-chart-panel-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--bs-body-color, #333);
        }
        
        .desktop-chart-panel-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: var(--bs-secondary, #6c757d);
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .desktop-chart-panel-body {
          padding: 1rem;
        }
        
        .chart-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .chart-detail-color {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        
        .chart-detail-info h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--bs-body-color, #333);
        }
        
        .chart-detail-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        
        .chart-detail-stat {
          display: flex;
          flex-direction: column;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: var(--bs-secondary, #6c757d);
        }
        
        .stat-value {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--bs-primary, #0d6efd);
        }
        
        .chart-detail-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .chart-detail-action {
          flex: 1;
          font-size: 0.8rem;
          padding: 0.25rem 0.5rem;
        }
        
        @keyframes panelSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes panelSlideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(20px);
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .desktop-chart-panel {
            background: #212529;
            color: #fff;
          }
          
          .desktop-chart-panel-header {
            background: #343a40;
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Trova il container del grafico e aggiungi il pannello
    const chartContainer = data.chart.canvas.parentNode;
    if (chartContainer) {
      chartContainer.style.position = 'relative';
      chartContainer.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }
    
    // Aggiungi gli event listener
    const closeBtn = panel.querySelector('.desktop-chart-panel-close');
    
    const closePanel = () => {
      panel.style.animation = 'panelSlideOut 0.2s ease-in forwards';
      setTimeout(() => {
        if (panel.parentNode) {
          panel.remove();
        }
      }, 200);
    };
    
    closeBtn.addEventListener('click', closePanel);
    
    // Aggiungi event listener per i pulsanti di azione
    const actionButtons = panel.querySelectorAll('.chart-detail-action');
    actionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        
        switch (action) {
          case 'highlight':
            // Evidenzia l'elemento nel grafico
            this.highlightChartElement(data.chart, data.label);
            break;
          case 'isolate':
            // Isola l'elemento nel grafico (nascondi gli altri)
            this.isolateChartElement(data.chart, data.label);
            break;
          case 'export':
            // Esporta i dati dell'elemento
            this.exportElementData(data);
            break;
        }
      });
    });
    
    // Supporto per il tasto ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closePanel();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
  
  /**
   * Evidenzia un elemento specifico nel grafico
   * @param {Chart} chart - L'istanza del grafico
   * @param {string} label - L'etichetta dell'elemento da evidenziare
   */
  highlightChartElement(chart, label) {
    const datasetIndex = 0; // Assumiamo che ci sia un solo dataset
    const labelIndex = chart.data.labels.findIndex(l => l === label);
    
    if (labelIndex === -1) return;
    
    // Ripristina tutti gli elementi alla loro opacità normale
    chart.data.datasets[datasetIndex].backgroundColor.forEach((color, i) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.data[i]) {
        meta.data[i].options.backgroundColor = color;
      }
    });
    
    // Evidenzia l'elemento selezionato
    const meta = chart.getDatasetMeta(datasetIndex);
    if (meta.data[labelIndex]) {
      // Salva il colore originale se non è già stato salvato
      if (!meta.data[labelIndex]._originalBackgroundColor) {
        meta.data[labelIndex]._originalBackgroundColor = meta.data[labelIndex].options.backgroundColor;
      }
      
      // Applica un effetto di evidenziazione
      meta.data[labelIndex].options.backgroundColor = this.adjustColor(meta.data[labelIndex]._originalBackgroundColor, 20);
      meta.data[labelIndex].options.borderWidth = 2;
      meta.data[labelIndex].options.borderColor = '#fff';
    }
    
    chart.update();
    
    // Mostra un toast di conferma
    this.showNotification(`Elemento "${label}" evidenziato`);
  }
  
  /**
   * Isola un elemento specifico nel grafico (nasconde gli altri)
   * @param {Chart} chart - L'istanza del grafico
   * @param {string} label - L'etichetta dell'elemento da isolare
   */
  isolateChartElement(chart, label) {
    const datasetIndex = 0; // Assumiamo che ci sia un solo dataset
    const labelIndex = chart.data.labels.findIndex(l => l === label);
    
    if (labelIndex === -1) return;
    
    // Nascondi tutti gli elementi tranne quello selezionato
    const meta = chart.getDatasetMeta(datasetIndex);
    meta.data.forEach((dataElement, i) => {
      dataElement.hidden = i !== labelIndex;
    });
    
    chart.update();
    
    // Mostra un toast di conferma
    this.showNotification(`Elemento "${label}" isolato`);
  }
  
  /**
   * Esporta i dati di un elemento specifico
   * @param {Object} data - I dati dell'elemento
   */
  exportElementData(data) {
    // Crea un oggetto con i dati da esportare
    const exportData = {
      label: data.label,
      value: data.value,
      percentage: data.percentage,
      total: data.total,
      timestamp: new Date().toISOString()
    };
    
    // Converti in JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Crea un blob con i dati
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Crea un URL per il blob
    const url = URL.createObjectURL(blob);
    
    // Crea un link per il download
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart-data-${data.label.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    // Aggiungi il link al DOM e simula il click
    document.body.appendChild(a);
    a.click();
    
    // Rimuovi il link dal DOM
    document.body.removeChild(a);
    
    // Rilascia l'URL
    URL.revokeObjectURL(url);
    
    // Mostra un toast di conferma
    this.showNotification(`Dati esportati per "${data.label}"`);
  }
  
  /**
   * Schiarisce o scurisce un colore
   * @param {string} color - Il colore da modificare (formato hex o rgba)
   * @param {number} percent - La percentuale di schiarimento (positivo) o scurimento (negativo)
   * @returns {string} - Il colore modificato
   */
  adjustColor(color, percent) {
    // Se il colore è in formato rgba
    if (color.startsWith('rgba')) {
      const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (rgbaMatch) {
        let [, r, g, b, a] = rgbaMatch;
        r = parseInt(r);
        g = parseInt(g);
        b = parseInt(b);
        a = parseFloat(a);
        
        // Schiarisci o scurisci il colore
        r = Math.min(255, Math.max(0, r + (percent / 100) * 255));
        g = Math.min(255, Math.max(0, g + (percent / 100) * 255));
        b = Math.min(255, Math.max(0, b + (percent / 100) * 255));
        
        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
      }
    }
    
    // Se il colore è in formato hex
    if (color.startsWith('#')) {
      let r = parseInt(color.substring(1, 3), 16);
      let g = parseInt(color.substring(3, 5), 16);
      let b = parseInt(color.substring(5, 7), 16);
      
      // Schiarisci o scurisci il colore
      r = Math.min(255, Math.max(0, r + (percent / 100) * 255));
      g = Math.min(255, Math.max(0, g + (percent / 100) * 255));
      b = Math.min(255, Math.max(0, b + (percent / 100) * 255));
      
      // Converti in hex
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }
    
    // Se il formato non è riconosciuto, restituisci il colore originale
    return color;
  }
  
  /**
   * Implementa il layout responsive specifico per mobile
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico Chart.js
   */
  implementMobileResponsiveLayout(container, chart) {
    if (this.detectDevice() !== 'mobile') return;
    
    // Ottimizza le dimensioni del container per schermi piccoli
    this.optimizeContainerForSmallScreens(container);
    
    // Posiziona la legenda sotto il grafico
    this.positionLegendBelowChart(container, chart);
    
    // Implementa controlli touch-friendly
    this._setupMobileTouchControls(container);

    // Aggiungi listener per swipe gestures su mobile
    this._setupMobileSwipeListener();
    
    // Setup listener per eventi di esportazione e condivisione da mobile
    this._setupMobileChartEventListeners();
    
    // Setup listener per orientamento su mobile
    this._setupOrientationChangeListener();

    // Ottimizza per orientamento
    this.optimizeForOrientation(container);

    // Setup listener per eventi di esportazione e condivisione da mobile
    this._setupMobileChartEventListeners();
    
    // Setup listener per orientamento su mobile
    this._setupOrientationChangeListener();
  }
  
  /**
   * Implementa il layout responsive specifico per desktop
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico Chart.js
   */
  implementDesktopResponsiveLayout(container, chart) {
    if (this.detectDevice() !== 'desktop') return;
    
    // Ottimizza le dimensioni del container per schermi grandi
    this.optimizeContainerForLargeScreens(container);
    
    // Posiziona la legenda a lato del grafico
    this.positionLegendBesideChart(container, chart);
    
    // Implementa interazioni avanzate
    this.setupDesktopInteractions(container, chart);
    
    // Aggiungi stili CSS per desktop
    this.addDesktopStyles();
  }
  
  /**
   * Ottimizza le dimensioni del container per schermi grandi
   * @param {HTMLElement} container - Il container del grafico
   */
  optimizeContainerForLargeScreens(container) {
    if (!container) return;
    
    // Imposta dimensioni ottimali per desktop
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.minHeight = '500px';
    container.style.height = '80vh';
    container.style.maxHeight = '800px';
    
    // Aggiungi padding per migliorare la leggibilità
    container.style.padding = '1rem';
    container.style.boxSizing = 'border-box';
    
    // Aggiungi classe per styling CSS specifico
    container.classList.add('chart-desktop-optimized');
  }
  
  /**
   * Posiziona la legenda a lato del grafico per desktop
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico Chart.js
   */
  positionLegendBesideChart(container, chart) {
    if (!chart || this.detectDevice() !== 'desktop') return;
    
    // La configurazione della legenda è già gestita in adaptOptions
    // Qui possiamo aggiungere ottimizzazioni specifiche del layout
    
    // Aggiungi classe per styling CSS specifico
    container.classList.add('chart-legend-right');
    
    // Crea un wrapper per il grafico e la legenda se non esiste
    if (!container.querySelector('.chart-legend-wrapper')) {
      // Salva il canvas originale
      const canvas = chart.canvas;
      
      // Crea un wrapper per il grafico e la legenda
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-legend-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'row';
      wrapper.style.alignItems = 'center';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      
      // Crea un container per il grafico
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-canvas-container';
      chartContainer.style.flex = '1';
      chartContainer.style.minWidth = '0';
      chartContainer.style.height = '100%';
      
      // Sposta il canvas nel nuovo container
      if (canvas.parentNode === container) {
        canvas.remove();
        chartContainer.appendChild(canvas);
      }
      
      // Aggiungi il container del grafico al wrapper
      wrapper.appendChild(chartContainer);
      
      // Aggiungi il wrapper al container principale
      container.appendChild(wrapper);
    }
  }
  
  /**
   * Setup interazioni avanzate per desktop
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico Chart.js
   */
  setupDesktopInteractions(container, chart) {
    if (!container || !chart) return;
    
    // Aggiungi supporto per zoom con rotellina del mouse
    container.addEventListener('wheel', (e) => {
      // Previeni lo scroll della pagina
      if (e.ctrlKey) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Aggiungi supporto per hover avanzato
    container.addEventListener('mousemove', (e) => {
      const rect = chart.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Trova l'elemento attivo
      const activeElements = chart.getElementsAtEventForMode(
        { x, y },
        'nearest',
        { intersect: true },
        false
      );
      
      // Resetta lo stato di tutti gli elementi
      this.resetChartElementsState(chart);
      
      // Evidenzia l'elemento attivo
      if (activeElements.length > 0) {
        const element = activeElements[0];
        this.highlightChartElement(chart, chart.data.labels[element.index], false);
      }
    });
    
    // Aggiungi supporto per click
    container.addEventListener('click', (e) => {
      const rect = chart.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Trova l'elemento attivo
      const activeElements = chart.getElementsAtEventForMode(
        { x, y },
        'nearest',
        { intersect: true },
        false
      );
      
      // Mostra dettagli per l'elemento attivo
      if (activeElements.length > 0) {
        const element = activeElements[0];
        const dataIndex = element.index;
        const label = chart.data.labels[dataIndex];
        const dataset = chart.data.datasets[0];
        const value = dataset.data[dataIndex];
        const total = dataset.data.reduce((sum, val) => sum + val, 0);
        const percentage = ((value / total) * 100).toFixed(1);
        
        // Gestisci diversi formati di backgroundColor
        let color;
        if (Array.isArray(dataset.backgroundColor)) {
          color = dataset.backgroundColor[dataIndex] || dataset.borderColor || '#36A2EB';
        } else {
          color = dataset.backgroundColor || dataset.borderColor || '#36A2EB';
        }
        
        // Mostra dettagli avanzati
        this.showDesktopDetailPanel({
          label,
          value,
          color,
          total,
          percentage,
          chart
        });
      }
    });
  }
  
  /**
   * Resetta lo stato di tutti gli elementi del grafico
   * @param {Chart} chart - L'istanza del grafico
   */
  resetChartElementsState(chart) {
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) return;
    
    const datasetIndex = 0; // Assumiamo che ci sia un solo dataset
    const meta = chart.getDatasetMeta(datasetIndex);
    
    // Ripristina tutti gli elementi alla loro opacità normale
    meta.data.forEach((dataElement, i) => {
      if (dataElement._savedOptions) {
        Object.assign(dataElement.options, dataElement._savedOptions);
        delete dataElement._savedOptions;
      }
    });
    
    chart.update('none'); // Aggiorna senza animazione
  }
  
  /**
   * Aggiungi stili CSS per desktop
   */
  addDesktopStyles() {
    // Aggiungi gli stili inline se non esistono già
    if (!document.getElementById('desktop-chart-styles')) {
      const styles = document.createElement('style');
      styles.id = 'desktop-chart-styles';
      styles.textContent = `
        .chart-desktop-optimized {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          background: var(--bs-body-bg, white);
          transition: all 0.3s ease;
        }
        
        .chart-desktop-optimized:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }
        
        .chart-legend-right .chart-legend-wrapper {
          display: flex;
          flex-direction: row;
          align-items: center;
        }
        
        .chart-legend-right .chart-canvas-container {
          flex: 1;
          min-width: 0;
          height: 100%;
        }
        
        .chart-legend-right .chart-legend-container {
          width: 200px;
          padding-left: 1rem;
          border-left: 1px solid var(--bs-border-color, #dee2e6);
          margin-left: 1rem;
        }
        
        .chart-legend-item {
          display: flex;
          align-items: center;
          padding: 0.25rem 0;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        
        .chart-legend-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .chart-legend-item.highlighted {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .chart-legend-item.filtered {
          opacity: 0.5;
        }
        
        .chart-legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .chart-legend-text {
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Effetto di zoom */
        .zooming {
          position: relative;
        }
        
        .zooming::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          pointer-events: none;
          animation: zoomPulse 0.3s ease-out;
        }
        
        @keyframes zoomPulse {
          0% { opacity: 0.5; }
          100% { opacity: 0; }
        }
        
        @media (prefers-color-scheme: dark) {
          .chart-desktop-optimized {
            background: #212529;
          }
          
          .chart-legend-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .chart-legend-item.highlighted {
            background-color: rgba(255, 255, 255, 0.15);
          }
          
          .zooming::after {
            background: rgba(255, 255, 255, 0.05);
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  /**
   * Ottimizza le dimensioni del container per schermi piccoli
   * @param {HTMLElement} container - Il container del grafico
   */
  optimizeContainerForSmallScreens(container) {
    if (!container) return;
    
    // Imposta dimensioni ottimali per mobile
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.minHeight = '300px';
    container.style.height = 'auto';
    
    // Aggiungi padding per evitare che il grafico tocchi i bordi
    container.style.padding = '0.5rem';
    container.style.boxSizing = 'border-box';
    
    // Ottimizza per dispositivi con notch
    if (window.CSS && CSS.supports('padding-top: env(safe-area-inset-top)')) {
      container.style.paddingTop = 'max(0.5rem, env(safe-area-inset-top))';
      container.style.paddingLeft = 'max(0.5rem, env(safe-area-inset-left))';
      container.style.paddingRight = 'max(0.5rem, env(safe-area-inset-right))';
    }

    container.classList.add('chart-mobile-optimized');
  }
  
  /**
   * Posiziona la legenda sotto il grafico per mobile
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico Chart.js
   */
  positionLegendBelowChart(container, chart) {
    if (!chart || this.detectDevice() !== 'mobile') return;

    const legendContainer = document.createElement('div');
    legendContainer.className = 'mobile-chart-legend';
    legendContainer.setAttribute('role', 'list');
    legendContainer.setAttribute('aria-label', 'Legenda del grafico');
    container.appendChild(legendContainer);
  }
  
  /**
   * Setup ottimizzazioni touch specifiche per mobile
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico Chart.js
   */
  _setupMobileTouchOptimizations(container, chart) {
    if (!container) return;
    
    // Ottimizza il touch target
    container.style.touchAction = 'manipulation';
    container.style.userSelect = 'none';
    
    // Previeni il comportamento di zoom su double-tap
    container.addEventListener('touchend', (e) => {
      const now = new Date().getTime();
      const timeSince = now - (this.lastTouchEnd || 0);
      
      if (timeSince < 300 && timeSince > 0) {
        e.preventDefault();
      }
      
      this.lastTouchEnd = now;
    }, { passive: false });
    
    // Aggiungi feedback visivo per touch
    container.addEventListener('touchstart', () => {
      container.style.opacity = '0.9';
    }, { passive: true });
    
    container.addEventListener('touchend', () => {
      container.style.opacity = '1';
    }, { passive: true });
  }
  
  /**
   * Ottimizza per orientamento del dispositivo
   * @param {HTMLElement} container - Il container del grafico
   */
  optimizeForOrientation(container) {
    if (!container) return;
    
    const isLandscape = window.innerWidth > window.innerHeight;
    const device = this.detectDevice();
    
    if (device === 'mobile') {
      if (isLandscape) {
        // Orientamento landscape su mobile
        container.style.height = '50vh';
        container.style.minHeight = '250px';
      } else {
        // Orientamento portrait su mobile
        container.style.height = '60vh';
        container.style.minHeight = '300px';
      }
    }
    
    // Aggiungi classe per styling CSS specifico
    container.classList.toggle('landscape', isLandscape);
    container.classList.toggle('portrait', !isLandscape);

    const controlsContainer = container.querySelector('.mobile-chart-controls');
    if (controlsContainer) {
      controlsContainer.classList.toggle('controls-landscape', isLandscape);
      controlsContainer.classList.toggle('controls-portrait', !isLandscape);
    }
  }
  
  
  
  /**
   * Cleanup delle risorse
   */
  cleanup() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    // Rimuovi modali aperti
    const modal = document.getElementById('mobile-chart-detail-modal');
    if (modal) {
      modal.remove();
    }
    
    // Rimuovi toast aperti
    const toast = document.getElementById('mobile-chart-toast');
    if (toast) {
      toast.remove();
    }
  }

  /**
   * Clona in modo sicuro un oggetto evitando riferimenti circolari
   * @param {Object} obj - L'oggetto da clonare
   * @param {Map} cache - Cache per evitare riferimenti circolari (uso interno)
   * @returns {Object} - L'oggetto clonato
   */
  safeClone(obj, cache = new Map()) {
    // Gestisci casi base: null, undefined, tipi primitivi, funzioni
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    // Evita riferimenti circolari
    if (cache.has(obj)) {
      return cache.get(obj);
    }
    
    // Gestisci Date
    if (obj instanceof Date) {
      return new Date(obj);
    }
    
    // Gestisci Array
    if (Array.isArray(obj)) {
      const arrCopy = [];
      cache.set(obj, arrCopy);
      
      for (let i = 0; i < obj.length; i++) {
        arrCopy[i] = this.safeClone(obj[i], cache);
      }
      
      return arrCopy;
    }
    
    // Gestisci oggetti
    const objCopy = {};
    cache.set(obj, objCopy);
    
    // Copia le proprietà dell'oggetto
    for (const [key, value] of Object.entries(obj)) {
      // Salta funzioni e proprietà che potrebbero causare problemi
      if (typeof value !== 'function' && key !== 'chart' && key !== 'canvas') {
        objCopy[key] = this.safeClone(value, cache);
      }
    }
    
    return objCopy;
  }
}

export default ResponsiveChartAdapter;