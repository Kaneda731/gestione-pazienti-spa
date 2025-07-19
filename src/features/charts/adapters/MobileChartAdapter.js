/**
 * Adapter specifico per grafici su dispositivi mobili
 */
import ChartUtils from '../utils/ChartUtils.js';
import ChartModals from '../ui/ChartModals.js';
import ChartToasts from '../ui/ChartToasts.js';

class MobileChartAdapter {
  /**
   * Inizializza l'adapter per dispositivi mobili
   */
  constructor() {
    this.modals = new ChartModals();
    this.toasts = new ChartToasts();
    this.lastTouchEnd = 0;
  }

  /**
   * Adatta le opzioni del grafico per dispositivi mobili
   * @param {Object} options - Le opzioni originali del grafico
   * @returns {Object} - Le opzioni adattate
   */
  adaptOptions(options) {
    // Clona in modo sicuro le opzioni
    const adaptedOptions = ChartUtils.safeClone(options);
    
    // Inizializza plugins se non esistono
    adaptedOptions.plugins = adaptedOptions.plugins || {};
    adaptedOptions.interaction = adaptedOptions.interaction || {};
    
    // Configurazioni specifiche per mobile
    adaptedOptions.plugins.legend = this._getLegendOptions();
    adaptedOptions.plugins.title = this._getTitleOptions(adaptedOptions.plugins?.title);
    adaptedOptions.plugins.tooltip = this._getTooltipOptions(adaptedOptions.plugins?.tooltip);
    adaptedOptions.interaction = this._getInteractionOptions();
    
    // Configurazioni generali
    adaptedOptions.maintainAspectRatio = false;
    adaptedOptions.responsive = true;
    adaptedOptions.devicePixelRatio = window.devicePixelRatio || 1;
    
    // Ottimizzazioni per performance su mobile
    adaptedOptions.animation = {
      duration: 800,
      easing: 'easeOutQuart'
    };
    
    // Eventi touch specifici
    adaptedOptions.onHover = this._getHoverHandler();
    adaptedOptions.onClick = this._getClickHandler();
    
    return adaptedOptions;
  }

  /**
   * Adatta il layout del container per dispositivi mobili
   * @param {HTMLElement} container - Il container del grafico
   */
  adaptLayout(container) {
    // Rimuovi classi precedenti
    container.classList.remove('chart-tablet', 'chart-desktop');
    container.classList.add('chart-mobile');
    
    // Imposta altezza minima per garantire la leggibilità su mobile
    container.style.minHeight = '300px';
    container.style.height = '60vh';
    
    // Ottimizza il container per mobile
    this._optimizeContainer(container);
    
    // Configura controlli touch
    this._setupTouchControls(container);
  }

  /**
   * Ottiene le opzioni per la legenda su mobile
   * @returns {Object} - Le opzioni della legenda
   * @private
   */
  _getLegendOptions() {
    return {
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
              // Gestisci diversi formati di backgroundColor
              const backgroundColor = ChartUtils.getDatasetColor(dataset, i);
              
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
  }

  /**
   * Ottiene le opzioni per il titolo su mobile
   * @param {Object} existingOptions - Opzioni esistenti
   * @returns {Object} - Le opzioni del titolo
   * @private
   */
  _getTitleOptions(existingOptions = {}) {
    return {
      ...existingOptions,
      font: { size: 16, weight: 'bold' },
      padding: 20
    };
  }

  /**
   * Ottiene le opzioni per il tooltip su mobile
   * @param {Object} existingOptions - Opzioni esistenti
   * @returns {Object} - Le opzioni del tooltip
   * @private
   */
  _getTooltipOptions(existingOptions = {}) {
    return {
      ...existingOptions,
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
        ...existingOptions?.callbacks,
        title: function(context) {
          return context[0].label || '';
        },
        label: function(context) {
          const label = context.dataset.label || '';
          const value = context.parsed || context.raw;
          const total = ChartUtils.calculateTotal(context.dataset.data);
          const percentage = ChartUtils.calculatePercentage(value, total);
          return [`${label}: ${value}`, `Percentuale: ${percentage}`];
        },
        afterLabel: function(context) {
          return 'Tocca per dettagli';
        }
      },
      animation: {
        duration: 300
      }
    };
  }

  /**
   * Ottiene le opzioni per le interazioni su mobile
   * @returns {Object} - Le opzioni di interazione
   * @private
   */
  _getInteractionOptions() {
    return {
      mode: 'nearest',
      intersect: false,
      includeInvisible: false
    };
  }

  /**
   * Ottiene l'handler per l'evento hover su mobile
   * @returns {Function} - L'handler per l'hover
   * @private
   */
  _getHoverHandler() {
    return (event, activeElements) => {
      if (activeElements.length > 0) {
        event.native.target.style.cursor = 'pointer';
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      } else {
        event.native.target.style.cursor = 'default';
      }
    };
  }

  /**
   * Ottiene l'handler per l'evento click su mobile
   * @returns {Function} - L'handler per il click
   * @private
   */
  _getClickHandler() {
    return (event, activeElements) => {
      if (activeElements.length > 0) {
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
        
        const element = activeElements[0];
        const dataIndex = element.index;
        const chart = event.chart;
        const data = chart.data;
        const dataset = data.datasets[0];
        
        // Ottieni il colore dell'elemento
        const color = ChartUtils.getDatasetColor(dataset, dataIndex);
        
        // Mostra il modal con i dettagli
        this.modals.showMobileDetailModal({
          label: data.labels[dataIndex],
          value: dataset.data[dataIndex],
          color: color,
          total: ChartUtils.calculateTotal(dataset.data)
        });
      }
    };
  }

  /**
   * Ottimizza il container per dispositivi mobile
   * @param {HTMLElement} container - Il container del grafico
   * @private
   */
  _optimizeContainer(container) {
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
   * Configura i controlli touch per dispositivi mobili
   * @param {HTMLElement} container - Il container del grafico
   * @private
   */
  _setupTouchControls(container) {
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
  }

  /**
   * Gestisce il gesto di swipe
   * @param {number} touchStartX - Coordinata X iniziale del tocco
   * @param {number} touchStartY - Coordinata Y iniziale del tocco
   * @param {number} touchEndX - Coordinata X finale del tocco
   * @param {number} touchEndY - Coordinata Y finale del tocco
   * @private
   */
  _handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY) {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 50;

    // Swipe orizzontale per cambiare tipo di grafico
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        this._triggerChartTypeChange('previous');
      } else {
        this._triggerChartTypeChange('next');
      }
    }
  }

  /**
   * Attiva il cambio di tipo di grafico
   * @param {string} direction - La direzione del cambio ('previous' o 'next')
   * @private
   */
  _triggerChartTypeChange(direction) {
    // Crea e dispara un evento personalizzato
    const event = new CustomEvent('chartTypeChange', {
      detail: { direction: direction }
    });
    document.dispatchEvent(event);
    
    // Mostra feedback all'utente
    this.toasts.showInfoToast(
      direction === 'next' ? 'Prossimo tipo di grafico' : 'Tipo di grafico precedente',
      'mobile',
      2000
    );
  }

  /**
   * Mostra una notifica all'utente
   * @param {string} message - Il messaggio da mostrare
   * @param {string} type - Il tipo di notifica ('success', 'error', 'info', 'warning')
   */
  showNotification(message, type = 'info') {
    this.toasts.showToast(message, type, 'mobile', 3000);
  }
}

export default MobileChartAdapter;