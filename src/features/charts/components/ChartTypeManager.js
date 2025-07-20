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
        icon: '<span class="material-icons">pie_chart</span>'
      },
      bar: { 
        name: 'Barre', 
        renderer: this.renderBarChart.bind(this),
        icon: '<span class="material-icons">bar_chart</span>'
      },
      line: { 
        name: 'Linee', 
        renderer: this.renderLineChart.bind(this),
        icon: '<span class="material-icons">show_chart</span>'
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
  renderChart(container, data, options = {}, chartType) {
    // Distruggi il grafico precedente se esiste
    if (this.currentChart) {
      this.currentChart.destroy();
      this.currentChart = null;
    }

    // Imposta il tipo di grafico corrente
    this.setChartType(chartType);
    
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
   * @param {Array|Object} data - I dati nel formato [['Label', 'Value'], ...] o {labels: [], datasets: [{data: []}]}
   * @returns {Object} - I dati formattati per Chart.js
   */
  prepareChartData(data) {
    // Verifica se i dati sono già nel formato Chart.js
    if (data && typeof data === 'object' && data.labels && data.datasets) {
      return {
        labels: data.labels,
        values: data.datasets[0].data
      };
    }
    
    // Verifica se i dati sono un array
    if (Array.isArray(data)) {
      // Se è un array di array (formato [['Label', 'Value'], ...])
      if (data.length > 0 && Array.isArray(data[0])) {
        // Estrai header e righe
        const [headers, ...rows] = data;
        
        // Estrai labels e valori
        const labels = rows.map(row => row[0]);
        const values = rows.map(row => row[1]);
        
        return { labels, values };
      } 
      // Se è un array di oggetti (formato [{label: 'Label', value: 'Value'}, ...])
      else if (data.length > 0 && typeof data[0] === 'object') {
        const labels = data.map(item => item.label || item.diagnosi || item.name || 'Non specificato');
        const values = data.map(item => item.value || item.count || 1);
        
        return { labels, values };
      }
    }
    
    // Fallback: restituisci array vuoti per evitare errori
    console.warn('Formato dati non riconosciuto in prepareChartData:', data);
    return { labels: [], values: [] };
  }
  
  /**
   * Renderizza un grafico a torta migliorato
   * @param {HTMLElement} container - Il container dove renderizzare il grafico
   * @param {Array} data - I dati da visualizzare
   * @param {Object} options - Opzioni di configurazione
   * @returns {Object} - L'istanza del grafico creato
   */
  renderPieChart(container, data, options = {}) {
    const canvas = this.createCanvas(container);
    const ctx = canvas.getContext('2d');
    const { labels, values } = this.prepareChartData(data);
    
    // Calcola il totale per le percentuali
    const total = values.reduce((sum, value) => sum + value, 0);
    
    // Genera una palette di colori più ampia e armoniosa
    const colorPalette = this.generateColorPalette(values.length);
    
    const chartData = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colorPalette,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 20,
        hoverBorderWidth: 3,
        hoverBorderColor: '#fff',
        // Aggiungi percentuali per ogni segmento
        percentages: values.map(value => ((value / total) * 100).toFixed(1))
      }]
    };
    
    // Determina se usare doughnut o pie in base alle opzioni
    const chartType = options.chartType || options.type || 'doughnut';
    
    const defaultOptions = {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: chartType === 'doughnut' ? '60%' : 0, // Personalizza il cutout per doughnut
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 14 },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i];
                    const percentage = dataset.percentages[i];
                    const backgroundColor = dataset.backgroundColor[i];
                    
                    return {
                      text: `${label} (${percentage}%)`,
                      fillStyle: backgroundColor,
                      strokeStyle: backgroundColor,
                      lineWidth: 0,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            },
            onClick: (e, legendItem, legend) => {
              // Implementa toggle della visibilità per interattività
              const index = legendItem.index;
              const chart = legend.chart;
              const meta = chart.getDatasetMeta(0);
              
              // Toggle della visibilità dell'elemento
              meta.data[index].hidden = !meta.data[index].hidden;
              
              // Aggiorna il grafico
              chart.update();
            }
          },
          tooltip: {
            enabled: false // Disabilita il tooltip di default
          },
          // Etichette con percentuali disabilitate di default per evitare errori
          datalabels: false
        },
// Configura l'interattività per evitare tooltip su fette errate
        hover: {
          mode: 'nearest',
          intersect: true
        },
        events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
        onHover: (event, activeElements) => {
          // Gestione hover personalizzata
          if (!event || !event.chart) return;
          
          const canvas = event.chart.canvas;
          const chartContainer = canvas.parentElement;
          
          // Rimuovi tooltip esistente
          const existingTooltip = chartContainer.querySelector('.custom-pie-tooltip');
          if (existingTooltip) {
            existingTooltip.remove();
          }
          
          if (activeElements && activeElements.length > 0) {
            const element = activeElements[0];
            const datasetIndex = element.datasetIndex;
            const index = element.index;
            
            const label = event.chart.data.labels[index];
            const value = event.chart.data.datasets[datasetIndex].data[index];
            const total = event.chart.data.datasets[datasetIndex].data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            // Crea tooltip HTML personalizzato con stili migliorati
            const tooltip = document.createElement('div');
            tooltip.className = 'custom-pie-tooltip';
            tooltip.style.cssText = `
              position: fixed;
              background: rgba(0, 0, 0, 0.9);
              color: white;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 14px;
              pointer-events: none;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              z-index: 9999;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.4;
              max-width: 200px;
              word-wrap: break-word;
            `;
            
            tooltip.innerHTML = `
              <div style="font-weight: bold; margin-bottom: 4px;">${label}</div>
              <div>${value} pazienti</div>
              <div style="font-size: 12px; opacity: 0.9;">${percentage}% del totale</div>
            `;
            
            // Posiziona il tooltip vicino al mouse
            const rect = canvas.getBoundingClientRect();
            const x = event.native.clientX + 10;
            const y = event.native.clientY - 10;
            
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
            
            document.body.appendChild(tooltip);
            
            // Assicurati che il tooltip non esca dallo schermo
            const tooltipRect = tooltip.getBoundingClientRect();
            if (x + tooltipRect.width > window.innerWidth) {
              tooltip.style.left = (x - tooltipRect.width - 20) + 'px';
            }
            if (y + tooltipRect.height > window.innerHeight) {
              tooltip.style.top = (y - tooltipRect.height - 20) + 'px';
            }
          }
        },
        onLeave: (event) => {
          // Rimuovi tutti i tooltip quando il mouse lascia
          const tooltips = document.querySelectorAll('.custom-pie-tooltip');
          tooltips.forEach(tooltip => tooltip.remove());
        },
        onClick: (event, activeElements) => {
          // Gestione click per evitare modalità errata
          if (activeElements && activeElements.length > 0) {
            const element = activeElements[0];
            const datasetIndex = element.datasetIndex;
            const index = element.index;
            
            const label = event.chart.data.labels[index];
            const value = event.chart.data.datasets[datasetIndex].data[index];
            const total = event.chart.data.datasets[datasetIndex].data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            // Mostra brevemente il tooltip al click se non già visibile
            if (!document.querySelector('.custom-pie-tooltip')) {
              const tooltip = document.createElement('div');
              tooltip.className = 'custom-pie-tooltip';
              tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                pointer-events: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.4;
              `;
              
              tooltip.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${label}</div>
                <div>${value} pazienti</div>
                <div style="font-size: 12px; opacity: 0.9;">${percentage}% del totale</div>
              `;
              
              const x = event.native.clientX + 10;
              const y = event.native.clientY - 10;
              tooltip.style.left = x + 'px';
              tooltip.style.top = y + 'px';
              
              document.body.appendChild(tooltip);
              
              // Rimuovi dopo 2 secondi
              setTimeout(() => {
                tooltip.remove();
              }, 2000);
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    };
    
    // Unisci le opzioni predefinite con quelle fornite
    const chartOptions = this.mergeOptions(defaultOptions, options);
    
    return new this.Chart(ctx, chartOptions);
  }
  
  /**
   * Renderizza un grafico a barre migliorato
   * @param {HTMLElement} container - Il container dove renderizzare il grafico
   * @param {Array} data - I dati da visualizzare
   * @param {Object} options - Opzioni di configurazione
   * @returns {Object} - L'istanza del grafico creato
   */
  renderBarChart(container, data, options = {}) {
    const canvas = this.createCanvas(container);
    const ctx = canvas.getContext('2d');
    const { labels, values } = this.prepareChartData(data);
    
    // Genera una palette di colori armoniosa
    const colorPalette = this.generateColorPalette(values.length);
    
    // Calcola il totale per le percentuali
    const total = values.reduce((sum, value) => sum + value, 0);
    
    const chartData = {
      labels: labels,
      datasets: [{
        label: options.datasetLabel || 'Valori',
        data: values,
        backgroundColor: options.singleColor ? 'rgba(54, 162, 235, 0.7)' : colorPalette,
        borderColor: options.singleColor ? 'rgba(54, 162, 235, 1)' : colorPalette,
        borderWidth: 1,
        borderRadius: 4,
        hoverBorderWidth: 2,
        hoverBorderColor: '#fff',
        // Aggiungi percentuali per ogni barra
        percentages: values.map(value => ((value / total) * 100).toFixed(1))
      }]
    };
    
    const defaultOptions = {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: options.horizontal ? 'y' : 'x', // Supporto per barre orizzontali
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                size: 12
              }
            },
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              font: {
                size: 12
              },
              autoSkip: true,
              maxTicksLimit: 15
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: options.showLegend || false,
            position: 'top',
            labels: {
              font: { size: 12 },
              usePointStyle: true,
              boxWidth: 10
            }
          },
          title: {
            display: !!options.title,
            text: options.title || '',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            enabled: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              title: (tooltipItems) => {
                return tooltipItems[0].label || '';
              },
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || context.parsed.x || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
              afterLabel: (context) => {
                // Aggiungi informazioni aggiuntive nel tooltip
                const dataset = context.dataset;
                const total = dataset.data.reduce((a, b) => a + b, 0);
                return `Percentuale sul totale: ${((context.parsed.y / total) * 100).toFixed(1)}%`;
              }
            }
          },
          // Etichette con valori direttamente sulle barre (disabilitate di default)
          datalabels: false
        },
        // Migliora l'interattività
        hover: {
          mode: 'index',
          intersect: false
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
          delay: (context) => {
            // Aggiungi un leggero ritardo per creare un effetto a cascata
            return context.dataIndex * 50;
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
   * Genera una palette di colori armoniosa per il grafico
   * @param {number} count - Il numero di colori da generare
   * @returns {Array} - Array di colori in formato esadecimale o rgba
   */
  generateColorPalette(count) {
    // Colori base predefiniti
    const baseColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#43e97b', '#f9ea8f', '#f67019', '#a259f7', 
      '#e14eca', '#00c9a7', '#4d79ff', '#ff4d4d', '#ffcc00',
      '#00cc99', '#cc00cc', '#3399ff', '#ff9933', '#00ffcc'
    ];
    
    // Se abbiamo abbastanza colori base, usiamo quelli
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    
    // Altrimenti, generiamo colori aggiuntivi con variazioni di tonalità
    const palette = [...baseColors];
    
    // Numero di colori aggiuntivi da generare
    const additionalColors = count - baseColors.length;
    
    // Genera colori aggiuntivi con variazioni di tonalità
    for (let i = 0; i < additionalColors; i++) {
      // Usa un colore base come riferimento e varia la tonalità
      const baseIndex = i % baseColors.length;
      const baseColor = baseColors[baseIndex];
      
      // Converti il colore esadecimale in HSL
      const hsl = this.hexToHSL(baseColor);
      
      // Varia la tonalità
      hsl.h = (hsl.h + (360 / additionalColors) * i) % 360;
      
      // Converti di nuovo in esadecimale
      palette.push(this.hslToHex(hsl));
    }
    
    return palette;
  }
  
  /**
   * Converte un colore esadecimale in HSL
   * @param {string} hex - Il colore in formato esadecimale
   * @returns {Object} - Oggetto con proprietà h, s, l
   */
  hexToHSL(hex) {
    // Rimuovi il carattere # se presente
    hex = hex.replace(/^#/, '');
    
    // Converti in RGB
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Trova il minimo e il massimo dei valori RGB
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Calcola la luminosità
    let l = (max + min) / 2;
    
    // Calcola la saturazione
    let s = 0;
    if (max !== min) {
      s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    }
    
    // Calcola la tonalità
    let h = 0;
    if (max !== min) {
      if (max === r) {
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / (max - min) + 2;
      } else {
        h = (r - g) / (max - min) + 4;
      }
      h *= 60;
    }
    
    return { h, s, l };
  }
  
  /**
   * Converte un colore HSL in esadecimale
   * @param {Object} hsl - Oggetto con proprietà h, s, l
   * @returns {string} - Il colore in formato esadecimale
   */
  hslToHex(hsl) {
    const { h, s, l } = hsl;
    
    // Converti HSL in RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r, g, b;
    if (h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }
    
    // Converti RGB in esadecimale
    r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    b = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
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