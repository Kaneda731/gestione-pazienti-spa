/**
 * Adapter specifico per grafici su dispositivi tablet
 */
import ChartUtils from '../utils/ChartUtils.js';
import ChartModals from '../ui/ChartModals.js';
import ChartToasts from '../ui/ChartToasts.js';

class TabletChartAdapter {
  /**
   * Inizializza l'adapter per dispositivi tablet
   */
  constructor() {
    this.modals = new ChartModals();
    this.toasts = new ChartToasts();
  }

  /**
   * Adatta le opzioni del grafico per dispositivi tablet
   * @param {Object} options - Le opzioni originali del grafico
   * @returns {Object} - Le opzioni adattate
   */
  adaptOptions(options) {
    // Clona in modo sicuro le opzioni
    const adaptedOptions = ChartUtils.safeClone(options);
    
    // Inizializza plugins se non esistono
    adaptedOptions.plugins = adaptedOptions.plugins || {};
    adaptedOptions.interaction = adaptedOptions.interaction || {};
    
    // Configurazioni specifiche per tablet
    adaptedOptions.plugins.legend = this._getLegendOptions();
    adaptedOptions.plugins.title = this._getTitleOptions(adaptedOptions.plugins?.title);
    adaptedOptions.plugins.tooltip = this._getTooltipOptions(adaptedOptions.plugins?.tooltip);
    adaptedOptions.interaction = this._getInteractionOptions();
    
    // Configurazioni generali
    adaptedOptions.maintainAspectRatio = false;
    adaptedOptions.responsive = true;
    adaptedOptions.devicePixelRatio = window.devicePixelRatio || 1;
    
    // Animazioni per tablet
    adaptedOptions.animation = {
      duration: 900,
      easing: 'easeOutQuart'
    };
    
    // Eventi specifici
    adaptedOptions.onHover = this._getHoverHandler();
    adaptedOptions.onClick = this._getClickHandler();
    
    return adaptedOptions;
  }

  /**
   * Adatta il layout del container per dispositivi tablet
   * @param {HTMLElement} container - Il container del grafico
   */
  adaptLayout(container) {
    // Rimuovi classi precedenti
    container.classList.remove('chart-mobile', 'chart-desktop');
    container.classList.add('chart-tablet');
    
    // Imposta altezza minima per garantire la leggibilità su tablet
    container.style.minHeight = '400px';
    container.style.height = '70vh';
    
    // Ottimizza il container per tablet
    this._optimizeContainer(container);
  }

  /**
   * Ottiene le opzioni per la legenda su tablet
   * @returns {Object} - Le opzioni della legenda
   * @private
   */
  _getLegendOptions() {
    return {
      position: 'bottom',
      align: 'center',
      labels: {
        boxWidth: 18,
        font: { size: 14 },
        padding: 18,
        usePointStyle: true
      },
      onClick: (e, legendItem, legend) => {
        // Implementa toggle della visibilità
        const index = legendItem.index;
        const chart = legend.chart;
        const meta = chart.getDatasetMeta(0);
        
        meta.data[index].hidden = !meta.data[index].hidden;
        chart.update();
        
        // Feedback visivo
        this.toasts.showInfoToast(
          `${meta.data[index].hidden ? 'Nascosto' : 'Mostrato'}: ${chart.data.labels[index]}`,
          'tablet',
          2000
        );
      }
    };
  }

  /**
   * Ottiene le opzioni per il titolo su tablet
   * @param {Object} existingOptions - Opzioni esistenti
   * @returns {Object} - Le opzioni del titolo
   * @private
   */
  _getTitleOptions(existingOptions = {}) {
    return {
      ...existingOptions,
      font: { size: 18, weight: 'bold' },
      padding: 25
    };
  }

  /**
   * Ottiene le opzioni per il tooltip su tablet
   * @param {Object} existingOptions - Opzioni esistenti
   * @returns {Object} - Le opzioni del tooltip
   * @private
   */
  _getTooltipOptions(existingOptions = {}) {
    return {
      ...existingOptions,
      enabled: false,
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: { size: 15, weight: 'bold' },
      bodyFont: { size: 14 },
      padding: 15,
      cornerRadius: 8,
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
        }
      }
    };
  }

  /**
   * Ottiene le opzioni per le interazioni su tablet
   * @returns {Object} - Le opzioni di interazione
   * @private
   */
  _getInteractionOptions() {
    return {
      mode: 'index',
      intersect: false
    };
  }

  /**
   * Ottiene l'handler per l'evento hover su tablet
   * @returns {Function} - L'handler per l'hover
   * @private
   */
  _getHoverHandler() {
    return (event, activeElements) => {
      if (event.native) {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    };
  }

  /**
   * Ottiene l'handler per l'evento click su tablet
   * @returns {Function} - L'handler per il click
   * @private
   */
  _getClickHandler() {
    return (event, activeElements) => {
      if (activeElements.length > 0) {
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
   * Ottimizza il container per dispositivi tablet
   * @param {HTMLElement} container - Il container del grafico
   * @private
   */
  _optimizeContainer(container) {
    // Ottimizza il rendering
    container.style.willChange = 'transform';
    
    // Aggiungi padding per migliorare la leggibilità
    container.style.padding = '0.75rem';
    
    // Assicurati che il container abbia l'altezza minima
    if (!container.style.minHeight) {
      container.style.minHeight = '400px';
    }
    
    // Aggiungi classe per styling CSS specifico
    container.classList.add('chart-tablet-optimized');
  }

  /**
   * Mostra una notifica all'utente
   * @param {string} message - Il messaggio da mostrare
   * @param {string} type - Il tipo di notifica ('success', 'error', 'info', 'warning')
   */
  showNotification(message, type = 'info') {
    this.toasts.showToast(message, type, 'tablet', 3000);
  }
}

export default TabletChartAdapter;