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
    const ChartJs = await loadChartJs();
    // Funzione per creare il canvas e applicare gli stili
    function createChartCanvas(container) {
        container.innerHTML = '';
        container.style.padding = '0';
        const canvas = document.createElement('canvas');
        canvas.id = 'chartCanvas';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.background = 'linear-gradient(135deg,#e3eef7 0%,#c8d8e8 100%)';
        container.appendChild(canvas);
        return canvas;
    }

    // Funzione per validare e convertire i dati
    function parseChartData(data) {
        const [, ...dataRows] = data;
        const validRows = dataRows.filter(row =>
            row && row.length >= 2 && row[0] != null && row[1] != null && !isNaN(Number(row[1]))
        );
        if (validRows.length === 0) throw new Error('Nessun dato valido per il grafico');
        return {
            labels: validRows.map(row => String(row[0])),
            values: validRows.map(row => Number(row[1]))
        };
    }

    // Funzione per generare le opzioni Chart.js
    function getChartOptions(options, isMobile) {
        const legendLabels = isMobile
            ? { boxWidth: 14, font: { size: 12, weight: 'bold' }, padding: 6 }
            : { boxWidth: 20, font: { size: 15, weight: 'bold' }, padding: 10 };
        const legendPosition = isMobile ? 'bottom' : 'right';
        let legendOptions = options.plugins && options.plugins.legend ? options.plugins.legend : undefined;
        let titleOptions = options.plugins && options.plugins.title ? options.plugins.title : undefined;
        let tooltipOptions = options.plugins && options.plugins.tooltip ? options.plugins.tooltip : undefined;
        return {
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
                    position: legendPosition,
                    align: 'center',
                    labels: legendLabels
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
            layout: { padding: 0 },
            hoverOffset: options.hoverOffset || 36,
            onHover: (event, chartElement) => {
                if (chartElement.length) {
                    event.native.target.style.cursor = 'pointer';
                } else {
                    event.native.target.style.cursor = 'default';
                }
            }
        };
    }

    // --- Logica principale ---
    const canvas = createChartCanvas(container);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossibile ottenere il contesto 2D dal canvas');
    const { labels, values } = parseChartData(data);
    const isMobile = window.innerWidth <= 767;
    const chartOptions = getChartOptions(options, isMobile);

    const chartConfig = {
        type: 'doughnut',
        data: {
            labels,
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
        options: chartOptions
    };
    return new ChartJs(ctx, chartConfig);
}

export { showLoadingInContainer, showErrorInContainer, showMessageInContainer } from './chartService.js';
