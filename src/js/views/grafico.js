// src/js/views/grafico.js
import { supabase } from '../supabase.js';
import { navigateTo } from '../router.js';

export async function initGraficoView() {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;

    const repartoFilter = document.getElementById('filter-reparto');
    const provenienzaFilter = document.getElementById('filter-provenienza');
    const diagnosiFilter = document.getElementById('filter-diagnosi');
    const assistenzaFilter = document.getElementById('filter-assistenza');
    const startDateFilter = document.getElementById('filter-start-date');
    const endDateFilter = document.getElementById('filter-end-date');
    const applyButton = document.getElementById('apply-filters-btn');
    const backButton = chartContainer.closest('.card').querySelector('button[data-view="home"]');

    google.charts.load('current', { 'packages': ['corechart'] });

    const populateFilter = async (columnName, selectElement) => {
        try {
            const { data, error } = await supabase.from('pazienti').select(columnName);
            if (error) throw error;
            const uniqueValues = [...new Set(data.map(item => item[columnName]))].sort();
            selectElement.innerHTML = `<option value="">Tutti</option>`;
            uniqueValues.forEach(value => {
                if(value) selectElement.innerHTML += `<option value="${value}">${value}</option>`;
            });
        } catch (error) {
            console.error(`Errore caricamento filtro ${columnName}:`, error);
            selectElement.innerHTML = `<option value="">Errore</option>`;
        }
    };

    await Promise.all([
        populateFilter('reparto_appartenenza', repartoFilter),
        populateFilter('reparto_provenienza', provenienzaFilter),
        populateFilter('diagnosi', diagnosiFilter)
    ]);

    const drawChart = async () => {
        chartContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border"></div></div>';
        try {
            let query = supabase.from('pazienti').select('diagnosi');

            if (repartoFilter.value) query = query.eq('reparto_appartenenza', repartoFilter.value);
            if (provenienzaFilter.value) query = query.eq('reparto_provenienza', provenienzaFilter.value);
            if (diagnosiFilter.value) query = query.eq('diagnosi', diagnosiFilter.value);
            if (assistenzaFilter.value) query = query.eq('livello_assistenza', assistenzaFilter.value);
            if (startDateFilter.value) query = query.gte('data_ricovero', startDateFilter.value);
            if (endDateFilter.value) query = query.lte('data_ricovero', endDateFilter.value);

            const { data, error } = await query;
            if (error) throw error;

            if (data.length === 0) {
                chartContainer.innerHTML = '<p class="text-muted text-center mt-5">Nessun dato trovato per i filtri selezionati.</p>';
                return;
            }
            
            const counts = data.reduce((acc, { diagnosi }) => (acc[diagnosi] = (acc[diagnosi] || 0) + 1, acc), {});
            const dataTable = google.visualization.arrayToDataTable([['Diagnosi', 'Numero'], ...Object.entries(counts)]);
            const options = {
                pieHole: 0.4,
                legend: { position: 'labeled' },
                chartArea: { left: 10, top: 20, width: '90%', height: '85%' }
            };
            new google.visualization.PieChart(chartContainer).draw(dataTable, options);
        } catch (error) {
            chartContainer.innerHTML = `<div class="alert alert-danger">Errore: ${error.message}</div>`;
        }
    };

    applyButton.addEventListener('click', drawChart);
    backButton.addEventListener('click', () => navigateTo('home'));
}
