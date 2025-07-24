/**
 * Adapter specifico per grafici su dispositivi desktop
 */
import ChartUtils from '../utils/ChartUtils.js';
import ChartModals from '../ui/ChartModals.js';
import ChartToasts from '../ui/ChartToasts.js';

class DesktopChartAdapter {
  /**
   * Inizializza l'adapter per dispositivi desktop
   */
  constructor() {
    this.modals = new ChartModals();
    this.toasts = new ChartToasts();
  }

  /**
   * Adatta le opzioni del grafico per dispositivi desktop
   * @param {Object} options - Le opzioni originali del grafico
   * @returns {Object} - Le opzioni adattate
   */
  adaptOptions(options) {
    // Clona in modo sicuro le opzioni
    const adaptedOptions = ChartUtils.safeClone(options);

    // Inizializza plugins se non esistono
    adaptedOptions.plugins = adaptedOptions.plugins || {};
    adaptedOptions.interaction = adaptedOptions.interaction || {};

    // Ricava il tipo di grafico dalle opzioni (Chart.js usa 'type' a questo livello)
    const chartType = options.type || (options.plugins && options.plugins.type) || null;

    // Configurazioni specifiche per desktop
    adaptedOptions.plugins.legend = this._getLegendOptions(chartType);
    adaptedOptions.plugins.title = this._getTitleOptions(adaptedOptions.plugins?.title);
    adaptedOptions.plugins.tooltip = this._getTooltipOptions(adaptedOptions.plugins?.tooltip);
    adaptedOptions.interaction = this._getInteractionOptions();

    // Supporto per zoom
    adaptedOptions.plugins.zoom = this._getZoomOptions();

    // Configurazioni generali
    adaptedOptions.maintainAspectRatio = false;
    adaptedOptions.responsive = true;

    // Animazioni fluide per desktop
    adaptedOptions.animation = {
      duration: 1000,
      easing: 'easeOutQuart',
      delay: (context) => {
        // Aggiungi un leggero ritardo per creare un effetto a cascata
        return context.dataIndex * 50;
      }
    };

    // Eventi specifici
    adaptedOptions.onHover = this._getHoverHandler();
    adaptedOptions.onClick = this._getClickHandler();

    return adaptedOptions;
  }

  /**
   * Adatta il layout del container per dispositivi desktop
   * @param {HTMLElement} container - Il container del grafico
   */
  adaptLayout(container) {
    // Rimuovi classi precedenti
    container.classList.remove('chart-mobile', 'chart-tablet');
    container.classList.add('chart-desktop');
    
    // Imposta altezza minima per garantire la leggibilità su desktop
    container.style.minHeight = '500px';
    container.style.height = '80vh';
    
    // Ottimizza il container per desktop
    this._optimizeContainer(container);
  }

  /**
   * Ottiene le opzioni per la legenda su desktop
   * @returns {Object} - Le opzioni della legenda
   * @private
   */
  _getLegendOptions(chartType) {
    // Legenda ottimizzata per i grafici a barre e linee: sempre visibile, in alto, senza scroll
    if (chartType === 'bar' || chartType === 'line') {
      return {
        display: true,
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 14,
          font: { size: 12 },
          padding: 8,
          usePointStyle: true,
          maxWidth: undefined,
          maxHeight: undefined,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const backgroundColor = ChartUtils.getDatasetColor(dataset, i);
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
        onClick: (e, legendItem, legend) => {
          const index = legendItem.index;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(0);
          meta.data[index].hidden = !meta.data[index].hidden;
          chart.update();
        }
      };
    }
    // Default: legenda a destra per altri tipi
    return {
      position: 'right',
      align: 'start',
      labels: {
        boxWidth: 20,
        font: { size: 14 },
        padding: 20,
        usePointStyle: true,
        generateLabels: function(chart) {
          const data = chart.data;
          if (data.labels.length && data.datasets.length) {
            return data.labels.map((label, i) => {
              const dataset = data.datasets[0];
              const backgroundColor = ChartUtils.getDatasetColor(dataset, i);
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
      onClick: (e, legendItem, legend) => {
        const index = legendItem.index;
        const chart = legend.chart;
        const meta = chart.getDatasetMeta(0);
        meta.data[index].hidden = !meta.data[index].hidden;
        chart.update();
        const container = chart.canvas.parentNode;
        if (container) {
          const item = container.querySelector(`.chart-legend-item-${index}`);
          if (item) {
            item.classList.toggle('filtered');
          }
        }
      }
    };
  }

  /**
   * Ottiene le opzioni per il titolo su desktop
   * @param {Object} existingOptions - Opzioni esistenti
   * @returns {Object} - Le opzioni del titolo
   * @private
   */
  _getTitleOptions(existingOptions = {}) {
    return {
      ...existingOptions,
      font: { size: 20, weight: 'bold' },
      padding: 30,
      display: true
    };
  }

  /**
   * Ottiene le opzioni per il tooltip su desktop
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
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      titleFont: { size: 16, weight: 'bold' },
      bodyFont: { size: 14 },
      padding: 16,
      cornerRadius: 8,
      displayColors: true,
      // Callback personalizzati per tooltip dettagliati
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
  }

  /**
   * Ottiene le opzioni per le interazioni su desktop
   * @returns {Object} - Le opzioni di interazione
   * @private
   */
  _getInteractionOptions() {
    return {
      mode: 'index',
      intersect: false,
      includeInvisible: false
    };
  }

  /**
   * Ottiene le opzioni per lo zoom su desktop
   * @returns {Object} - Le opzioni di zoom
   * @private
   */
  _getZoomOptions() {
    return {
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
  }

  /**
   * Ottiene l'handler per l'evento hover su desktop
   * @returns {Function} - L'handler per l'hover
   * @private
   */
  _getHoverHandler() {
    return (event, activeElements, chart) => {
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
  }

  /**
   * Ottiene l'handler per l'evento click su desktop
   * @returns {Function} - L'handler per il click
   * @private
   */
  _getClickHandler() {
    return (event, activeElements, chart) => {
      if (activeElements.length > 0 && activeElements[0]) {
        const element = activeElements[0];
        if (chart) {
          const dataIndex = element.index;
          const data = chart.data;
          const dataset = data.datasets[0];

          // Ottieni il colore dell'elemento
          const color = ChartUtils.getDatasetColor(dataset, dataIndex);
          
          // Calcola il totale e la percentuale
          const total = ChartUtils.calculateTotal(dataset.data);
          const percentage = ChartUtils.calculatePercentage(dataset.data[dataIndex], total);

          // Mostra il pannello con i dettagli
          this.modals.showDesktopDetailPanel({
            label: data.labels[dataIndex],
            value: dataset.data[dataIndex],
            color: color,
            total: total,
            percentage: percentage,
            chart: chart
          });
        }
      }
    };
  }

  /**
   * Ottimizza il container per dispositivi desktop
   * @param {HTMLElement} container - Il container del grafico
   * @private
   */
  _optimizeContainer(container) {
    // Aggiungi padding per migliorare la leggibilità
    container.style.padding = '1rem';
    
    // Assicurati che il container abbia l'altezza minima
    if (!container.style.minHeight) {
      container.style.minHeight = '500px';
    }
    
    // Aggiungi classe per styling CSS specifico
    container.classList.add('chart-desktop-optimized');
  }

  /**
   * Mostra una notifica all'utente
   * @param {string} message - Il messaggio da mostrare
   * @param {string} type - Il tipo di notifica ('success', 'error', 'info', 'warning')
   */
  showNotification(message, type = 'info') {
    this.toasts.showToast(message, type, 'desktop', 3000);
  }
}

export default DesktopChartAdapter;