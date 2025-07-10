// src/features/charts/views/grafico.js
import { supabase } from '../../../core/services/supabaseClient.js';
import { navigateTo } from '../../../app/router.js';
import { getFilterOptions, populateSelectWithOptions } from '../../../shared/utils/index.js';
import { initCustomSelects } from '../../../shared/components/forms/CustomSelect.js';

import { 
    showLoadingInContainer, 
    showErrorInContainer, 
    showMessageInContainer 
} from '../services/chartService.js';

// Centralizza la scelta del servizio grafico: ora sempre Chart.js anche su mobile
let createPieChart;
async function getPieChartService() {
    // Usa sempre Chart.js, sia su desktop che su mobile
    const mod = await import('../services/chartjsService.js');
    return mod.createPieChart;
}

// Caching degli elementi del DOM
const dom = {};

/**
 * Resetta tutti i filtri ai loro valori di default.
 */
function resetFilters() {
    const filterIds = ['filter-reparto', 'filter-provenienza', 'filter-diagnosi', 'filter-assistenza'];
    filterIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.value = '';
            if (select.customSelectInstance) {
                select.customSelectInstance.setValue('');
            }
        }
    });
    dom.startDateFilter.value = '';
    dom.endDateFilter.value = '';
    showMessageInContainer(dom.chartContainer, 'Seleziona i filtri e clicca "Applica" per visualizzare il grafico.');
}

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
    showLoadingInContainer(dom.chartContainer);
    try {
        const query = buildChartQuery();
        const { data, error } = await query;
        if (error) throw error;

        if (data.length === 0) {
            showMessageInContainer(dom.chartContainer, 'Nessun dato trovato per i filtri selezionati.');
            return;
        }

        // Elabora i dati per il grafico
        const counts = data.reduce((acc, { diagnosi }) => {
            acc[diagnosi] = (acc[diagnosi] || 0) + 1;
            return acc;
        }, {});

        const chartData = [['Diagnosi', 'Numero Pazienti'], ...Object.entries(counts)];

        // Opzioni avanzate Chart.js per desktop
        let chartOptions = {
            title: 'Distribuzione Diagnosi dei Pazienti Filtrati',
            pieHole: 0.4,
            legend: { position: 'labeled' },
            chartArea: { left: 10, top: 20, width: '90%', height: '85%' }
        };

        if (isDesktop()) {
            chartOptions = {
                title: 'Distribuzione Diagnosi dei Pazienti Filtrati',
                plugins: {
                    legend: {
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
                    title: {
                        display: true,
                        text: 'Distribuzione Diagnosi dei Pazienti Filtrati',
                        font: { size: 22, weight: 'bold' },
                        align: 'start',
                        padding: { top: 0, bottom: 30, right: 40 }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#222',
                        borderColor: '#fff',
                        borderWidth: 2,
                        titleFont: { size: 16, weight: 'bold' },
                        bodyFont: { size: 15 },
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.parsed}`
                        }
                    }
                },
                cutout: '40%',
                animation: {
                    animateRotate: true,
                    animateScale: true
                },
                layout: {
                    padding: 30
                },
                hoverOffset: 24,
                responsive: true,
                maintainAspectRatio: false
            };
        }

        // Scegli il servizio grafico giusto
        const pieChartService = await getPieChartService();
        await pieChartService(dom.chartContainer, chartData, chartOptions);

    } catch (error) {
        console.error('Errore durante la creazione del grafico:', error);
        showErrorInContainer(dom.chartContainer, `Impossibile caricare il grafico. ${error.message}`);
    }
}

/**
 * Inizializza gli event listener per la vista del grafico.
 */
function setupEventListeners() {
    dom.applyButton.addEventListener('click', drawChart);
    dom.resetButton.addEventListener('click', resetFilters);
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
    dom.resetButton = document.getElementById('reset-filters-btn');
    dom.backButton = view.querySelector('button[data-view="home"]');

    try {
        // 1. Recupera i dati per i filtri in parallelo
        const [repartoOptions, provenienzaOptions, diagnosiOptions] = await Promise.all([
            getFilterOptions('reparto_appartenenza'),
            getFilterOptions('reparto_provenienza'),
            getFilterOptions('diagnosi')
        ]);

        // 2. Popola i select con i dati ottenuti
        populateSelectWithOptions(dom.repartoFilter, repartoOptions);
        populateSelectWithOptions(dom.provenienzaFilter, provenienzaOptions);
        populateSelectWithOptions(dom.diagnosiFilter, diagnosiOptions);

        // 3. Inizializza i custom select
        initCustomSelects('#filter-reparto, #filter-provenienza, #filter-diagnosi, #filter-assistenza');

        // 4. Imposta gli event listener
        setupEventListeners();

        // 5. Mostra messaggio iniziale
        showMessageInContainer(dom.chartContainer, 'Seleziona i filtri e clicca "Applica" per visualizzare il grafico.');

    } catch (error) {
        console.error('Errore durante l\'inizializzazione della vista grafico:', error);
        showErrorInContainer(dom.chartContainer, `Errore durante l'inizializzazione: ${error.message}`);
    }
}
