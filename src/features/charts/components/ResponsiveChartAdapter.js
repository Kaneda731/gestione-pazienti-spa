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
    if (width <= this.breakpoints.mobile) return 'mobile';
    if (width <= this.breakpoints.tablet) return 'tablet';
    return 'desktop';
  }
  
  /**
   * Adatta le opzioni del grafico al dispositivo corrente
   * @param {Object} options - Le opzioni originali del grafico
   * @returns {Object} - Le opzioni adattate
   */
  adaptOptions(options) {
    const device = this.detectDevice();
    const adaptedOptions = { ...options };
    
    // Adatta le opzioni in base al dispositivo
    if (device === 'mobile') {
      // Configurazioni specifiche per mobile
      adaptedOptions.plugins = adaptedOptions.plugins || {};
      adaptedOptions.plugins.legend = {
        position: 'bottom',
        align: 'center',
        labels: {
          boxWidth: 15,
          font: { size: 12 }
        }
      };
      adaptedOptions.plugins.title = {
        ...adaptedOptions.plugins?.title,
        font: { size: 16, weight: 'bold' }
      };
      adaptedOptions.maintainAspectRatio = false;
      adaptedOptions.responsive = true;
    } else if (device === 'tablet') {
      // Configurazioni specifiche per tablet
      adaptedOptions.plugins = adaptedOptions.plugins || {};
      adaptedOptions.plugins.legend = {
        position: 'bottom',
        align: 'center',
        labels: {
          boxWidth: 18,
          font: { size: 14 }
        }
      };
      adaptedOptions.plugins.title = {
        ...adaptedOptions.plugins?.title,
        font: { size: 18, weight: 'bold' }
      };
    } else {
      // Configurazioni specifiche per desktop
      adaptedOptions.plugins = adaptedOptions.plugins || {};
      adaptedOptions.plugins.legend = {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 20,
          font: { size: 14 }
        }
      };
      adaptedOptions.plugins.title = {
        ...adaptedOptions.plugins?.title,
        font: { size: 20, weight: 'bold' }
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