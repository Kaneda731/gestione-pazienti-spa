// src/features/charts/components/ChartTypeManager.js

/**
 * Gestisce i diversi tipi di grafici disponibili
 */
class ChartTypeManager {
  /**
   * Inizializza il manager con i tipi di grafici supportati
   * @param {Object} chartJsRef - Riferimento alla libreria Chart.js
   */
  constructor(chartJsRef) {
    this.Chart = chartJsRef;
    this.chartTypes = {
      pie: { 
        name: 'Torta', 
        renderer: this.renderPieChart.bind(this),
        icon: '<i class="fas fa-chart-pie"></i>'
      },
      bar: { 
        name: 'Barre', 
        renderer: this.renderBarChart.bind(this),
        icon: '<i class="fas fa-chart-bar"></i>'
      },
      line: { 
        name: 'Linee', 
        renderer: this.renderLineChart.bind(this),
        icon: '<i class="fas fa-chart-line"></i>'
      }
    };
    this.currentType = 'pie';
    this.currentChart = null;
  }
  
  /**
   * Cambia il tipo di grafico
   * @param {string} type - Il tipo di grafico da utilizzare
   * @returns {boolean} - True se il tipo è valido e cambiato, false altrimenti
   */
  setChartType(type) {
    if (this.chartTypes[type]) {
      this.currentType = type;
      return true;
    }
    return false;
  }
  
  /**
   * Renderizza il grafico del tipo corrente
   * @param {HTMLElement} container - Il container dove renderizzare il grafico
   * @param {Array} data - I dati da visualizzare
   * @param {Object} options - Opzioni di configurazione
   * @returns {Object} - L'istanza del grafico creato
   */
  renderChart(container, data, options = {}) {
    // Distruggi il grafico precedente se esiste
    if (this.currentChart) {
      this.currentChart.destroy();
      this.currentChart = null;
    }
    
    // Usa il renderer specifico per il tipo corrente
    const renderer = this.chartTypes[this.currentType].renderer;
    this.currentChart = renderer(container, data, options);
    return this.currentChart;
  }
  
  /**
   * Crea un elemento canvas nel container
   * @param {HTMLElement} container - Il container dove inserire il canvas
   * @returns {HTMLCanvasElement} - L'elemento canvas creato
   */
  createCanvas(container) {
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    return canvas;
  }
  
  /**
   * Prepara i dati per Chart.js
   * @param {Array} data - I dati nel formato [['Label', 'Value'], ...]
   * @returns {Object} - I dati formattati per Chart.js
   */
  prepareChartData(data) {
    // Estrai header e righe
    const [headers, ...rows] = data;
    
    // Estrai labels e valori
    const labels = rows.map(row => row[0]);
    const values = rows.map(row => row[1]);
    
    return { labels, values };
  }
  
  /**
   * Renderizza un grafico a torta
   * @param {HTMLElement} container - Il container dove renderizzare il grafico
   * @param {Array} data - I dati da visualizzare
   * @param {Object} options - Opzioni di configurazione
   * @returns {Object} - L'istanza del grafico creato
   */
  renderPieChart(container, data, options = {}) {
    const canvas = this.createCanvas(container);
    const ctx = canvas.getContext('2d');
    const { labels, values } = this.prepareChartData(data);
    
    const chartData = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#43e97b', '#f9ea8f', '#f67019', '#a259f7', '#e14eca', '#00c9a7'
        ],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 15
      }]
    };
    
    const defaultOptions = {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 14 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    // Unisci le opzioni predefinite con quelle fornite
    const chartOptions = this.mergeOptions(defaultOptions, options);
    
    return new this.Chart(ctx, chartOptions);
  }
  
  /**
   * Renderizza un grafico a barre
   * @param {HTMLElement} container - Il container dove renderizzare il grafico
   * @param {Array} data - I dati da visualizzare
   * @param {Object} options - Opzioni di configurazione
   * @returns {Object} - L'istanza del grafico creato
   */
  renderBarChart(container, data, options = {}) {
    const canvas = this.createCanvas(container);
    const ctx = canvas.getContext('2d');
    const { labels, values } = this.prepareChartData(data);
    
    const chartData = {
      labels: labels,
      datasets: [{
        label: options.datasetLabel || 'Valori',
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };
    
    const defaultOptions = {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.parsed.y}`;
              }
            }
          }
        }
      }
    };
    
    // Unisci le opzioni predefinite con quelle fornite
    const chartOptions = this.mergeOptions(defaultOptions, options);
    
    return new this.Chart(ctx, chartOptions);
  }
  
  /**
   * Renderizza un grafico a linee
   * @param {HTMLElement} container - Il container dove renderizzare il grafico
   * @param {Array} data - I dati da visualizzare
   * @param {Object} options - Opzioni di configurazione
   * @returns {Object} - L'istanza del grafico creato
   */
  renderLineChart(container, data, options = {}) {
    const canvas = this.createCanvas(container);
    const ctx = canvas.getContext('2d');
    const { labels, values } = this.prepareChartData(data);
    
    const chartData = {
      labels: labels,
      datasets: [{
        label: options.datasetLabel || 'Trend',
        data: values,
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    };
    
    const defaultOptions = {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      }
    };
    
    // Unisci le opzioni predefinite con quelle fornite
    const chartOptions = this.mergeOptions(defaultOptions, options);
    
    return new this.Chart(ctx, chartOptions);
  }
  
  /**
   * Unisce le opzioni predefinite con quelle fornite
   * @param {Object} defaultOptions - Le opzioni predefinite
   * @param {Object} customOptions - Le opzioni personalizzate
   * @returns {Object} - Le opzioni unite
   */
  mergeOptions(defaultOptions, customOptions) {
    // Copia superficiale delle opzioni predefinite
    const result = { ...defaultOptions };
    
    // Se ci sono opzioni personalizzate per il tipo
    if (customOptions.type) {
      result.type = customOptions.type;
    }
    
    // Se ci sono opzioni personalizzate per i dati
    if (customOptions.data) {
      result.data = { ...result.data, ...customOptions.data };
    }
    
    // Se ci sono opzioni personalizzate per le opzioni
    if (customOptions.options) {
      result.options = { ...result.options, ...customOptions.options };
      
      // Gestione speciale per plugins che potrebbero avere sottoproprietà
      if (customOptions.options.plugins && result.options.plugins) {
        result.options.plugins = { ...result.options.plugins, ...customOptions.options.plugins };
      }
    }
    
    return result;
  }
  
  /**
   * Restituisce i tipi di grafico disponibili
   * @returns {Array} - Array di oggetti con id, nome e icona per ogni tipo
   */
  getAvailableChartTypes() {
    return Object.entries(this.chartTypes).map(([id, type]) => ({
      id,
      name: type.name,
      icon: type.icon
    }));
  }
  
  /**
   * Aggiorna il grafico corrente con nuovi dati o opzioni
   * @param {Array} data - I nuovi dati (opzionale)
   * @param {Object} options - Le nuove opzioni (opzionale)
   */
  updateChart(data, options = {}) {
    if (!this.currentChart) return;
    
    if (data) {
      const { labels, values } = this.prepareChartData(data);
      this.currentChart.data.labels = labels;
      this.currentChart.data.datasets[0].data = values;
    }
    
    if (options && Object.keys(options).length > 0) {
      // Aggiorna le opzioni mantenendo quelle esistenti
      this.currentChart.options = { ...this.currentChart.options, ...options };
    }
    
    this.currentChart.update();
  }
  
  /**
   * Pulisce le risorse quando il componente viene distrutto
   */
  cleanup() {
    if (this.currentChart) {
      this.currentChart.destroy();
      this.currentChart = null;
    }
  }
}

export default ChartTypeManager;