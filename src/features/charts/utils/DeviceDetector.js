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
    try {
      // Verifica che window sia disponibile
      if (typeof window === 'undefined') {
        console.warn('Window non disponibile, impossibile rilevare il dispositivo');
        return 'desktop'; // Fallback a desktop
      }
      
      // Ottieni le dimensioni della finestra in modo sicuro
      const width = window.innerWidth || document.documentElement.clientWidth || 1024;
      const height = window.innerHeight || document.documentElement.clientHeight || 768;
      
      // Verifica che i breakpoints siano definiti correttamente
      const mobileBreakpoint = this.breakpoints && typeof this.breakpoints.mobile === 'number' ? 
        this.breakpoints.mobile : 767;
      const tabletBreakpoint = this.breakpoints && typeof this.breakpoints.tablet === 'number' ? 
        this.breakpoints.tablet : 991;
      
      // Considera anche l'orientamento e le caratteristiche del dispositivo
      let isTouchDevice = false;
      try {
        isTouchDevice = 'ontouchstart' in window || (window.navigator && navigator.maxTouchPoints > 0);
      } catch (e) {
        console.warn('Errore nel rilevamento touch:', e);
      }
      
      const isPortrait = height > width;
      
      if (width <= mobileBreakpoint) {
        return 'mobile';
      } else if (width <= tabletBreakpoint) {
        // Se è un dispositivo touch in modalità landscape, trattalo come mobile
        if (isTouchDevice && !isPortrait && width <= 1024) {
          return 'mobile';
        }
        return 'tablet';
      }
      
      return 'desktop';
    } catch (error) {
      console.error('Errore durante il rilevamento del dispositivo:', error);
      return 'desktop'; // Fallback a desktop in caso di errore
    }
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
    // Verifica che window sia disponibile (per evitare errori in ambienti SSR)
    if (
      typeof window === 'undefined' ||
      window == null ||
      typeof window.addEventListener !== 'function' ||
      window.addEventListener == null
    ) {
      console.warn('Window/addEventListener non disponibile, impossibile configurare i listener di resize');
      return;
    }
    
    // Funzione di throttling per limitare la frequenza di esecuzione
    const throttle = (func, limit) => {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          try {
            func.apply(context, args);
          } catch (error) {
            console.error('Errore nella funzione throttled:', error);
          }
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };

    // Handler per il ridimensionamento con throttling
    const handleResize = throttle(() => {
      try {
        const previousDevice = this.currentDevice;
        this.currentDevice = this.detectDevice();
        
        // Notifica i listener solo se il tipo di dispositivo è cambiato
        if (previousDevice !== this.currentDevice && Array.isArray(this.resizeListeners)) {
          this.resizeListeners.forEach(listener => {
            if (typeof listener === 'function') {
              try {
                listener(this.currentDevice, previousDevice);
              } catch (error) {
                console.error('Errore durante l\'esecuzione del listener di resize:', error);
              }
            }
          });
        }
      } catch (error) {
        console.error('Errore durante la gestione del resize:', error);
      }
    }, 250);

    try {
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
    } catch (error) {
      console.error('Errore durante l\'aggiunta dei listener di resize:', error);
    }
  }
}

export default DeviceDetector;