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
    const adaptedOptions = JSON.parse(JSON.stringify(options)); // Deep clone
    
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
          const chart = element.chart;
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
        align: 'center',
        labels: {
          boxWidth: 20,
          font: { size: 14 },
          padding: 20,
          usePointStyle: true
        }
      };
      
      adaptedOptions.plugins.title = {
        ...adaptedOptions.plugins?.title,
        font: { size: 20, weight: 'bold' },
        padding: 30
      };
      
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
        displayColors: true
      };
      
      adaptedOptions.interaction = {
        mode: 'index',
        intersect: false
      };
      
      adaptedOptions.onHover = (event, activeElements) => {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
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
  setupMobileTouchControls(container) {
    if (this.detectDevice() !== 'mobile') return;
    
    // Aggiungi supporto per swipe gestures
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };
    
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleSwipeGesture();
    };
    
    const handleSwipeGesture = () => {
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
   * Mostra un toast di feedback per azioni su mobile
   * @param {string} message - Il messaggio da mostrare
   */
  showMobileToast(message) {
    // Rimuovi toast esistente
    const existingToast = document.getElementById('mobile-chart-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Crea il toast
    const toast = document.createElement('div');
    toast.id = 'mobile-chart-toast';
    toast.className = 'mobile-chart-toast';
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
   * Trigger per il cambio del tipo di grafico
   * @param {string} direction - 'next' o 'previous'
   */
  triggerChartTypeChange(direction) {
    const event = new CustomEvent('chartTypeSwipe', {
      detail: { direction }
    });
    document.dispatchEvent(event);
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
    this.setupMobileTouchOptimizations(container, chart);
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
  }
  
  /**
   * Posiziona la legenda sotto il grafico per mobile
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico Chart.js
   */
  positionLegendBelowChart(container, chart) {
    if (!chart || this.detectDevice() !== 'mobile') return;
    
    // La configurazione della legenda è già gestita in adaptOptions
    // Qui possiamo aggiungere ottimizzazioni specifiche del layout
    
    // Assicurati che ci sia spazio sufficiente per la legenda
    const legendHeight = 80; // Altezza stimata della legenda
    const currentHeight = parseInt(container.style.height) || 300;
    const newHeight = currentHeight + legendHeight;
    
    container.style.height = `${newHeight}px`;
    
    // Aggiungi classe per styling CSS specifico
    container.classList.add('chart-legend-bottom');
  }
  
  /**
   * Setup ottimizzazioni touch specifiche per mobile
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico Chart.js
   */
  setupMobileTouchOptimizations(container, chart) {
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
  }
  
  /**
   * Implementa controlli touch-friendly specifici per mobile
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico Chart.js
   */
  implementMobileTouchControls(container, chart) {
    if (this.detectDevice() !== 'mobile') return;
    
    // Setup ottimizzazioni touch
    this.setupMobileTouchOptimizations(container, chart);
    
    // Implementa layout responsive specifico per mobile
    this.implementMobileResponsiveLayout(container, chart);
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
}

export default ResponsiveChartAdapter;