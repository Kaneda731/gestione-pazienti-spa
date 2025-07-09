// src/js/services/chartjsService.js

/**
 * Servizio alternativo per gestire Chart.js invece di Google Charts
 * Chart.js è più moderno e non ha i warning di deprecazione
 */

let isChartJsLoaded = false;
let chartJsLoadPromise = null;

/**
 * Carica dinamicamente Chart.js se non è già caricato
 * @returns {Promise} Promise che si risolve quando Chart.js è pronto
 */
async function loadChartJs() {
    if (isChartJsLoaded) {
        return Promise.resolve();
    }

    if (chartJsLoadPromise) {
        return chartJsLoadPromise;
    }

    chartJsLoadPromise = import('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js').then(() => {
        isChartJsLoaded = true;
        return window.Chart;
    });

    return chartJsLoadPromise;
}

/**
 * Crea un grafico a torta usando Chart.js
 * @param {HTMLElement} container - Elemento DOM dove inserire il grafico
 * @param {Array} data - Dati per il grafico nel formato [['Label', 'Value'], ...]
 * @param {Object} options - Opzioni per il grafico
 * @returns {Promise} Promise che si risolve quando il grafico è creato
 */
export async function createPieChart(container, data, options = {}) {
    const Chart = await loadChartJs();
    
    // Crea canvas per Chart.js
    container.innerHTML = '<canvas id="chartCanvas"></canvas>';
    const canvas = container.querySelector('#chartCanvas');
    const ctx = canvas.getContext('2d');

    // Converte i dati dal formato Google Charts al formato Chart.js
    const [, ...dataRows] = data; // Rimuove la riga header
    const labels = dataRows.map(row => row[0]);
    const values = dataRows.map(row => row[1]);

    const chartConfig = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: options.title || 'Grafico a Torta'
                },
                legend: {
                    position: 'right'
                }
            }
        }
    };

    return new Chart(ctx, chartConfig);
}

export { loadChartJs, showLoadingInContainer, showErrorInContainer, showMessageInContainer } from './chartService.js';
