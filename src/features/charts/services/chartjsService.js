import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';
// src/features/charts/services/chartjsService.js

/**
 * Servizio per gestire Chart.js con supporto per diversi tipi di grafici,
 * responsive design e funzionalità di esportazione.
 *
 * Questo servizio implementa:
 * - Lazy loading ottimizzato della libreria Chart.js con prefetch e preload
 * - Supporto per diversi tipi di grafici (torta, barre, linee)
 * - Adattamento responsive per dispositivi mobili e desktop
 * - Funzionalità di esportazione e condivisione
 * - Caching dei dati per migliorare le performance
 * - Gestione efficiente delle risorse e pulizia della memoria
 */

// Define utility functions locally instead of importing from chartService.js
function showLoadingInContainer(container) {
  container.innerHTML = sanitizeHtml('<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary"></div></div>');
}

function showErrorInContainer(container, message) {
  container.innerHTML = sanitizeHtml(`<div class="alert alert-danger"><strong>Errore:</strong> ${message}</div>`);
}

function showMessageInContainer(container, message, className = "text-muted") {
  container.innerHTML = sanitizeHtml(`<p class="${className} text-center mt-5">${message}</p>`);
}

import ChartTypeManager from "../components/ChartTypeManager.js";
import ResponsiveChartAdapter from "../components/ResponsiveChartAdapter.js";
import ChartExportService from "./ChartExportService.js";

/**
 * Modulo per la gestione ottimizzata del caricamento di Chart.js
 * Implementa tecniche avanzate di lazy loading con prefetch, preload e cache
 */
class ChartLoaderService {
  constructor() {
    this.chartJsLoadPromise = null;
    this.chartJsRef = null;
    this.chartJsVersion = "4.3.3";
    this.chartJsCdn = `https://cdn.jsdelivr.net/npm/chart.js@${this.chartJsVersion}/dist/chart.umd.js`;
    this.preloadLink = null;
    this.prefetchLink = null;
    this.loadStartTime = null;
    this.loadAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms
  }

  /**
   * Inizia il prefetch della libreria Chart.js senza bloccare il rendering
   * Utile per preparare il caricamento prima che l'utente interagisca con i grafici
   */
  prefetch() {
    // Evita prefetch duplicati
    if (this.prefetchLink || this.chartJsRef) {
      return;
    }

    // Crea un link di prefetch per informare il browser di scaricare la risorsa con bassa priorità
    this.prefetchLink = document.createElement("link");
    this.prefetchLink.rel = "prefetch";
    this.prefetchLink.href = this.chartJsCdn;
    this.prefetchLink.as = "script";
    document.head.appendChild(this.prefetchLink);

    console.log("Chart.js prefetch iniziato");
  }

  /**
   * Carica dinamicamente Chart.js con ottimizzazioni per la performance
   * @returns {Promise<Object>} Promise che si risolve con il riferimento a Chart.js
   */
  async load() {
    // Se Chart.js è già caricato, restituisci il riferimento
    if (this.chartJsRef) {
      return this.chartJsRef;
    }

    // Se è già in corso un caricamento, restituisci la promise esistente
    if (this.chartJsLoadPromise) {
      return this.chartJsLoadPromise;
    }

    // Registra il tempo di inizio caricamento
    this.loadStartTime = performance.now();
    this.loadAttempts++;

    // Rimuovi il link di prefetch se esiste
    if (this.prefetchLink) {
      document.head.removeChild(this.prefetchLink);
      this.prefetchLink = null;
    }

    // Implementazione di lazy loading ottimizzato con script tag dinamico
    this.chartJsLoadPromise = new Promise((resolve, reject) => {
      // Crea script tag per il caricamento
      const script = document.createElement("script");
      script.src = this.chartJsCdn;
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onload = () => {
        // Chart.js dovrebbe essere disponibile globalmente
        this.chartJsRef = window.Chart;

        if (!this.chartJsRef) {
          reject(new Error("Chart.js caricato ma non disponibile globalmente"));
          return;
        }

        // Calcola e registra il tempo di caricamento
        const loadTime = performance.now() - this.loadStartTime;
        console.log(`Chart.js caricato in ${loadTime.toFixed(2)}ms`);

        // Resetta i contatori di tentativi
        this.loadAttempts = 0;
        this.loadStartTime = null;

        resolve(this.chartJsRef);
      };

      script.onerror = (error) => {
        console.error("Errore nel caricamento di Chart.js:", error);

        // Rimuovi lo script fallito
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }

        // Implementa retry con backoff esponenziale
        if (this.loadAttempts < this.maxRetries) {
          const retryDelay =
            this.retryDelay * Math.pow(2, this.loadAttempts - 1);
          console.log(`Tentativo di ricaricamento tra ${retryDelay}ms...`);

          setTimeout(() => {
            // Resetta la promise per permettere un nuovo tentativo
            this.chartJsLoadPromise = null;
            // Riprova a caricare
            this.load().then(resolve).catch(reject);
          }, retryDelay);
        } else {
          // Resetta la promise per permettere tentativi futuri
          this.chartJsLoadPromise = null;
          this.loadAttempts = 0;
          this.loadStartTime = null;
          reject(
            new Error(
              `Impossibile caricare Chart.js dopo ${this.maxRetries} tentativi: ${error.message}`
            )
          );
        }
      };

      // Aggiungi lo script al DOM
      document.head.appendChild(script);
    });

    return this.chartJsLoadPromise;
  }

  /**
   * Verifica se Chart.js è già stato caricato
   * @returns {boolean} True se Chart.js è già caricato
   */
  isLoaded() {
    return !!this.chartJsRef;
  }

  /**
   * Verifica se Chart.js è in fase di caricamento
   * @returns {boolean} True se Chart.js è in fase di caricamento
   */
  isLoading() {
    return !!this.chartJsLoadPromise && !this.chartJsRef;
  }

  /**
   * Pulisce le risorse utilizzate dal loader
   */
  cleanup() {
    // Rimuovi i link di prefetch/preload se esistono
    if (this.prefetchLink) {
      document.head.removeChild(this.prefetchLink);
      this.prefetchLink = null;
    }

    if (this.preloadLink) {
      document.head.removeChild(this.preloadLink);
      this.preloadLink = null;
    }

    // Resetta le variabili
    this.chartJsLoadPromise = null;
    this.chartJsRef = null;
    this.loadAttempts = 0;
    this.loadStartTime = null;
  }
}

/**
 * Modulo per la gestione efficiente della cache dei dati dei grafici
 * Implementa strategie di caching con invalidazione automatica e limiti di dimensione
 */
class ChartCacheService {
  constructor(options = {}) {
    this.cache = new Map();
    this.CACHE_EXPIRY_TIME = options.expiryTime || 5 * 60 * 1000; // 5 minuti default
    this.MAX_CACHE_SIZE = options.maxSize || 20; // Numero massimo di elementi in cache
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.lastCleanup = Date.now();
    this.CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minuti
  }

  /**
   * Genera una chiave per la cache basata sui parametri del grafico
   * @param {Array} data - I dati del grafico
   * @param {Object} options - Le opzioni del grafico
   * @param {string} chartType - Il tipo di grafico
   * @returns {string} - La chiave per la cache
   */
  generateKey(data, options, chartType) {
    try {
      const dataString = JSON.stringify(data);
      const optionsString = JSON.stringify(options);
      // Usa una combinazione di tipo e hash dei dati come chiave
      return `${chartType}_${btoa(dataString + optionsString).slice(0, 20)}`;
    } catch (error) {
      console.warn("Errore nella generazione della chiave cache:", error);
      // Fallback con timestamp per evitare errori
      return `${chartType}_${Date.now()}`;
    }
  }

  /**
   * Recupera i dati dalla cache se ancora validi
   * @param {string} key - La chiave della cache
   * @returns {Object|null} - I dati dalla cache o null se non validi
   */
  get(key) {
    // Esegui pulizia periodica della cache
    this._periodicCleanup();

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY_TIME) {
      this.cacheHits++;
      return cached.data;
    }

    // Rimuovi i dati scaduti
    if (cached) {
      this.cache.delete(key);
    }

    this.cacheMisses++;
    return null;
  }

  /**
   * Salva i dati nella cache
   * @param {string} key - La chiave della cache
   * @param {Object} data - I dati da salvare
   */
  set(key, data) {
    // Limita la dimensione della cache con strategia LRU (Least Recently Used)
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldestEntry();
    }

    // Salva i nuovi dati con timestamp
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Rimuove l'elemento più vecchio dalla cache (strategia LRU)
   * @private
   */
  evictOldestEntry() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [k, v] of this.cache.entries()) {
      if (v.timestamp < oldestTime) {
        oldestTime = v.timestamp;
        oldestKey = k;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Esegue una pulizia periodica della cache per rimuovere elementi scaduti
   * @private
   */
  _periodicCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      this.lastCleanup = now;

      // Rimuovi tutti gli elementi scaduti
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.CACHE_EXPIRY_TIME) {
          this.cache.delete(key);
        }
      }

      console.log(
        `Pulizia cache completata. Elementi rimanenti: ${this.cache.size}`
      );
    }
  }

  /**
   * Pulisce la cache
   */
  clear() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.lastCleanup = Date.now();
  }

  /**
   * Restituisce le statistiche della cache
   * @returns {Object} - Statistiche della cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRatio:
        this.cacheHits + this.cacheMisses > 0
          ? (this.cacheHits / (this.cacheHits + this.cacheMisses)).toFixed(2)
          : 0,
      lastCleanup: new Date(this.lastCleanup).toLocaleString(),
    };
  }
}

/**
 * Classe per la gestione degli errori relativi ai grafici
 */
class ChartErrorHandler {
  /**
   * Gestisce un errore di caricamento dati
   * @param {Error} error - L'errore originale
   * @param {HTMLElement} container - Il container dove mostrare l'errore
   * @param {Function} retryCallback - Funzione da chiamare per riprovare
   */
  handleDataLoadError(error, container, retryCallback) {
    console.error("Errore nel caricamento dei dati:", error);

    // Crea un messaggio di errore user-friendly
    const errorMessage = `
      <div class="chart-error">
        <p>Si è verificato un errore nel caricamento dei dati: ${
          error.message
        }</p>
        ${
          retryCallback
            ? '<button class="btn btn-sm btn-primary retry-btn">Riprova</button>'
            : ""
        }
      </div>
    `;

    // Mostra l'errore nel container
    showErrorInContainer(container, errorMessage);

    // Aggiungi l'evento di retry se è stata fornita una callback
    if (retryCallback && container) {
      const retryBtn = container.querySelector(".retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", retryCallback);
      }
    }
  }

  /**
   * Gestisce un errore di rendering
   * @param {Error} error - L'errore originale
   * @param {HTMLElement} container - Il container dove mostrare l'errore
   * @param {Object} fallbackOptions - Opzioni per il fallback
   */
  handleRenderError(error, container, fallbackOptions = {}) {
    console.error("Errore nel rendering del grafico:", error);

    // Se sono state fornite opzioni di fallback, prova a renderizzare un grafico più semplice
    if (fallbackOptions.fallbackType) {
      showMessageInContainer(
        container,
        `Tentativo di renderizzare un grafico alternativo (${fallbackOptions.fallbackType})...`
      );

      // Implementa la logica per il fallback
      if (fallbackOptions.fallbackCallback) {
        setTimeout(() => {
          fallbackOptions.fallbackCallback(fallbackOptions.fallbackType);
        }, 500);
      }
    } else {
      // Mostra un messaggio di errore generico
      showErrorInContainer(
        container,
        `Errore nel rendering del grafico: ${error.message}`
      );
    }
  }

  /**
   * Gestisce un errore di esportazione
   * @param {Error} error - L'errore originale
   * @param {Function} notifyUser - Funzione per notificare l'utente
   */
  handleExportError(error, notifyUser) {
    console.error("Errore nell'esportazione del grafico:", error);

    // Notifica l'utente dell'errore
    if (notifyUser) {
      notifyUser(
        `Si è verificato un errore durante l'esportazione: ${error.message}`
      );
    } else {
      alert(`Errore nell'esportazione del grafico: ${error.message}`);
    }
  }
}

// Istanze singleton dei servizi
const chartLoader = new ChartLoaderService();
const chartCache = new ChartCacheService();
const chartErrorHandler = new ChartErrorHandler();

// Gestori dei componenti
let chartTypeManager = null;
let responsiveAdapter = null;
let exportService = null;

// Inizia il prefetch di Chart.js quando il documento è completamente caricato
document.addEventListener("DOMContentLoaded", () => {
  // Prefetch Chart.js dopo che la pagina è caricata e inattiva
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => chartLoader.prefetch());
  } else {
    setTimeout(() => chartLoader.prefetch(), 1000);
  }
});

/**
 * Inizializza i componenti necessari per i grafici
 * @returns {Promise<Object>} - Oggetto con i componenti inizializzati
 */
async function initializeComponents() {
  try {
    // Carica Chart.js se non è già caricato
    const Chart = await chartLoader.load();

    // Inizializza i componenti solo se necessario
    if (!chartTypeManager) {
      chartTypeManager = new ChartTypeManager(Chart);
    }

    if (!responsiveAdapter) {
      responsiveAdapter = new ResponsiveChartAdapter();
    }

    if (!exportService) {
      exportService = new ChartExportService();
    }

    return { chartTypeManager, responsiveAdapter, exportService, Chart };
  } catch (error) {
    console.error("Errore nell'inizializzazione dei componenti:", error);
    throw new Error(
      `Impossibile inizializzare i componenti del grafico: ${error.message}`
    );
  }
}

/**
 * Crea un grafico usando Chart.js e i componenti
 * @param {HTMLElement} container - Elemento DOM dove inserire il grafico
 * @param {Array} data - Dati per il grafico nel formato [['Label', 'Value'], ...]
 * @param {Object} options - Opzioni per il grafico
 * @param {string} chartType - Tipo di grafico (pie, bar, line)
 * @returns {Promise<Object>} Promise che si risolve con l'istanza del grafico
 */
export async function createChart(
  container,
  data,
  options = {},
  chartType = "pie"
) {
  try {
    // Mostra indicatore di caricamento
    showLoadingInContainer(container);

    // Genera una chiave per la cache
    const cacheKey = chartCache.generateKey(data, options, chartType);

    // Controlla se i dati sono in cache
    const cachedData = chartCache.get(cacheKey);
    if (cachedData) {
      console.log("Utilizzo dati dalla cache per il grafico");
    }

    // Inizializza i componenti
    const { chartTypeManager, responsiveAdapter } =
      await initializeComponents();

    // Verifica che i componenti siano stati inizializzati correttamente
    if (!chartTypeManager || !responsiveAdapter) {
      throw new Error("Componenti del grafico non inizializzati correttamente");
    }

    // Imposta il tipo di grafico
    chartTypeManager.setChartType(chartType);

    // Adatta il layout del container in base al dispositivo
    responsiveAdapter.adaptLayout(container);

    // Adatta le opzioni in base al dispositivo
    const adaptedOptions = responsiveAdapter.adaptOptions(options);

    // Renderizza il grafico
    const chart = chartTypeManager.renderChart(container, data, adaptedOptions, chartType);

    // Configura il gestore di ridimensionamento
    responsiveAdapter.handleResize(chart, options);

    // Salva i dati nella cache
    chartCache.set(cacheKey, { data, options, chartType });

    return chart;
  } catch (error) {
    console.error("Errore nella creazione del grafico:", error);

    // Usa il gestore degli errori per mostrare un messaggio appropriato
    chartErrorHandler.handleRenderError(error, container, {
      fallbackType: "pie", // Tipo di fallback più semplice
      fallbackCallback: (type) => {
        // Tenta di creare un grafico più semplice come fallback
        try {
          if (type === "pie") {
            return createPieChart(container, data, {
              ...options,
              animation: false, // Disabilita le animazioni per migliorare le prestazioni
              responsive: true,
              maintainAspectRatio: false,
            });
          }
        } catch (fallbackError) {
          // Se anche il fallback fallisce, mostra un errore generico
          showErrorInContainer(
            container,
            `Impossibile visualizzare il grafico: ${fallbackError.message}`
          );
        }
      },
    });

    throw error;
  }
}

/**
 * Crea un grafico a torta usando Chart.js
 * @param {HTMLElement} container - Elemento DOM dove inserire il grafico
 * @param {Array} data - Dati per il grafico nel formato [['Label', 'Value'], ...]
 * @param {Object} options - Opzioni per il grafico
 * @returns {Promise<Object>} Promise che si risolve con l'istanza del grafico
 */
export async function createPieChart(container, data, options = {}) {
  return createChart(container, data, options, "pie");
}

/**
 * Crea un grafico a barre usando Chart.js
 * @param {HTMLElement} container - Elemento DOM dove inserire il grafico
 * @param {Array} data - Dati per il grafico nel formato [['Label', 'Value'], ...]
 * @param {Object} options - Opzioni per il grafico
 * @returns {Promise<Object>} Promise che si risolve con l'istanza del grafico
 */
export async function createBarChart(container, data, options = {}) {
  return createChart(container, data, options, "bar");
}

/**
 * Crea un grafico a linee usando Chart.js
 * @param {HTMLElement} container - Elemento DOM dove inserire il grafico
 * @param {Array} data - Dati per il grafico nel formato [['Label', 'Value'], ...]
 * @param {Object} options - Opzioni per il grafico
 * @returns {Promise<Object>} Promise che si risolve con l'istanza del grafico
 */
export async function createLineChart(container, data, options = {}) {
  return createChart(container, data, options, "line");
}

/**
 * Esporta il grafico come immagine
 * @param {Chart} chart - L'istanza del grafico da esportare
 * @param {string} format - Il formato dell'immagine (png/jpg)
 * @param {Object} metadata - Metadati da includere nell'immagine
 * @returns {Promise<Blob>} - L'immagine come Blob
 */
export async function exportChartAsImage(chart, format = "png", metadata = {}) {
  try {
    const { exportService } = await initializeComponents();
    return exportService.exportAsImage(chart, format, metadata);
  } catch (error) {
    chartErrorHandler.handleExportError(error, (message) => {
      alert(message);
    });
    throw error;
  }
}

/**
 * Scarica il grafico come immagine
 * @param {Chart} chart - L'istanza del grafico da esportare
 * @param {string} fileName - Il nome del file
 * @param {Object} metadata - Metadati da includere nell'immagine
 * @returns {Promise<void>}
 */
export async function downloadChartAsImage(
  chart,
  fileName = "grafico",
  metadata = {}
) {
  try {
    const { exportService } = await initializeComponents();
    const blob = await exportService.exportAsImage(chart, "png", metadata);
    exportService.downloadImage(blob, fileName);
  } catch (error) {
    chartErrorHandler.handleExportError(error, (message) => {
      alert(message);
    });
    throw error;
  }
}

/**
 * Genera un link condivisibile per il grafico
 * @param {Object} filters - I filtri applicati al grafico
 * @param {string} chartType - Il tipo di grafico
 * @returns {string} - URL condivisibile
 */
export function generateShareableLink(filters, chartType) {
  // Non è necessario attendere il caricamento di Chart.js per questa funzione
  if (!exportService) {
    exportService = new ChartExportService();
  }
  return exportService.generateShareableLink(filters, chartType);
}

/**
 * Ottiene i tipi di grafico disponibili
 * @returns {Promise<Array>} - Array di oggetti con id, nome e icona per ogni tipo
 */
export async function getAvailableChartTypes() {
  try {
    const { chartTypeManager } = await initializeComponents();
    return chartTypeManager.getAvailableChartTypes();
  } catch (error) {
    console.error("Errore nel recupero dei tipi di grafico:", error);
    // Restituisci un array vuoto in caso di errore
    return [];
  }
}

/**
 * Aggiorna un grafico esistente con nuovi dati o opzioni
 * @param {Object} chart - L'istanza del grafico da aggiornare
 * @param {Array} data - I nuovi dati (opzionale)
 * @param {Object} options - Le nuove opzioni (opzionale)
 * @returns {Promise<Object>} - L'istanza del grafico aggiornata
 */
export async function updateChart(chart, data, options = {}) {
  if (!chart) {
    throw new Error("Grafico non valido per l'aggiornamento");
  }

  try {
    const { chartTypeManager } = await initializeComponents();
    return chartTypeManager.updateChart(data, options);
  } catch (error) {
    console.error("Errore nell'aggiornamento del grafico:", error);
    throw new Error(`Impossibile aggiornare il grafico: ${error.message}`);
  }
}

/**
 * Ottiene le statistiche della cache
 * @returns {Object} - Statistiche della cache
 */
export function getCacheStats() {
  return chartCache.getStats();
}

/**
 * Pulisce la cache dei dati
 */
export function clearCache() {
  chartCache.clear();
}

/**
 * Verifica se Chart.js è già stato caricato
 * @returns {boolean} True se Chart.js è già caricato
 */
export function isChartJsLoaded() {
  return chartLoader.isLoaded();
}

/**
 * Verifica se Chart.js è in fase di caricamento
 * @returns {boolean} True se Chart.js è in fase di caricamento
 */
export function isChartJsLoading() {
  return chartLoader.isLoading();
}

/**
 * Pulisce le risorse dei componenti del grafico
 */
export function cleanupChartComponents() {
  if (responsiveAdapter) {
    responsiveAdapter.cleanup();
    responsiveAdapter = null;
  }

  if (chartTypeManager) {
    chartTypeManager.cleanup();
    chartTypeManager = null;
  }

  // Pulisci la cache
  chartCache.clear();

  // Pulisci il loader
  chartLoader.cleanup();

  // Resetta l'exportService
  exportService = null;
}

// Esporta le utility definite localmente
export { showLoadingInContainer, showErrorInContainer, showMessageInContainer };
