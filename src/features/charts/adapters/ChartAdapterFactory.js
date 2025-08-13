/**
 * Factory per la creazione di adapter specifici per dispositivo
 */
import DeviceDetector from '../utils/DeviceDetector.js';
import MobileChartAdapter from './MobileChartAdapter.js';
import TabletChartAdapter from './TabletChartAdapter.js';
import DesktopChartAdapter from './DesktopChartAdapter.js';

class ChartAdapterFactory {
  /**
   * Inizializza la factory
   * @param {Object} breakpoints - I breakpoint per i diversi dispositivi
   */
  constructor(breakpoints = {
    mobile: 767,
    tablet: 991,
    desktop: 1200
  }) {
    this.deviceDetector = new DeviceDetector(breakpoints);
    this.adapters = {
      mobile: null,
      tablet: null,
      desktop: null
    };
  }

  /**
   * Crea un adapter specifico per il dispositivo corrente
   * @returns {Object} - L'adapter appropriato per il dispositivo
   */
  createAdapter() {
    const deviceType = this.deviceDetector.detectDevice();
    return this.getAdapterForDevice(deviceType);
  }

  /**
   * Ottiene un adapter per un tipo specifico di dispositivo
   * @param {string} deviceType - Il tipo di dispositivo ('mobile', 'tablet', 'desktop')
   * @returns {Object} - L'adapter appropriato per il dispositivo
   */
  getAdapterForDevice(deviceType) {
    // Se l'adapter è già stato creato, restituiscilo
    if (this.adapters[deviceType]) {
      return this.adapters[deviceType];
    }
    
    // Altrimenti crea un nuovo adapter
    switch (deviceType) {
      case 'mobile':
        this.adapters.mobile = new MobileChartAdapter();
        return this.adapters.mobile;
      case 'tablet':
        this.adapters.tablet = new TabletChartAdapter();
        return this.adapters.tablet;
      case 'desktop':
      default:
        this.adapters.desktop = new DesktopChartAdapter();
        return this.adapters.desktop;
    }
  }

  /**
   * Registra un callback per il cambio di dispositivo
   * @param {Function} callback - Funzione da chiamare quando cambia il dispositivo
   * @returns {Function} - Funzione per rimuovere il listener
   */
  onDeviceChange(callback) {
    return this.deviceDetector.onDeviceChange(callback);
  }

  /**
   * Ottiene il tipo di dispositivo corrente
   * @returns {string} - Il tipo di dispositivo ('mobile', 'tablet', 'desktop')
   */
  getCurrentDeviceType() {
    return this.deviceDetector.detectDevice();
  }

  /**
   * Verifica se il dispositivo corrente è mobile
   * @returns {boolean} - True se il dispositivo è mobile
   */
  isMobile() {
    return this.deviceDetector.isMobile();
  }

  /**
   * Verifica se il dispositivo corrente è tablet
   * @returns {boolean} - True se il dispositivo è tablet
   */
  isTablet() {
    return this.deviceDetector.isTablet();
  }

  /**
   * Verifica se il dispositivo corrente è desktop
   * @returns {boolean} - True se il dispositivo è desktop
   */
  isDesktop() {
    return this.deviceDetector.isDesktop();
  }
}

export default ChartAdapterFactory;