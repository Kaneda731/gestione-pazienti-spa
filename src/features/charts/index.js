/**
 * Punto di ingresso per il modulo dei grafici responsivi
 */

// Componente principale
import ResponsiveChartAdapter from './components/ResponsiveChartAdapter.js';

// Adapters
import ChartAdapterFactory from './adapters/ChartAdapterFactory.js';
import MobileChartAdapter from './adapters/MobileChartAdapter.js';
import TabletChartAdapter from './adapters/TabletChartAdapter.js';
import DesktopChartAdapter from './adapters/DesktopChartAdapter.js';

// Utility
import DeviceDetector from './utils/DeviceDetector.js';
import ChartUtils from './utils/ChartUtils.js';

// UI Components
import ChartModals from './ui/ChartModals.js';
import ChartToasts from './ui/ChartToasts.js';

// Esporta il componente principale come default
export default ResponsiveChartAdapter;

// Esporta tutti i componenti
export {
  // Componente principale
  ResponsiveChartAdapter,
  
  // Adapters
  ChartAdapterFactory,
  MobileChartAdapter,
  TabletChartAdapter,
  DesktopChartAdapter,
  
  // Utility
  DeviceDetector,
  ChartUtils,
  
  // UI Components
  ChartModals,
  ChartToasts
};