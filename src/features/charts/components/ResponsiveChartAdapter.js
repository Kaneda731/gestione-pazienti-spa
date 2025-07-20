/**
 * Adatta i grafici a diverse dimensioni dello schermo
 */
import ChartAdapterFactory from '../adapters/ChartAdapterFactory.js';
import ChartUtils from '../utils/ChartUtils.js';

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
    // Inizializza la factory degli adapter
    this.adapterFactory = new ChartAdapterFactory(breakpoints);
    
    // Ottieni l'adapter appropriato per il dispositivo corrente
    this.currentAdapter = this.adapterFactory.createAdapter();
    
    // Memorizza il tipo di dispositivo corrente
    this.currentDevice = this.adapterFactory.getCurrentDeviceType();
    
    // Handler per il ridimensionamento
    this.resizeHandler = null;
  }



  /**
   * Adatta le opzioni del grafico al dispositivo corrente
   * @param {Object} options - Le opzioni originali del grafico
   * @returns {Object} - Le opzioni adattate
   */
  adaptOptions(options) {
    // Utilizza l'adapter corrente per adattare le opzioni
    return this.currentAdapter.adaptOptions(options);
  }

  /**
   * Adatta il layout del grafico al dispositivo corrente
   * @param {HTMLElement} container - Il container del grafico
   */
  adaptLayout(container) {
    // Utilizza l'adapter corrente per adattare il layout
    this.currentAdapter.adaptLayout(container);
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
    this.resizeHandler = ChartUtils.throttle(() => {
      const newDevice = this.adapterFactory.getCurrentDeviceType();
      
      // Aggiorna solo se il tipo di dispositivo è cambiato
      if (newDevice !== this.currentDevice) {
        this.currentDevice = newDevice;
        
        // Ottieni il nuovo adapter
        this.currentAdapter = this.adapterFactory.getAdapterForDevice(this.currentDevice);
        
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
    
    // Registra anche un listener per il cambio di dispositivo
    this.adapterFactory.onDeviceChange((newDevice) => {
      // Ottieni il nuovo adapter
      this.currentAdapter = this.adapterFactory.getAdapterForDevice(newDevice);
      
      // Adatta il container
      if (chart.canvas && chart.canvas.parentNode) {
        this.adaptLayout(chart.canvas.parentNode);
      }
      
      // Aggiorna le opzioni del grafico
      const adaptedOptions = this.adaptOptions(options);
      chart.options = { ...chart.options, ...adaptedOptions };
      chart.update();
    });
  }

  /**
   * Mostra un modal con dettagli per dispositivi mobile
   * @param {Object} data - I dati da mostrare nel modal
   */
  showMobileDetailModal(data) {
    if (this.currentAdapter && this.currentAdapter.modals) {
      this.currentAdapter.modals.showMobileDetailModal(data);
    } else {
      console.warn('Modal non disponibile: currentAdapter o modals non inizializzato');
    }
  }

  /**
   * Mostra un pannello dettagli per desktop
   * @param {Object} data - I dati da mostrare nel pannello
   */
  showDesktopDetailPanel(data) {
    if (this.currentAdapter && this.currentAdapter.modals) {
      this.currentAdapter.modals.showDesktopDetailPanel(data);
    } else {
      console.warn('Panel non disponibile: currentAdapter o modals non inizializzato');
    }
  }

  /**
   * Mostra una notifica all'utente
   * @param {string} message - Il messaggio da mostrare
   * @param {string} type - Il tipo di notifica ('success', 'error', 'info', 'warning')
   */
  showNotification(message, type = 'info') {
    if (this.currentAdapter) {
      this.currentAdapter.showNotification(message, type);
    } else {
      console.warn('Notifica non disponibile: currentAdapter non inizializzato');
    }
  }

  /**
   * Ottiene il tipo di dispositivo corrente
   * @returns {string} - Il tipo di dispositivo ('mobile', 'tablet', 'desktop')
   */
  getCurrentDevice() {
    return this.currentDevice;
  }

  /**
   * Verifica se il dispositivo corrente è mobile
   * @returns {boolean} - True se il dispositivo è mobile
   */
  isMobile() {
    return this.adapterFactory.isMobile();
  }

  /**
   * Verifica se il dispositivo corrente è tablet
   * @returns {boolean} - True se il dispositivo è tablet
   */
  isTablet() {
    return this.adapterFactory.isTablet();
  }

  /**
   * Verifica se il dispositivo corrente è desktop
   * @returns {boolean} - True se il dispositivo è desktop
   */
  isDesktop() {
    return this.adapterFactory.isDesktop();
  }

  /**
   * Rileva il tipo di dispositivo corrente
   * @returns {string} - Il tipo di dispositivo ('mobile', 'tablet', 'desktop')
   */
  detectDevice() {
    return this.adapterFactory.getCurrentDeviceType();
  }

  /**
   * Implementa il layout responsive per dispositivi mobili
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico (opzionale)
   * @deprecated Utilizzare adaptLayout() invece
   */
  implementMobileResponsiveLayout(container, chart) {
    console.warn('implementMobileResponsiveLayout è deprecato. Utilizzare adaptLayout() invece.');
    if (this.adapterFactory.isMobile()) {
      this.adaptLayout(container);
    }
  }

  /**
   * Implementa il layout responsive per dispositivi desktop
   * @param {HTMLElement} container - Il container del grafico
   * @param {Chart} chart - L'istanza del grafico (opzionale)
   * @deprecated Utilizzare adaptLayout() invece
   */
  implementDesktopResponsiveLayout(container, chart) {
    console.warn('implementDesktopResponsiveLayout è deprecato. Utilizzare adaptLayout() invece.');
    if (this.adapterFactory.isDesktop()) {
      this.adaptLayout(container);
    }
  }

  /**
   * Pulisce le risorse utilizzate dall'adapter
   * @deprecated Non più necessario nella nuova implementazione
   */
  cleanup() {
    console.warn('cleanup è deprecato. Le risorse vengono gestite automaticamente.');
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }
}

export default ResponsiveChartAdapter;