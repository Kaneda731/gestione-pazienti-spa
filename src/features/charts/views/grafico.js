// src/features/charts/views/grafico.js
import { navigateTo } from '../../../app/router.js';
import { getChartData, getFilterOptionsForChart } from './grafico-api.js';
import {
    dom,
    initializeUI,
    cleanupUI,
    populateFilters,
    getFilters,
    resetFilters,
    drawChart,
    drawChartWithCurrentData,
    showLoading,
    showError
} from './grafico-ui.js';

async function applyFiltersAndDrawChart() {
    const filters = getFilters();
    try {
        await drawChartWithCurrentData(filters);
    } catch (error) {
        showError(error.message);
    }
}

function setupEventListeners() {
    dom.applyButton.addEventListener('click', applyFiltersAndDrawChart);
    dom.resetButton.addEventListener('click', resetFilters);
    
    // Il back button è gestito globalmente, ma se serve logica specifica va qui.
    // document.querySelector('.btn-back-menu').addEventListener('click', () => navigateTo('home'));
}

export async function initGraficoView() {
    initializeUI();
    
    try {
        const options = await getFilterOptionsForChart();
        populateFilters(options);
    } catch (error) {
        console.error('Errore durante l\'inizializzazione della vista grafico:', error);
        showError(error.message || 'Errore durante il caricamento dei filtri.');
    }

    setupEventListeners();

    return cleanupUI;
}