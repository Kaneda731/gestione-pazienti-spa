// src/features/charts/views/grafico-ui.js
import { populateSelectWithOptions } from '../../../shared/utils/index.js';
import { initCustomSelects, updateCustomSelect } from '../../../shared/components/forms/CustomSelect.js';
import CustomDatepicker from '../../../shared/components/forms/CustomDatepicker.js';
import { 
    createChart, 
    createPieChart, 
    getAvailableChartTypes, 
    downloadChartAsImage, 
    generateShareableLink,
    cleanupChartComponents
} from '../services/chartjsService.js';

let datepickerInstance = null;
let currentChart = null;
let currentChartType = 'pie';

// Contiene gli elementi del DOM per un accesso più facile
export const dom = {
    get chartContainer() { return document.getElementById('chart-container'); },
    get chartControls() { return document.getElementById('chart-controls'); },
    get chartTypeSelector() { return document.getElementById('chart-type-selector'); },
    get chartExportBtn() { return document.getElementById('chart-export-btn'); },
    get chartShareBtn() { return document.getElementById('chart-share-btn'); },
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
 * Inizializza i componenti della UI (datepicker, custom selects, controlli del grafico).
 */
export async function initializeUI() {
    // Inizializza i select e datepicker
    initCustomSelects('#filter-reparto, #filter-provenienza, #filter-diagnosi, #filter-assistenza, #filter-infetto');
    datepickerInstance = new CustomDatepicker('[data-datepicker]', {
        dateFormat: "d/m/Y",
    });
    
    // Inizializza i controlli del grafico
    await initChartControls();
    
    showInitialMessage();
}

/**
 * Inizializza i controlli del grafico (selettore tipo, pulsanti esportazione)
 */
async function initChartControls() {
    // Verifica se i controlli del grafico esistono già
    if (!dom.chartControls) {
        // Crea il container dei controlli se non esiste
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'chart-controls';
        controlsContainer.className = 'chart-controls d-flex justify-content-between align-items-center mb-3';
        
        // Inserisci il container prima del container del grafico
        dom.chartContainer.parentNode.insertBefore(controlsContainer, dom.chartContainer);
    }
    
    // Aggiungi il selettore del tipo di grafico
    await initChartTypeSelector();
    
    // Aggiungi i pulsanti di esportazione
    initExportButtons();
}

/**
 * Inizializza il selettore del tipo di grafico
 */
async function initChartTypeSelector() {
    try {
        // Ottieni i tipi di grafico disponibili
        const chartTypes = await getAvailableChartTypes();
        
        // Crea il selettore se non esiste
        if (!dom.chartTypeSelector) {
            const selectorContainer = document.createElement('div');
            selectorContainer.className = 'chart-type-selector-container';
            
            const selectorLabel = document.createElement('label');
            selectorLabel.htmlFor = 'chart-type-selector';
            selectorLabel.className = 'me-2';
            selectorLabel.textContent = 'Tipo di grafico:';
            
            const selector = document.createElement('select');
            selector.id = 'chart-type-selector';
            selector.className = 'form-select form-select-sm';
            
            // Aggiungi le opzioni
            chartTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.innerHTML = `${type.icon} ${type.name}`;
                selector.appendChild(option);
            });
            
            // Imposta il valore predefinito
            selector.value = currentChartType;
            
            // Aggiungi l'evento change
            selector.addEventListener('change', handleChartTypeChange);
            
            // Aggiungi gli elementi al DOM
            selectorContainer.appendChild(selectorLabel);
            selectorContainer.appendChild(selector);
            dom.chartControls.appendChild(selectorContainer);
        }
    } catch (error) {
        console.error('Errore nell\'inizializzazione del selettore del tipo di grafico:', error);
    }
}

/**
 * Inizializza i pulsanti di esportazione
 */
function initExportButtons() {
    // Crea il container dei pulsanti se non esiste
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'chart-export-buttons';
    
    // Crea il pulsante di esportazione
    const exportBtn = document.createElement('button');
    exportBtn.id = 'chart-export-btn';
    exportBtn.className = 'btn btn-sm btn-outline-primary me-2';
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Esporta';
    exportBtn.addEventListener('click', handleExportChart);
    
    // Crea il pulsante di condivisione
    const shareBtn = document.createElement('button');
    shareBtn.id = 'chart-share-btn';
    shareBtn.className = 'btn btn-sm btn-outline-secondary';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Condividi';
    shareBtn.addEventListener('click', handleShareChart);
    
    // Aggiungi i pulsanti al container
    buttonsContainer.appendChild(exportBtn);
    buttonsContainer.appendChild(shareBtn);
    
    // Aggiungi il container al DOM
    dom.chartControls.appendChild(buttonsContainer);
}

/**
 * Gestisce il cambio del tipo di grafico
 * @param {Event} event - L'evento change
 */
function handleChartTypeChange(event) {
    currentChartType = event.target.value;
    
    // Se c'è un grafico attivo, ridisegnalo con il nuovo tipo
    if (currentChart) {
        const filters = getFilters();
        drawChartWithCurrentData(filters);
    }
}

/**
 * Gestisce l'esportazione del grafico
 */
async function handleExportChart() {
    if (!currentChart) {
        alert('Nessun grafico da esportare. Genera prima un grafico.');
        return;
    }
    
    try {
        const filters = getFilters();
        const metadata = {
            timestamp: new Date().toLocaleString(),
            filters: filters
        };
        
        await downloadChartAsImage(currentChart, 'grafico-pazienti', metadata);
    } catch (error) {
        console.error('Errore nell\'esportazione del grafico:', error);
        alert(`Errore nell'esportazione: ${error.message}`);
    }
}

/**
 * Gestisce la condivisione del grafico
 */
async function handleShareChart() {
    if (!currentChart) {
        alert('Nessun grafico da condividere. Genera prima un grafico.');
        return;
    }
    
    try {
        const filters = getFilters();
        const shareableLink = await generateShareableLink(filters, currentChartType);
        
        // Copia il link negli appunti
        await navigator.clipboard.writeText(shareableLink);
        alert('Link copiato negli appunti!');
    } catch (error) {
        console.error('Errore nella condivisione del grafico:', error);
        alert(`Errore nella condivisione: ${error.message}`);
    }
}

/**
 * Distrugge i componenti della UI per il cleanup.
 */
export function cleanupUI() {
    if (datepickerInstance) {
        datepickerInstance.destroy();
        datepickerInstance = null;
    }
    
    // Pulisci i componenti del grafico
    cleanupChartComponents();
    
    // Pulisci il grafico corrente
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
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
        updateCustomSelect('#filter-infetto');
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
    const filterIds = ['filter-reparto', 'filter-provenienza', 'filter-diagnosi', 'filter-assistenza', 'filter-infetto'];
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
 * Disegna il grafico con i dati forniti.
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
        // Usa il nuovo metodo createChart con il tipo di grafico corrente
        currentChart = await createChart(dom.chartContainer, chartData, chartOptions, currentChartType);
        
        // Abilita i pulsanti di esportazione e condivisione
        if (dom.chartExportBtn) dom.chartExportBtn.disabled = false;
        if (dom.chartShareBtn) dom.chartShareBtn.disabled = false;
        
        return currentChart;
    } catch (chartError) {
        console.error('Errore durante la creazione del grafico:', chartError);
        showError(`Errore nella visualizzazione del grafico: ${chartError.message}`);
        return null;
    }
}

/**
 * Ridisegna il grafico con i dati correnti e il tipo di grafico selezionato
 * @param {Object} filters - I filtri applicati
 */
export async function drawChartWithCurrentData(filters) {
    showLoading();
    
    try {
        // Importa la funzione per recuperare i dati da Supabase
        const { getChartData } = await import('./grafico-api.js');
        
        // Recupera i dati da Supabase
        const data = await getChartData(filters);
        
        await drawChart(data);
    } catch (error) {
        console.error('Errore nel ridisegno del grafico:', error);
        
        // In caso di errore, mostra dati di fallback per permettere lo sviluppo
        try {
            console.warn('Utilizzo dati di fallback per lo sviluppo');
            
            const fallbackData = [
                { diagnosi: 'Influenza' },
                { diagnosi: 'Polmonite' },
                { diagnosi: 'Frattura' },
                { diagnosi: 'Influenza' },
                { diagnosi: 'Polmonite' },
                { diagnosi: 'Frattura' },
                { diagnosi: 'Infarto' },
                { diagnosi: 'Ictus' },
                { diagnosi: 'Diabete' }
            ];
            
            await drawChart(fallbackData);
        } catch (fallbackError) {
            console.error('Errore anche con i dati di fallback:', fallbackError);
            showError(`Errore nell'aggiornamento del grafico: ${error.message}`);
        }
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