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
let ChartJsRef = null;
async function loadChartJs() {
    if (ChartJsRef) {
        return ChartJsRef;
    }
    if (chartJsLoadPromise) {
        return chartJsLoadPromise;
    }
    chartJsLoadPromise = import('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js').then(() => {
        ChartJsRef = window.Chart;
        return ChartJsRef;
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
    container.innerHTML = '<canvas id="chartCanvas" style="width:100%!important;height:100%!important;display:block;background:linear-gradient(135deg,#e3eef7 0%,#c8d8e8 100%) !important;"></canvas>';
    const canvas = container.querySelector('#chartCanvas');
    
    if (!canvas) {
        throw new Error('Impossibile creare il canvas per il grafico');
    }
    
    canvas.width = container.offsetWidth || 400;
    canvas.height = container.offsetHeight || 400;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Impossibile ottenere il contesto 2D dal canvas');
    }

    // Converte i dati dal formato Google Charts al formato Chart.js
    const [, ...dataRows] = data; // Rimuove la riga header
    
    // Filtra righe non valide
    const validRows = dataRows.filter(row =>
        row &&
        row.length >= 2 &&
        row[0] != null &&
        row[1] != null &&
        !isNaN(Number(row[1]))
    );
    
    if (validRows.length === 0) {
        throw new Error('Nessun dato valido per il grafico');
    }
    
    const labels = validRows.map(row => String(row[0]));
    const values = validRows.map(row => Number(row[1]));

    // Applica override opzioni legenda se richiesto (es. mobile)
    let legendOptions = options.plugins && options.plugins.legend ? options.plugins.legend : undefined;
    let titleOptions = options.plugins && options.plugins.title ? options.plugins.title : undefined;
    let tooltipOptions = options.plugins && options.plugins.tooltip ? options.plugins.tooltip : undefined;
    const chartConfig = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#43e97b', '#f9ea8f', '#f67019', '#a259f7', '#e14eca', '#00c9a7'
                ],
                borderWidth: 3,
                borderColor: '#fff',
                hoverBorderWidth: 6,
                hoverBorderColor: '#222'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: options.cutout || '38%',
            plugins: {
                title: titleOptions || {
                    display: true,
                    text: options.title || 'Grafico a Torta',
                    font: { size: 24, weight: 'bold' },
                    align: 'start',
                    padding: { top: 0, bottom: 30, right: 40 }
                },
                legend: legendOptions || {
                    display: true,
                    position: 'right',
                    align: 'center',
                    maxWidth: 220,
                    labels: {
                        boxWidth: 20,
                        font: { size: 15, weight: 'bold' },
                        padding: 10
                    }
                },
                tooltip: tooltipOptions || {
                    enabled: true,
                    backgroundColor: '#222',
                    borderColor: '#fff',
                    borderWidth: 2,
                    titleFont: { size: 18, weight: 'bold' },
                    bodyFont: { size: 16 },
                    callbacks: {
                        label: ctx => `${ctx.label || 'N/A'}: ${ctx.parsed || 0}`
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeOutElastic'
            },
            layout: options.layout || { padding: 40 },
            hoverOffset: options.hoverOffset || 36,
            onHover: (event, chartElement) => {
                if (chartElement.length) {
                    event.native.target.style.cursor = 'pointer';
                } else {
                    event.native.target.style.cursor = 'default';
                }
            }
        }
    };

    return new Chart(ctx, chartConfig);
}

export { showLoadingInContainer, showErrorInContainer, showMessageInContainer } from './chartService.js';
