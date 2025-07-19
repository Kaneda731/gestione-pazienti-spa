/**
 * Utility per rilevare il tipo di dispositivo e le sue caratteristiche
 */
class DeviceDetector {
  /**
   * Inizializza il rilevatore di dispositivi
   * @param {Object} breakpoints - I breakpoint per i diversi dispositivi
   */
  constructor(breakpoints = {
    mobile: 767,
    tablet: 991,
    desktop: 1199
  }) {
    this.breakpoints = breakpoints;
    this.currentDevice = this.detectDevice();
    this.resizeListeners = [];
    this._setupResizeListener();
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
   * Verifica se il dispositivo corrente è mobile
   * @returns {boolean} - True se il dispositivo è mobile
   */
  isMobile() {
    return this.detectDevice() === 'mobile';
  }

  /**
   * Verifica se il dispositivo corrente è tablet
   * @returns {boolean} - True se il dispositivo è tablet
   */
  isTablet() {
    return this.detectDevice() === 'tablet';
  }

  /**
   * Verifica se il dispositivo corrente è desktop
   * @returns {boolean} - True se il dispositivo è desktop
   */
  isDesktop() {
    return this.detectDevice() === 'desktop';
  }

  /**
   * Verifica se il dispositivo supporta il touch
   * @returns {boolean} - True se il dispositivo supporta il touch
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Verifica se il dispositivo è in orientamento portrait
   * @returns {boolean} - True se il dispositivo è in orientamento portrait
   */
  isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  /**
   * Verifica se il dispositivo è in orientamento landscape
   * @returns {boolean} - True se il dispositivo è in orientamento landscape
   */
  isLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  /**
   * Aggiunge un listener per il cambio di dispositivo
   * @param {Function} callback - Funzione da chiamare quando cambia il dispositivo
   * @returns {Function} - Funzione per rimuovere il listener
   */
  onDeviceChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Il callback deve essere una funzione');
    }
    
    this.resizeListeners.push(callback);
    
    // Restituisce una funzione per rimuovere il listener
    return () => {
      this.resizeListeners = this.resizeListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Configura il listener per il ridimensionamento della finestra
   * @private
   */
  _setupResizeListener() {
    // Funzione di throttling per limitare la frequenza di esecuzione
    const throttle = (func, limit) => {
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
    };

    // Handler per il ridimensionamento con throttling
    const handleResize = throttle(() => {
      const previousDevice = this.currentDevice;
      this.currentDevice = this.detectDevice();
      
      // Notifica i listener solo se il tipo di dispositivo è cambiato
      if (previousDevice !== this.currentDevice) {
        this.resizeListeners.forEach(listener => {
          try {
            listener(this.currentDevice, previousDevice);
          } catch (error) {
            console.error('Errore durante l\'esecuzione del listener di resize:', error);
          }
        });
      }
    }, 250);

    // Aggiungi il listener per il ridimensionamento
    window.addEventListener('resize', handleResize);
    
    // Aggiungi anche un listener per il cambio di orientamento sui dispositivi mobili
    window.addEventListener('orientationchange', handleResize);
  }
}

export default DeviceDetector;