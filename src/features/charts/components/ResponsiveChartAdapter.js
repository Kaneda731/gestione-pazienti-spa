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
          usePointStyle: true
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          ...adaptedOptions.plugins?.tooltip?.callbacks,
          title: function(context) {
            return context[0].label || '';
          },
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed || context.raw;
            return `${label}: ${value}`;
          }
        }
      };
      
      // Interazioni ottimizzate per touch
      adaptedOptions.interaction = {
        mode: 'nearest',
        intersect: false,
        includeInvisible: false
      };
      
      adaptedOptions.maintainAspectRatio = false;
      adaptedOptions.responsive = true;
      adaptedOptions.devicePixelRatio = window.devicePixelRatio || 1;
      
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
      
      // Tooltip per tablet
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
        displayColors: true
      };
      
      // Interazioni avanzate per desktop (hover, click)
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
   * Pulisce gli event listener quando il componente viene distrutto
   */
  cleanup() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }
}

export default ResponsiveChartAdapter;