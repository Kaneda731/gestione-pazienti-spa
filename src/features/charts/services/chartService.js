import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml.js';
// src/js/services/chartService.js

/**
 * Servizio per gestire il caricamento dinamico di Google Charts
 * e la creazione di grafici nell'applicazione
 * 
 * NOTA: Google Charts potrebbe mostrare un warning di deprecazione
 * "Intl.v8BreakIterator is deprecated. Please use Intl.Segmenter instead."
 * Questo è un warning interno di Google Charts, non del nostro codice,
 * e non influisce sul funzionamento dell'applicazione.
 */

let isGoogleChartsLoaded = false;
let googleChartsLoadPromise = null;

/**
 * Carica dinamicamente Google Charts se non è già caricato
 * @returns {Promise} Promise che si risolve quando Google Charts è pronto
 */
export function loadGoogleCharts() {
    // Se già caricato, restituisce Promise risolto
    if (isGoogleChartsLoaded) {
        return Promise.resolve();
    }

    // Se già in fase di caricamento, restituisce la stessa Promise
    if (googleChartsLoadPromise) {
        return googleChartsLoadPromise;
    }

    // Carica Google Charts dinamicamente
    googleChartsLoadPromise = new Promise((resolve, reject) => {
        try {
            // Verifica se Google Charts è già disponibile globalmente
            if (typeof google !== 'undefined' && google.charts) {
                isGoogleChartsLoaded = true;
                resolve();
                return;
            }

            // Crea e inserisce il tag script per Google Charts
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/charts/loader.js';
            script.onload = () => {
                // Carica i pacchetti necessari
                google.charts.load('current', { 'packages': ['corechart'] });
                google.charts.setOnLoadCallback(() => {
                    isGoogleChartsLoaded = true;
                    resolve();
                });
            };
            script.onerror = () => {
                reject(new Error('Impossibile caricare Google Charts'));
            };
            
            document.head.appendChild(script);
        } catch (error) {
            reject(error);
        }
    });

    return googleChartsLoadPromise;
}

/**
 * Crea un grafico a torta
 * @param {HTMLElement} container - Elemento DOM dove inserire il grafico
 * @param {Array} data - Dati per il grafico nel formato [['Label', 'Value'], ...]
 * @param {Object} options - Opzioni per il grafico
 * @returns {Promise} Promise che si risolve quando il grafico è creato
 */
export async function createPieChart(container, data, options = {}) {
    await loadGoogleCharts();
    
    const defaultOptions = {
        title: 'Grafico a Torta',
        pieHole: 0.4,
        legend: { position: 'labeled' },
        chartArea: { left: 10, top: 20, width: '90%', height: '85%' }
    };

    const chartOptions = { ...defaultOptions, ...options };
    const dataTable = google.visualization.arrayToDataTable(data);
    const chart = new google.visualization.PieChart(container);
    
    return new Promise((resolve, reject) => {
        try {
            chart.draw(dataTable, chartOptions);
            resolve(chart);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Verifica se Google Charts è disponibile
 * @returns {boolean} True se Google Charts è caricato e pronto
 */
export function isChartsReady() {
    return isGoogleChartsLoaded && typeof google !== 'undefined' && google.charts;
}

/**
 * Utility per mostrare un messaggio di caricamento nel container
 * @param {HTMLElement} container - Elemento DOM dove mostrare il loading
 */
export function showLoadingInContainer(container) {
    container.innerHTML = sanitizeHtml('<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary"></div></div>');
}

/**
 * Utility per mostrare un messaggio di errore nel container
 * @param {HTMLElement} container - Elemento DOM dove mostrare l'errore
 * @param {string} message - Messaggio di errore
 */
export function showErrorInContainer(container, message) {
    container.innerHTML = sanitizeHtml(`<div class="alert alert-danger"><strong>Errore:</strong> ${message}</div>`);
}

/**
 * Utility per mostrare un messaggio generico nel container
 * @param {HTMLElement} container - Elemento DOM dove mostrare il messaggio
 * @param {string} message - Messaggio da mostrare
 * @param {string} className - Classe CSS per il messaggio (default: text-muted)
 */
export function showMessageInContainer(container, message, className = 'text-muted') {
    container.innerHTML = sanitizeHtml(`<p class="${className} text-center mt-5">${message}</p>`);
}
