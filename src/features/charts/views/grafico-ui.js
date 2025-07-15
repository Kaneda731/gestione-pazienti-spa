// src/features/charts/views/grafico-ui.js
import { populateSelectWithOptions } from '../../../shared/utils/index.js';
import { initCustomSelects, updateCustomSelect } from '../../../shared/components/forms/CustomSelect.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { createPieChart } from '../services/chartjsService.js';

let datepickerInstance = null;

// Contiene gli elementi del DOM per un accesso più facile
export const dom = {
    get chartContainer() { return document.getElementById('chart-container'); },
    get repartoFilter() { return document.getElementById('filter-reparto'); },
    get provenienzaFilter() { return document.getElementById('filter-provenienza'); },
    get diagnosiFilter() { return document.getElementById('filter-diagnosi'); },
    get assistenzaFilter() { return document.getElementById('filter-assistenza'); },
    get infettoFilter() { return document.getElementById('filter-infetto'); },
    get startDateFilter() { return document.getElementById('filter-start-date'); },
    get endDateFilter() { return document.getElementById('filter-end-date'); },
    get applyButton() { return document.getElementById('apply-filters-btn'); },
    get resetButton() { return document.getElementById('reset-filters-btn'); },
};

/**
 * Inizializza i componenti della UI (datepicker, custom selects).
 */
export function initializeUI() {
    initCustomSelects('#filter-reparto, #filter-provenienza, #filter-diagnosi, #filter-assistenza');
    datepickerInstance = new CustomDatepicker('[data-datepicker]', {
        dateFormat: "d/m/Y",
    });
    showInitialMessage();
}

/**
 * Distrugge i componenti della UI per il cleanup.
 */
export function cleanupUI() {
    if (datepickerInstance) {
        datepickerInstance.destroy();
        datepickerInstance = null;
    }
}

/**
 * Popola i select dei filtri con le opzioni caricate.
 * @param {object} options - L'oggetto contenente le opzioni per i filtri.
 */
export function populateFilters(options) {
    populateSelectWithOptions(dom.repartoFilter, options.repartoOptions);
    updateCustomSelect('#filter-reparto');

    populateSelectWithOptions(dom.provenienzaFilter, options.provenienzaOptions);
    updateCustomSelect('#filter-provenienza');

    populateSelectWithOptions(dom.diagnosiFilter, options.diagnosiOptions);
    updateCustomSelect('#filter-diagnosi');

    // Popola il filtro Infetto (Sì/No/Tutti)
    if (dom.infettoFilter) {
        dom.infettoFilter.innerHTML = `
            <option value="">Tutti</option>
            <option value="true">Sì</option>
            <option value="false">No</option>
        `;
    }
}

/**
 * Legge i valori correnti dai campi dei filtri.
 * @returns {object} Un oggetto con i filtri selezionati.
 */
export function getFilters() {
    return {
        reparto: dom.repartoFilter.value,
        provenienza: dom.provenienzaFilter.value,
        diagnosi: dom.diagnosiFilter.value,
        assistenza: dom.assistenzaFilter.value,
        infetto: dom.infettoFilter.value,
        startDate: dom.startDateFilter.value,
        endDate: dom.endDateFilter.value,
    };
}

/**
 * Resetta tutti i filtri ai loro valori di default.
 */
export function resetFilters() {
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
    showInitialMessage();
}

/**
 * Disegna il grafico a torta con i dati forniti.
 * @param {Array} data - I dati da visualizzare.
 */
export async function drawChart(data) {
    if (!data || data.length === 0) {
        showMessage('Nessun dato trovato per i filtri selezionati.');
        return;
    }

    // Filtra i dati validi e gestisce valori null/undefined
    const validData = data.filter(item => item && item.diagnosi && item.diagnosi.trim() !== '');
    
    if (validData.length === 0) {
        showMessage('Nessuna diagnosi valida trovata nei dati selezionati.');
        return;
    }

    const counts = validData.reduce((acc, { diagnosi }) => {
        const key = diagnosi ? diagnosi.trim() : 'Non specificata';
        if (key) {
            acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
    }, {});

    const entries = Object.entries(counts);
    if (entries.length === 0) {
        showMessage('Nessuna diagnosi valida trovata nei dati selezionati.');
        return;
    }

    const chartData = [['Diagnosi', 'Numero Pazienti'], ...entries];
    
    const chartOptions = {
        title: 'Distribuzione Diagnosi dei Pazienti Filtrati',
        responsive: true,
        maintainAspectRatio: false,
    };

    try {
        await createPieChart(dom.chartContainer, chartData, chartOptions);
    } catch (chartError) {
        console.error('Errore durante la creazione del grafico:', chartError);
        showError(`Errore nella visualizzazione del grafico: ${chartError.message}`);
    }
}

// Funzioni per mostrare stati nella UI
export function showLoading() {
    dom.chartContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
}

export function showInitialMessage() {
    dom.chartContainer.innerHTML = '<p class="text-muted">Seleziona i filtri e clicca "Applica" per visualizzare il grafico.</p>';
}

export function showMessage(message) {
    dom.chartContainer.innerHTML = `<p class="text-muted">${message}</p>`;
}

export function showError(errorMessage) {
    dom.chartContainer.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
}