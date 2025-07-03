// src/js/views/grafico.js
import { supabase } from '../supabase.js';
import { navigateTo } from '../router.js';
import { populateFilter } from '../utils.js';

// Caching degli elementi del DOM
const dom = {};



/**
 * Costruisce la query a Supabase basandosi sui filtri selezionati.
 * @returns {object} - L'oggetto query di Supabase.
 */
function buildChartQuery() {
    let query = supabase.from('pazienti').select('diagnosi');

    if (dom.repartoFilter.value) query = query.eq('reparto_appartenenza', dom.repartoFilter.value);
    if (dom.provenienzaFilter.value) query = query.eq('reparto_provenienza', dom.provenienzaFilter.value);
    if (dom.diagnosiFilter.value) query = query.eq('diagnosi', dom.diagnosiFilter.value);
    if (dom.assistenzaFilter.value) query = query.eq('livello_assistenza', dom.assistenzaFilter.value);
    if (dom.startDateFilter.value) query = query.gte('data_ricovero', dom.startDateFilter.value);
    if (dom.endDateFilter.value) query = query.lte('data_ricovero', dom.endDateFilter.value);

    return query;
}

/**
 * Disegna il grafico a torta basandosi sui dati filtrati.
 */
async function drawChart() {
    dom.chartContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary"></div></div>';
    
    try {
        const query = buildChartQuery();
        const { data, error } = await query;
        if (error) throw error;

        if (data.length === 0) {
            dom.chartContainer.innerHTML = '<p class="text-muted text-center mt-5">Nessun dato trovato per i filtri selezionati.</p>';
            return;
        }
        
        const counts = data.reduce((acc, { diagnosi }) => {
            acc[diagnosi] = (acc[diagnosi] || 0) + 1;
            return acc;
        }, {});

        const dataTable = google.visualization.arrayToDataTable([['Diagnosi', 'Numero Pazienti'], ...Object.entries(counts)]);
        const options = {
            title: 'Distribuzione Diagnosi dei Pazienti Filtrati',
            pieHole: 0.4,
            legend: { position: 'labeled' },
            chartArea: { left: 10, top: 20, width: '90%', height: '85%' }
        };
        
        const chart = new google.visualization.PieChart(dom.chartContainer);
        chart.draw(dataTable, options);

    } catch (error) {
        console.error('Errore durante la creazione del grafico:', error);
        dom.chartContainer.innerHTML = `<div class="alert alert-danger"><strong>Errore:</strong> Impossibile caricare il grafico. ${error.message}</div>`;
    }
}

/**
 * Inizializza gli event listener per la vista del grafico.
 */
function setupEventListeners() {
    dom.applyButton.addEventListener('click', drawChart);
    dom.backButton.addEventListener('click', () => navigateTo('home'));
}

/**
 * Inizializza la vista del grafico.
 */
export async function initGraficoView() {
    const view = document.querySelector('#app-container .view');
    if (!view) return;

    // Caching degli elementi DOM
    dom.chartContainer = document.getElementById('chart-container');
    dom.repartoFilter = document.getElementById('filter-reparto');
    dom.provenienzaFilter = document.getElementById('filter-provenienza');
    dom.diagnosiFilter = document.getElementById('filter-diagnosi');
    dom.assistenzaFilter = document.getElementById('filter-assistenza');
    dom.startDateFilter = document.getElementById('filter-start-date');
    dom.endDateFilter = document.getElementById('filter-end-date');
    dom.applyButton = document.getElementById('apply-filters-btn');
    dom.backButton = view.querySelector('button[data-view="home"]');

    // Carica Google Charts e popola i filtri in parallelo
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(async () => {
        await Promise.all([
            populateFilter('reparto_appartenenza', dom.repartoFilter),
            populateFilter('reparto_provenienza', dom.provenienzaFilter),
            populateFilter('diagnosi', dom.diagnosiFilter)
        ]);
        setTimeout(() => setupEventListeners(), 0);
    });
}
